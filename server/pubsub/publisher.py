"""
Redis Pub/Sub Publisher
Publishes events (messages, typing, read receipts) to chat:{chat_id} channels.
Stateless — no references to manager or subscriber.
"""
import json
import uuid
from datetime import datetime
from redis.asyncio import Redis


class Publisher:
    def __init__(self, redis_client: Redis):
        self.redis = redis_client

    async def publish_message(
        self,
        chat_id: uuid.UUID,
        message_id: uuid.UUID,
        sender_id: uuid.UUID,
        content: str,
        sent_at: datetime,
    ):
        """Publish a new message to the chat channel."""
        payload = {
            "type": "message",
            "chat_id": str(chat_id),
            "message_id": str(message_id),
            "sender_id": str(sender_id),
            "content": content,
            "sent_at": sent_at.isoformat(),
        }
        await self.redis.publish(f"chat:{chat_id}", json.dumps(payload))

    async def publish_typing(self, chat_id: uuid.UUID, user_id: uuid.UUID):
        """Publish a typing indicator to the chat channel."""
        payload = {
            "type": "typing",
            "chat_id": str(chat_id),
            "user_id": str(user_id),
        }
        await self.redis.publish(f"chat:{chat_id}", json.dumps(payload))

    async def publish_read(
        self, chat_id: uuid.UUID, message_id: uuid.UUID, user_id: uuid.UUID
    ):
        """Publish a read receipt to the chat channel."""
        payload = {
            "type": "read",
            "chat_id": str(chat_id),
            "message_id": str(message_id),
            "user_id": str(user_id),
        }
        await self.redis.publish(f"chat:{chat_id}", json.dumps(payload))