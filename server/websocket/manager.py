"""
WebSocket Connection Manager
In-memory registry of user_id → WebSocket for this server instance.
Also handles presence tracking in Redis.

Decoupled from PubSubListener — receives messages via a registered
callback (handle_pubsub_message) rather than holding a subscriber reference.
"""
import uuid
import logging
from fastapi.websockets import WebSocket
from redis.asyncio import Redis

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Single responsibility: track WebSocket connections and deliver messages.

    Does NOT know about PubSubListener. The subscriber calls
    handle_pubsub_message() as a plain callback — this class doesn't
    care how the message arrived (Redis, test, another source, etc).

    Internal state:
        connections:  user_id → WebSocket
        user_chats:   user_id → [chat_id, ...]
        chat_members: chat_id → {user_id, ...}
    """

    def __init__(self, redis_client: Redis):
        # Redis is used ONLY for presence tracking (not pub/sub)
        self.redis = redis_client
        self.connections: dict[uuid.UUID, WebSocket] = {}
        self.user_chats: dict[uuid.UUID, list[uuid.UUID]] = {}
        self.chat_members: dict[uuid.UUID, set[uuid.UUID]] = {}

    # ── Connection lifecycle ──────────────────────────────────────────────

    async def register(
        self,
        user_id: uuid.UUID,
        websocket: WebSocket,
        chat_ids: list[uuid.UUID],
    ):
        """
        Register a user's WebSocket connection.
        chat_ids must already be validated from DB before calling this.
        """
        # Close existing connection if user reconnects from another tab/device
        if user_id in self.connections:
            try:
                await self.connections[user_id].close(
                    code=4001, reason="New connection opened"
                )
            except Exception:
                pass

        self.connections[user_id] = websocket
        self.user_chats[user_id] = chat_ids

        for chat_id in chat_ids:
            self.chat_members.setdefault(chat_id, set()).add(user_id)

        # Presence: simple Redis key with TTL — refreshed on ping
        await self.redis.set(f"presence:{user_id}", "online", ex=60)

        logger.info(f"User {user_id} registered ({len(chat_ids)} chats)")

    async def unregister(self, user_id: uuid.UUID) -> list[uuid.UUID]:
        """
        Remove a user's WebSocket connection.
        Returns the list of chat_ids that now have NO local members
        so the caller (route) can unsubscribe them from Redis pub/sub.
        """
        chat_ids = self.user_chats.pop(user_id, [])
        self.connections.pop(user_id, None)

        for chat_id in chat_ids:
            members = self.chat_members.get(chat_id)
            if members:
                members.discard(user_id)
                if not members:
                    del self.chat_members[chat_id]

        await self.redis.delete(f"presence:{user_id}")

        # Tell the caller which channels are now empty locally
        still_needed = {cid for cids in self.user_chats.values() for cid in cids}
        orphaned = [cid for cid in chat_ids if cid not in still_needed]

        logger.info(
            f"User {user_id} unregistered. "
            f"Orphaned channels to unsubscribe: {len(orphaned)}"
        )
        return orphaned

    # ── Presence ──────────────────────────────────────────────────────────

    async def refresh_presence(self, user_id: uuid.UUID):
        """Refresh the presence TTL. Called on heartbeat/ping."""
        await self.redis.set(f"presence:{user_id}", "online", ex=60)

    def is_online(self, user_id: uuid.UUID) -> bool:
        """Check if a user is connected locally on THIS server instance."""
        return user_id in self.connections

    # ── Delivery ──────────────────────────────────────────────────────────

    async def add_user_to_chat(
        self, user_id: uuid.UUID, chat_id: uuid.UUID
    ):
        """
        Dynamically add a chat to a connected user's subscription map.
        Called when a new chat is created while the user is already connected.
        """
        if user_id not in self.connections:
            return  # user not connected, nothing to do

        if user_id in self.user_chats:
            if chat_id not in self.user_chats[user_id]:
                self.user_chats[user_id].append(chat_id)
        else:
            self.user_chats[user_id] = [chat_id]

        self.chat_members.setdefault(chat_id, set()).add(user_id)
        logger.info(f"Dynamically added chat {chat_id} to user {user_id}")

    async def send_to_user(self, user_id: uuid.UUID, payload: dict):
        """Send a JSON payload directly to a specific user's WebSocket."""
        ws = self.connections.get(user_id)
        if not ws:
            logger.debug(f"User {user_id} not connected locally, skipping send")
            return
        try:
            await ws.send_json(payload)
        except Exception as e:
            logger.warning(f"Send failed for {user_id}, unregistering: {e}")
            await self.unregister(user_id)

    async def deliver_to_chat(
        self,
        chat_id: uuid.UUID,
        payload: dict,
        exclude_user_id: uuid.UUID | None = None,
    ):
        """
        Deliver payload to all locally connected members of a chat.
        Skips exclude_user_id (typically the sender).
        """
        members = set(self.chat_members.get(chat_id, set()))  # snapshot to avoid mutation issues
        for uid in members:
            if uid == exclude_user_id:
                continue
            await self.send_to_user(uid, payload)

    # ── Pub/Sub callback ──────────────────────────────────────────────────

    async def handle_pubsub_message(self, decoded: dict):
        """
        Callback registered with PubSubListener in main.py.

        This is the ONLY entry point for Redis pub/sub messages.
        PubSubListener calls this without knowing what it does.

        Expected decoded format (from PubSubListener._decode):
            {
                "channel": "chat:<uuid>",
                "data": { "type": "message", "sender_id": "...", ... }
            }
        """
        try:
            channel: str = decoded["channel"]
            data: dict = decoded["data"]

            # Extract chat_id from "chat:<uuid>"
            chat_id = uuid.UUID(channel.split(":", 1)[1])

            # Exclude sender — they already got an ack directly
            sender_id_str = data.get("sender_id") or data.get("user_id")
            sender_id = uuid.UUID(sender_id_str) if sender_id_str else None

            msg_type = data.get("type", "unknown")
            members = self.chat_members.get(chat_id, set())
            logger.debug(
                f"PubSub [{msg_type}] chat={chat_id} "
                f"sender={sender_id} local_members={len(members)}"
            )

            await self.deliver_to_chat(
                chat_id=chat_id,
                payload=data,
                exclude_user_id=sender_id,
            )

        except (KeyError, ValueError) as e:
            logger.error(
                f"handle_pubsub_message: bad message format: {e} | {decoded}"
            )
        except Exception as e:
            logger.error(
                f"handle_pubsub_message: unexpected error: {e} | {decoded}"
            )