"""
Integration tests for the real-time messaging pipeline.
Tests the full flow: publisher → Redis → subscriber → manager → WebSocket delivery.
Uses fakeredis so no real Redis is needed.
"""
import pytest
import uuid
import json
import asyncio
from unittest.mock import AsyncMock, MagicMock
import fakeredis.aioredis


@pytest.fixture
def real_redis():
    """FakeRedis that behaves like a real async Redis client."""
    return fakeredis.aioredis.FakeRedis(decode_responses=True)


@pytest.fixture
def publisher(real_redis):
    from pubsub.publisher import Publisher
    return Publisher(redis_client=real_redis)


@pytest.fixture
def subscriber(real_redis):
    from pubsub.subscriber import PubSubListener
    return PubSubListener(redis_client=real_redis, poll_timeout=0.05)


@pytest.fixture
def manager(real_redis):
    from websocket.manager import ConnectionManager
    return ConnectionManager(redis_client=real_redis)


# ── Full pipeline integration ─────────────────────────────────────────

class TestFullMessagePipeline:
    """End-to-end: publish → subscribe → deliver to WebSocket."""

    @pytest.mark.asyncio
    async def test_message_flows_publisher_to_subscriber(self, real_redis, publisher, subscriber):
        """Published message should be received by subscriber's handler."""
        received = []
        handler = AsyncMock(side_effect=lambda msg: received.append(msg))
        handler.__qualname__ = "test_handler"
        subscriber.set_handler(handler)

        cid = uuid.uuid4()
        await subscriber.subscribe([cid])

        # Start listener
        task = asyncio.create_task(subscriber.listen())
        await asyncio.sleep(0.2)  # let listener start

        # Publish
        from datetime import datetime, timezone
        await publisher.publish_message(
            chat_id=cid,
            message_id=uuid.uuid4(),
            sender_id=uuid.uuid4(),
            content="Hello integration!",
            sent_at=datetime.now(timezone.utc),
        )

        # Wait for delivery
        await asyncio.sleep(0.5)
        subscriber._running = False
        try:
            await asyncio.wait_for(task, timeout=3.0)
        except (asyncio.TimeoutError, asyncio.CancelledError):
            pass

        # Verify message was received
        assert len(received) >= 1
        msg = received[0]
        assert msg["channel"] == f"chat:{cid}"
        assert msg["data"]["content"] == "Hello integration!"
        assert msg["data"]["type"] == "message"

    @pytest.mark.asyncio
    async def test_typing_indicator_flows_through(self, real_redis, publisher, subscriber):
        """Typing indicators should flow through the pipeline."""
        received = []
        handler = AsyncMock(side_effect=lambda msg: received.append(msg))
        handler.__qualname__ = "test_handler"
        subscriber.set_handler(handler)

        cid = uuid.uuid4()
        uid = uuid.uuid4()
        await subscriber.subscribe([cid])

        task = asyncio.create_task(subscriber.listen())
        await asyncio.sleep(0.2)

        await publisher.publish_typing(chat_id=cid, user_id=uid)
        await asyncio.sleep(0.5)

        subscriber._running = False
        try:
            await asyncio.wait_for(task, timeout=3.0)
        except (asyncio.TimeoutError, asyncio.CancelledError):
            pass

        assert len(received) >= 1
        assert received[0]["data"]["type"] == "typing"

    @pytest.mark.asyncio
    async def test_read_receipt_flows_through(self, real_redis, publisher, subscriber):
        """Read receipts should flow through the pipeline."""
        received = []
        handler = AsyncMock(side_effect=lambda msg: received.append(msg))
        handler.__qualname__ = "test_handler"
        subscriber.set_handler(handler)

        cid = uuid.uuid4()
        mid = uuid.uuid4()
        uid = uuid.uuid4()
        await subscriber.subscribe([cid])

        task = asyncio.create_task(subscriber.listen())
        await asyncio.sleep(0.2)

        await publisher.publish_read(chat_id=cid, message_id=mid, user_id=uid)
        await asyncio.sleep(0.5)

        subscriber._running = False
        try:
            await asyncio.wait_for(task, timeout=3.0)
        except (asyncio.TimeoutError, asyncio.CancelledError):
            pass

        assert len(received) >= 1
        assert received[0]["data"]["type"] == "read"


# ── Manager + Subscriber wiring ──────────────────────────────────────

class TestManagerSubscriberWiring:
    """Test the wiring: subscriber.set_handler(manager.handle_pubsub_message)."""

    @pytest.mark.asyncio
    async def test_message_reaches_websocket(self, real_redis, publisher, subscriber, manager):
        """Full flow: publish → subscriber → manager → WebSocket."""
        cid = uuid.uuid4()
        sender_id = uuid.uuid4()
        recipient_id = uuid.uuid4()

        # Set up recipient WebSocket
        ws = AsyncMock()
        await manager.register(recipient_id, ws, [cid])

        # Wire subscriber → manager
        subscriber.set_handler(manager.handle_pubsub_message)
        await subscriber.subscribe([cid])

        task = asyncio.create_task(subscriber.listen())
        await asyncio.sleep(0.2)

        # Publish a message
        from datetime import datetime, timezone
        await publisher.publish_message(
            chat_id=cid,
            message_id=uuid.uuid4(),
            sender_id=sender_id,
            content="Full pipeline test",
            sent_at=datetime.now(timezone.utc),
        )

        await asyncio.sleep(0.5)
        subscriber._running = False
        try:
            await asyncio.wait_for(task, timeout=3.0)
        except (asyncio.TimeoutError, asyncio.CancelledError):
            pass

        # Verify the recipient's WS received the message
        ws.send_json.assert_called()
        sent_payload = ws.send_json.call_args[0][0]
        assert sent_payload["content"] == "Full pipeline test"

    @pytest.mark.asyncio
    async def test_sender_excluded_from_delivery(self, real_redis, publisher, subscriber, manager):
        """Sender should NOT receive their own message via pubsub."""
        cid = uuid.uuid4()
        sender_id = uuid.uuid4()

        # Sender is also in the chat
        sender_ws = AsyncMock()
        await manager.register(sender_id, sender_ws, [cid])

        subscriber.set_handler(manager.handle_pubsub_message)
        await subscriber.subscribe([cid])

        task = asyncio.create_task(subscriber.listen())
        await asyncio.sleep(0.2)

        from datetime import datetime, timezone
        await publisher.publish_message(
            chat_id=cid,
            message_id=uuid.uuid4(),
            sender_id=sender_id,
            content="Should not echo",
            sent_at=datetime.now(timezone.utc),
        )

        await asyncio.sleep(0.5)
        subscriber._running = False
        try:
            await asyncio.wait_for(task, timeout=3.0)
        except (asyncio.TimeoutError, asyncio.CancelledError):
            pass

        # Sender should NOT have received the message
        sender_ws.send_json.assert_not_called()


# ── Unsubscribe isolation ────────────────────────────────────────────

class TestUnsubscribeIsolation:
    @pytest.mark.asyncio
    async def test_unsubscribed_channel_stops_receiving(self, real_redis, publisher, subscriber):
        """After unsubscribing, messages to that channel should not arrive."""
        received = []
        handler = AsyncMock(side_effect=lambda msg: received.append(msg))
        handler.__qualname__ = "test_handler"
        subscriber.set_handler(handler)

        cid = uuid.uuid4()
        await subscriber.subscribe([cid])

        task = asyncio.create_task(subscriber.listen())
        await asyncio.sleep(0.2)

        # Unsubscribe
        await subscriber.unsubscribe([cid])
        await asyncio.sleep(0.2)

        # Publish after unsubscribe
        from datetime import datetime, timezone
        await publisher.publish_message(
            chat_id=cid,
            message_id=uuid.uuid4(),
            sender_id=uuid.uuid4(),
            content="Should not arrive",
            sent_at=datetime.now(timezone.utc),
        )

        await asyncio.sleep(0.5)
        subscriber._running = False
        try:
            await asyncio.wait_for(task, timeout=3.0)
        except (asyncio.TimeoutError, asyncio.CancelledError):
            pass

        # Should NOT have received the message
        assert len(received) == 0


# ── Connection lifecycle ──────────────────────────────────────────────

class TestConnectionLifecycle:
    @pytest.mark.asyncio
    async def test_register_sets_presence(self, real_redis, manager):
        uid = uuid.uuid4()
        ws = AsyncMock()
        await manager.register(uid, ws, [])

        val = await real_redis.get(f"presence:{uid}")
        assert val == "online"

    @pytest.mark.asyncio
    async def test_unregister_clears_presence(self, real_redis, manager):
        uid = uuid.uuid4()
        ws = AsyncMock()
        await manager.register(uid, ws, [])
        await manager.unregister(uid)

        val = await real_redis.get(f"presence:{uid}")
        assert val is None

    @pytest.mark.asyncio
    async def test_reconnect_evicts_old_session(self, real_redis, manager):
        uid = uuid.uuid4()
        ws1, ws2 = AsyncMock(), AsyncMock()

        await manager.register(uid, ws1, [])
        await manager.register(uid, ws2, [])

        ws1.close.assert_called_once()
        assert manager.connections[uid] is ws2
