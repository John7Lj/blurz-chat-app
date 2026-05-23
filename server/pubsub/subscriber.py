# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.


import json
import uuid
import asyncio
import logging
from typing import Callable, Awaitable
from redis.asyncio import Redis
from redis.exceptions import RedisError


logger = logging.getLogger(__name__)

# Type alias — any async function that accepts a decoded dict
MessageHandler = Callable[[dict], Awaitable[None]]

class PubSubListener:
    """
    Listens to Redis Pub/Sub channels and fires a callback for every message.
    Has NO knowledge of ConnectionManager, WebSockets, or delivery logic.

    Single responsibility: receive raw Redis messages → decode → call handler.

    Resilience:
        - Keeps self.redis reference to recreate pubsub on crash
        - Tracks _subscribed_channels so reconnect can re-subscribe
        - listen() auto-reconnects with exponential backoff
    """

    def __init__(self, redis_client: Redis, poll_timeout: float = 1.0):
        self.redis = redis_client
        self.pubsub = self.redis.pubsub()
        self._handler: MessageHandler | None = None
        self._running = False
        self._poll_timeout = poll_timeout
        self._subscribed_channels: set[str] = set()

    def set_handler(self, handler: MessageHandler):
        """
        Register the callback that will be called for every incoming message.
        Called once in main.py — subscriber never imports the handler directly.

        Example:
            subscriber.set_handler(manager.handle_pubsub_message)
        """
        self._handler = handler
        logger.info(f"PubSub handler registered: {getattr(handler, '__qualname__', repr(handler))}")

    async def subscribe(self, chat_ids: list[uuid.UUID]):
        """Subscribe to one or more chat channels."""
        if not chat_ids:
            return
        channels = [f"chat:{cid}" for cid in chat_ids]
        await self.pubsub.subscribe(*channels)
        self._subscribed_channels.update(channels)
        logger.info(f"Subscribed to {len(channels)} channel(s)")

    async def unsubscribe(self, chat_ids: list[uuid.UUID]):
        """Unsubscribe from one or more chat channels."""
        if not chat_ids:
            return
        channels = [f"chat:{cid}" for cid in chat_ids]
        await self.pubsub.unsubscribe(*channels)
        self._subscribed_channels.difference_update(channels)
        logger.info(f"Unsubscribed from {len(channels)} channel(s)")

    async def listen(self):
        """
        Background loop — runs as a single asyncio task for the server lifetime.

        Responsibilities (only these):
          1. Receive raw Redis messages
          2. Decode str → dict
          3. Fire self._handler(decoded_data)

        Resilience:
          - On crash, recreates self.pubsub from self.redis
          - Re-subscribes to all tracked channels
          - Exponential backoff: 1s → 2s → 4s → ... → 30s cap

        Does NOT know what the handler does with the data.
        """
        if not self._handler:
            logger.error("Call set_handler() before listen().")
            return

        self._running = True
        backoff = 1
        logger.info("PubSub listener started")

        while self._running:
            try:
                # Avoid calling get_message if there are no active subscriptions to prevent
                # "pubsub connection not set" RuntimeError spam on startup or when idle.
                if not self._subscribed_channels:
                    await asyncio.sleep(self._poll_timeout)
                    continue

                raw = await self.pubsub.get_message(
                    ignore_subscribe_messages=True,
                    timeout=self._poll_timeout,
                )
                if raw is not None:
                    await self._process_one(raw)
                backoff = 1


            except asyncio.CancelledError:
                logger.info("PubSub listener cancelled")
                break
            except RedisError as e:
                logger.error(f"Redis error: {e}. Reconnecting in {backoff}s...")
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 30)
                await self._reconnect()

            except Exception as e:
                logger.error(f"Unexpected error: {e}. Reconnecting in {backoff}s...")
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 30)
                await self._reconnect()

        await self._close()

    async def stop(self):
        """Signal the listener to stop and close the pubsub connection."""
        self._running = False

    async def _process_one(self, raw: dict) -> None:
        """Decode one message and call the handler. Errors are logged, not raised."""
        if raw["type"] != "message":
            return
        try:
            decoded = self._decode(raw)
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            logger.error(f"Failed to decode message: {e} | raw={raw}")
            return
        try:
            await self._handler(decoded)
        except Exception as e:
            logger.error(f"Handler error: {e}")

    async def _reconnect(self) -> None:
        """Recreate pubsub connection and re-subscribe to all active channels."""
        try:
            await self.pubsub.aclose()
        except Exception:
            pass
        self.pubsub = self.redis.pubsub()
        if self._subscribed_channels:
            try:
                await self.pubsub.subscribe(*self._subscribed_channels)
                logger.info(f"Re-subscribed to {len(self._subscribed_channels)} channel(s)")
            except Exception as e:
                logger.error(f"Re-subscribe failed: {e}")

    async def _close(self) -> None:
        try:
            await self.pubsub.aclose()
        except Exception:
            pass
        logger.info("PubSub listener stopped")

    @staticmethod
    def _decode(raw: dict) -> dict:
        """
        Decode a raw Redis pub/sub message into a clean dict.

        Since PubSub_Redis uses decode_responses=True, both channel
        and data arrive as str (not bytes). No byte-decoding needed.

        Raw format from redis-py (with decode_responses=True):
            {
                "type":    "message",
                "pattern": None,
                "channel": "chat:<uuid>",     # str
                "data":    '{"type": "..."}', # str (JSON)
            }

        Returns:
            {
                "channel": "chat:<uuid>",
                "data": { ... },             # parsed JSON dict
            }
        """
        return {
            "channel": raw["channel"],
            "data": json.loads(raw["data"]),
        }