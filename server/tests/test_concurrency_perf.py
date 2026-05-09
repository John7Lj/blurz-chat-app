# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
═══════════════════════════════════════════════════════════════════════
  CONCURRENCY, RACE CONDITION & PERFORMANCE TESTS
  Categories: Simultaneous joins, concurrent messages, subscribe races,
              load tests, performance metrics
═══════════════════════════════════════════════════════════════════════

Risk priority: MEDIUM-HIGH — race conditions cause intermittent
prod bugs that are extremely hard to debug.
"""
import pytest
import uuid
import json
import asyncio
import time
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
import fakeredis.aioredis


@pytest.fixture
def real_redis():
    return fakeredis.aioredis.FakeRedis(decode_responses=True)


@pytest.fixture
def manager(real_redis):
    from websocket.manager import ConnectionManager
    return ConnectionManager(redis_client=real_redis)


@pytest.fixture
def publisher(real_redis):
    from pubsub.publisher import Publisher
    return Publisher(redis_client=real_redis)


@pytest.fixture
def subscriber(real_redis):
    from pubsub.subscriber import PubSubListener
    sub = PubSubListener(redis_client=real_redis, poll_timeout=0.01)
    handler = AsyncMock()
    handler.__qualname__ = "test_handler"
    sub.set_handler(handler)
    return sub


# ═══════════════════════════════════════════════════════════════════════
#  RACE CONDITIONS
# ═══════════════════════════════════════════════════════════════════════

class TestRaceConditions:

    @pytest.mark.asyncio
    async def test_two_users_join_same_chat_simultaneously(self, manager):
        """Two users registering for the same chat at the same time."""
        cid = uuid.uuid4()
        u1, u2 = uuid.uuid4(), uuid.uuid4()
        ws1, ws2 = AsyncMock(), AsyncMock()

        await asyncio.gather(
            manager.register(u1, ws1, [cid]),
            manager.register(u2, ws2, [cid]),
        )

        assert u1 in manager.chat_members[cid]
        assert u2 in manager.chat_members[cid]
        assert len(manager.connections) == 2

    @pytest.mark.asyncio
    async def test_simultaneous_messages_to_same_chat(self, manager):
        """Two messages to the same chat at the exact same time."""
        cid = uuid.uuid4()
        u1, u2 = uuid.uuid4(), uuid.uuid4()
        ws1, ws2 = AsyncMock(), AsyncMock()

        await manager.register(u1, ws1, [cid])
        await manager.register(u2, ws2, [cid])

        # Deliver two messages concurrently
        await asyncio.gather(
            manager.deliver_to_chat(cid, {"msg": "from u1"}, exclude_user_id=u1),
            manager.deliver_to_chat(cid, {"msg": "from u2"}, exclude_user_id=u2),
        )

        # u1 should receive u2's message and vice versa
        assert ws1.send_json.call_count >= 1
        assert ws2.send_json.call_count >= 1

    @pytest.mark.asyncio
    async def test_subscribe_and_unsubscribe_simultaneously(self, subscriber):
        """Subscribe and unsubscribe firing at the same time."""
        cid = uuid.uuid4()

        await asyncio.gather(
            subscriber.subscribe([cid]),
            subscriber.unsubscribe([cid]),
        )

        # End state should be consistent (either subscribed or not)
        # The important thing is no crash
        assert isinstance(subscriber._subscribed_channels, set)

    @pytest.mark.asyncio
    async def test_register_unregister_same_user_concurrently(self, manager):
        """Register and unregister the same user simultaneously."""
        uid = uuid.uuid4()
        ws = AsyncMock()

        await manager.register(uid, ws, [uuid.uuid4()])

        # Fire both at once
        await asyncio.gather(
            manager.register(uid, AsyncMock(), [uuid.uuid4()]),
            manager.unregister(uid),
        )

        # Should not crash — final state is deterministic based on execution order

    @pytest.mark.asyncio
    async def test_message_while_user_being_removed(self, manager):
        """
        User sends a message while being removed from chat.
        deliver_to_chat should handle the missing member gracefully.
        """
        cid = uuid.uuid4()
        uid = uuid.uuid4()
        ws = AsyncMock()

        await manager.register(uid, ws, [cid])

        async def delayed_unregister():
            await asyncio.sleep(0.01)
            await manager.unregister(uid)

        await asyncio.gather(
            manager.deliver_to_chat(cid, {"msg": "race"}),
            delayed_unregister(),
        )

        # No crash — either message was delivered or user was already gone


# ═══════════════════════════════════════════════════════════════════════
#  PERFORMANCE & LOAD TESTS
# ═══════════════════════════════════════════════════════════════════════

class TestPerformance:

    @pytest.mark.asyncio
    async def test_100_concurrent_registrations(self, manager):
        """100 users registering concurrently."""
        tasks = []
        for _ in range(100):
            uid = uuid.uuid4()
            ws = AsyncMock()
            tasks.append(manager.register(uid, ws, [uuid.uuid4()]))

        await asyncio.gather(*tasks)
        assert len(manager.connections) == 100

    @pytest.mark.asyncio
    async def test_500_concurrent_websocket_clients(self, manager):
        """Simulate 500 WebSocket connections."""
        shared_chat = uuid.uuid4()
        users = []

        for _ in range(500):
            uid = uuid.uuid4()
            ws = AsyncMock()
            await manager.register(uid, ws, [shared_chat])
            users.append((uid, ws))

        assert len(manager.connections) == 500
        assert len(manager.chat_members[shared_chat]) == 500

        # Deliver a message to all
        sender = users[0][0]
        await manager.deliver_to_chat(shared_chat, {"msg": "broadcast"}, exclude_user_id=sender)

        # 499 should receive (all except sender)
        received = sum(1 for uid, ws in users if ws.send_json.called and uid != sender)
        assert received == 499

    @pytest.mark.asyncio
    async def test_1000_messages_published_rapidly(self, publisher, real_redis):
        """Publish 1000 messages to Redis in rapid succession."""
        cid = uuid.uuid4()

        start = time.monotonic()
        tasks = []
        for i in range(1000):
            tasks.append(publisher.publish_message(
                chat_id=cid,
                message_id=uuid.uuid4(),
                sender_id=uuid.uuid4(),
                content=f"Message {i}",
                sent_at=datetime.now(timezone.utc),
            ))
        await asyncio.gather(*tasks)
        elapsed = time.monotonic() - start

        # Should complete without error
        # Note: with fakeredis, this is mainly testing that no crash occurs
        assert elapsed < 10.0  # Should be well under 10s

    @pytest.mark.asyncio
    async def test_delivery_latency_measurement(self, manager):
        """Measure message delivery latency to connected clients."""
        cid = uuid.uuid4()
        uid = uuid.uuid4()
        ws = AsyncMock()
        await manager.register(uid, ws, [cid])

        latencies = []
        for _ in range(100):
            start = time.monotonic()
            await manager.deliver_to_chat(cid, {"msg": "perf test"})
            latencies.append(time.monotonic() - start)

        avg = sum(latencies) / len(latencies)
        p95 = sorted(latencies)[int(0.95 * len(latencies))]
        p99 = sorted(latencies)[int(0.99 * len(latencies))]

        # In-memory delivery should be <1ms per message
        assert avg < 0.01
        assert p95 < 0.01
        assert p99 < 0.05

    @pytest.mark.asyncio
    async def test_register_unregister_cycle_memory(self, manager):
        """Register and unregister 1000 users — state should be clean."""
        uids = []
        for _ in range(1000):
            uid = uuid.uuid4()
            ws = AsyncMock()
            await manager.register(uid, ws, [uuid.uuid4()])
            uids.append(uid)

        # Unregister all
        for uid in uids:
            await manager.unregister(uid)

        assert len(manager.connections) == 0
        assert len(manager.user_chats) == 0
        assert len(manager.chat_members) == 0

    @pytest.mark.asyncio
    async def test_rate_limiter_performance(self):
        """Rate limiter should handle 10,000 calls efficiently."""
        from websocket.rate_limiter import RateLimiter
        limiter = RateLimiter(max_messages=10000, window_seconds=60)
        uid = uuid.uuid4()

        start = time.monotonic()
        for _ in range(10_000):
            limiter.allow(uid)
        elapsed = time.monotonic() - start

        assert elapsed < 1.0  # 10K calls should be < 1 second


# ═══════════════════════════════════════════════════════════════════════
#  GRACEFUL SHUTDOWN
# ═══════════════════════════════════════════════════════════════════════

class TestGracefulShutdown:

    @pytest.mark.asyncio
    async def test_listener_stops_on_cancel(self, subscriber):
        """CancelledError should cause listen() to exit cleanly."""
        task = asyncio.create_task(subscriber.listen())
        await asyncio.sleep(0.1)
        task.cancel()

        try:
            await asyncio.wait_for(task, timeout=2.0)
        except (asyncio.CancelledError, asyncio.TimeoutError):
            pass

        # No hanging task — the listener should have exited
        assert task.done() or task.cancelled()

    @pytest.mark.asyncio
    async def test_stop_method_idempotent(self, subscriber):
        """Calling stop() multiple times should not crash."""
        await subscriber.stop()
        await subscriber.stop()
        await subscriber.stop()
        assert subscriber._running is False

    @pytest.mark.asyncio
    async def test_unregister_all_clients_on_shutdown(self, manager):
        """Simulate shutdown: unregister all connected clients."""
        uids = []
        for _ in range(50):
            uid = uuid.uuid4()
            ws = AsyncMock()
            await manager.register(uid, ws, [uuid.uuid4()])
            uids.append(uid)

        # Shutdown: unregister all
        for uid in uids:
            await manager.unregister(uid)

        assert len(manager.connections) == 0
