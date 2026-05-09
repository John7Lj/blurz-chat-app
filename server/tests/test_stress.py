# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Stress, spike, and extreme tests for the real-time messaging system.
Tests: high concurrency, burst messages, rate limiting under load,
       rapid connect/disconnect, memory leak checks.
"""
import pytest
import uuid
import json
import asyncio
import time
from unittest.mock import AsyncMock, MagicMock
import fakeredis.aioredis


@pytest.fixture
def real_redis():
    return fakeredis.aioredis.FakeRedis(decode_responses=True)


@pytest.fixture
def publisher(real_redis):
    from pubsub.publisher import Publisher
    return Publisher(redis_client=real_redis)


@pytest.fixture
def subscriber(real_redis):
    from pubsub.subscriber import PubSubListener
    return PubSubListener(redis_client=real_redis, poll_timeout=0.01)


@pytest.fixture
def manager(real_redis):
    from websocket.manager import ConnectionManager
    return ConnectionManager(redis_client=real_redis)


# ── Rate Limiter Stress ──────────────────────────────────────────────

class TestRateLimiterStress:
    """Stress test the rate limiter under extreme conditions."""

    def test_burst_exactly_at_limit(self):
        from websocket.rate_limiter import RateLimiter
        limiter = RateLimiter(max_messages=100, window_seconds=10.0)
        uid = uuid.uuid4()

        # Exactly at limit — all should pass
        results = [limiter.allow(uid) for _ in range(100)]
        assert all(results)
        # Next one should fail
        assert limiter.allow(uid) is False

    def test_many_users_isolated(self):
        """100 users each sending near their limit should not interfere."""
        from websocket.rate_limiter import RateLimiter
        limiter = RateLimiter(max_messages=10, window_seconds=10.0)

        users = [uuid.uuid4() for _ in range(100)]
        for uid in users:
            for _ in range(10):
                assert limiter.allow(uid) is True
            assert limiter.allow(uid) is False

    def test_rapid_cleanup_many_users(self):
        """Cleanup should handle many users without issues."""
        from websocket.rate_limiter import RateLimiter
        limiter = RateLimiter()

        users = [uuid.uuid4() for _ in range(500)]
        for uid in users:
            limiter.allow(uid)

        assert len(limiter._windows) == 500

        for uid in users:
            limiter.cleanup(uid)

        assert len(limiter._windows) == 0

    def test_window_expiry_under_sustained_load(self):
        """Messages should be allowed again after the window expires."""
        from websocket.rate_limiter import RateLimiter
        limiter = RateLimiter(max_messages=5, window_seconds=0.1)
        uid = uuid.uuid4()

        # Fill the window
        for _ in range(5):
            limiter.allow(uid)
        assert limiter.allow(uid) is False

        # Wait for window to expire
        time.sleep(0.15)

        # Should be allowed again
        assert limiter.allow(uid) is True


# ── Manager Stress ────────────────────────────────────────────────────

class TestManagerStress:
    """Stress test ConnectionManager with many concurrent users."""

    @pytest.mark.asyncio
    async def test_register_many_users(self, manager):
        """Register 200 users, each with 5 chats."""
        users = []
        for _ in range(200):
            uid = uuid.uuid4()
            ws = AsyncMock()
            cids = [uuid.uuid4() for _ in range(5)]
            await manager.register(uid, ws, cids)
            users.append((uid, cids))

        assert len(manager.connections) == 200

        # Verify chat_members tracking
        total_memberships = sum(len(members) for members in manager.chat_members.values())
        assert total_memberships == 200 * 5  # 200 users × 5 chats each

    @pytest.mark.asyncio
    async def test_unregister_all_users(self, manager):
        """Register then unregister all users — state should be clean."""
        uids = []
        for _ in range(100):
            uid = uuid.uuid4()
            ws = AsyncMock()
            cids = [uuid.uuid4()]
            await manager.register(uid, ws, cids)
            uids.append(uid)

        for uid in uids:
            await manager.unregister(uid)

        assert len(manager.connections) == 0
        assert len(manager.user_chats) == 0
        assert len(manager.chat_members) == 0

    @pytest.mark.asyncio
    async def test_rapid_reconnect_same_user(self, manager):
        """Same user reconnecting 50 times rapidly — old connections should be evicted."""
        uid = uuid.uuid4()
        cid = uuid.uuid4()
        websockets = []

        for _ in range(50):
            ws = AsyncMock()
            await manager.register(uid, ws, [cid])
            websockets.append(ws)

        # Only the last WebSocket should remain
        assert len(manager.connections) == 1
        assert manager.connections[uid] is websockets[-1]

        # All previous websockets should have been closed
        for ws in websockets[:-1]:
            ws.close.assert_called_once()

    @pytest.mark.asyncio
    async def test_deliver_to_large_chat(self, manager):
        """Deliver message to a chat with 100 members."""
        cid = uuid.uuid4()
        websockets = {}

        for _ in range(100):
            uid = uuid.uuid4()
            ws = AsyncMock()
            manager.connections[uid] = ws
            manager.chat_members.setdefault(cid, set()).add(uid)
            websockets[uid] = ws

        sender_id = list(websockets.keys())[0]
        await manager.deliver_to_chat(
            cid, {"type": "msg", "content": "hello"}, exclude_user_id=sender_id
        )

        # 99 should receive (all except sender)
        received_count = sum(
            1 for uid, ws in websockets.items()
            if ws.send_json.called and uid != sender_id
        )
        assert received_count == 99

    @pytest.mark.asyncio
    async def test_many_shared_chats_orphan_calculation(self, manager):
        """Many users sharing chats — orphaned channel calculation should be correct."""
        cid = uuid.uuid4()
        uids = []

        # 50 users all in the same chat
        for _ in range(50):
            uid = uuid.uuid4()
            ws = AsyncMock()
            await manager.register(uid, ws, [cid])
            uids.append(uid)

        # Unregister all except one
        for uid in uids[:-1]:
            orphaned = await manager.unregister(uid)
            assert cid not in orphaned  # still needed by remaining users

        # Last user leaves
        orphaned = await manager.unregister(uids[-1])
        assert cid in orphaned  # now truly orphaned


# ── Subscriber Stress ─────────────────────────────────────────────────

class TestSubscriberStress:
    """Stress test PubSubListener under extreme conditions."""

    @pytest.mark.asyncio
    async def test_subscribe_many_channels(self, subscriber):
        """Subscribe to 500 channels at once."""
        cids = [uuid.uuid4() for _ in range(500)]
        await subscriber.subscribe(cids)
        assert len(subscriber._subscribed_channels) == 500

    @pytest.mark.asyncio
    async def test_subscribe_unsubscribe_cycle_many(self, subscriber):
        """Rapidly subscribe and unsubscribe many channels."""
        for _ in range(100):
            cid = uuid.uuid4()
            await subscriber.subscribe([cid])
            await subscriber.unsubscribe([cid])

        assert len(subscriber._subscribed_channels) == 0

    @pytest.mark.asyncio
    async def test_channel_tracking_consistency(self, subscriber):
        """After many operations, tracking should be consistent."""
        all_cids = [uuid.uuid4() for _ in range(200)]

        # Subscribe to all
        await subscriber.subscribe(all_cids)
        assert len(subscriber._subscribed_channels) == 200

        # Unsubscribe first half
        await subscriber.unsubscribe(all_cids[:100])
        assert len(subscriber._subscribed_channels) == 100

        # The remaining should be the second half
        for cid in all_cids[100:]:
            assert f"chat:{cid}" in subscriber._subscribed_channels
        for cid in all_cids[:100]:
            assert f"chat:{cid}" not in subscriber._subscribed_channels


# ── Spike Tests ───────────────────────────────────────────────────────

class TestSpikeScenarios:
    """Simulate sudden bursts of activity."""

    @pytest.mark.asyncio
    async def test_simultaneous_register_unregister(self, manager):
        """50 users connecting and 50 disconnecting at the same time."""
        connecting = []
        for _ in range(50):
            uid = uuid.uuid4()
            ws = AsyncMock()
            connecting.append(manager.register(uid, ws, [uuid.uuid4()]))

        disconnecting_uids = []
        for _ in range(50):
            uid = uuid.uuid4()
            ws = AsyncMock()
            await manager.register(uid, ws, [uuid.uuid4()])
            disconnecting_uids.append(uid)

        # Fire all connects
        await asyncio.gather(*connecting)
        # Fire all disconnects
        await asyncio.gather(*[manager.unregister(uid) for uid in disconnecting_uids])

        # Should have exactly 50 connections (the newly connected ones)
        assert len(manager.connections) == 50

    @pytest.mark.asyncio
    async def test_burst_messages_to_single_chat(self, real_redis, publisher):
        """Publish 200 messages to the same chat rapidly."""
        cid = uuid.uuid4()
        from datetime import datetime, timezone

        tasks = []
        for i in range(200):
            tasks.append(publisher.publish_message(
                chat_id=cid,
                message_id=uuid.uuid4(),
                sender_id=uuid.uuid4(),
                content=f"Burst message {i}",
                sent_at=datetime.now(timezone.utc),
            ))

        await asyncio.gather(*tasks)
        # Should not raise — all publishes should succeed

    @pytest.mark.asyncio
    async def test_pubsub_callback_error_isolation(self, manager):
        """If handle_pubsub_message fails for one message, others should still work."""
        cid = uuid.uuid4()
        uid = uuid.uuid4()
        ws = AsyncMock()
        manager.connections[uid] = ws
        manager.chat_members[cid] = {uid}

        # First message: bad format (should log error)
        await manager.handle_pubsub_message({"bad": "data"})

        # Second message: valid (should deliver)
        await manager.handle_pubsub_message({
            "channel": f"chat:{cid}",
            "data": {"type": "message", "content": "after error"},
        })

        # The valid message should have been delivered
        ws.send_json.assert_called_once()

    @pytest.mark.asyncio
    async def test_delivery_with_failed_websockets(self, manager):
        """Some WebSockets failing during delivery should not block others."""
        cid = uuid.uuid4()
        good_uid, bad_uid, good2_uid = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()

        good_ws = AsyncMock()
        bad_ws = AsyncMock()
        bad_ws.send_json = AsyncMock(side_effect=Exception("connection reset"))
        good2_ws = AsyncMock()

        manager.connections[good_uid] = good_ws
        manager.connections[bad_uid] = bad_ws
        manager.connections[good2_uid] = good2_ws

        manager.user_chats[good_uid] = [cid]
        manager.user_chats[bad_uid] = [cid]
        manager.user_chats[good2_uid] = [cid]

        manager.chat_members[cid] = {good_uid, bad_uid, good2_uid}

        await manager.deliver_to_chat(cid, {"type": "msg"})

        # Good WebSockets should have received the message
        good_ws.send_json.assert_called_once()
        good2_ws.send_json.assert_called_once()

        # Bad WebSocket should have been unregistered
        assert bad_uid not in manager.connections


# ── Edge Cases ────────────────────────────────────────────────────────

class TestEdgeCases:
    @pytest.mark.asyncio
    async def test_empty_content_message(self, manager):
        """handle_pubsub_message with empty content should still deliver."""
        cid = uuid.uuid4()
        uid = uuid.uuid4()
        ws = AsyncMock()
        manager.connections[uid] = ws
        manager.chat_members[cid] = {uid}

        await manager.handle_pubsub_message({
            "channel": f"chat:{cid}",
            "data": {"type": "message", "content": "", "sender_id": str(uuid.uuid4())},
        })
        ws.send_json.assert_called_once()

    @pytest.mark.asyncio
    async def test_unicode_content(self, manager):
        """Messages with unicode/emoji should be handled correctly."""
        cid = uuid.uuid4()
        uid = uuid.uuid4()
        ws = AsyncMock()
        manager.connections[uid] = ws
        manager.chat_members[cid] = {uid}

        await manager.handle_pubsub_message({
            "channel": f"chat:{cid}",
            "data": {"type": "message", "content": "Hello 🌍 مرحبا 你好", "sender_id": str(uuid.uuid4())},
        })
        ws.send_json.assert_called_once()
        payload = ws.send_json.call_args[0][0]
        assert "🌍" in payload["content"]

    @pytest.mark.asyncio
    async def test_very_long_message(self, manager):
        """Very long message content should not crash."""
        cid = uuid.uuid4()
        uid = uuid.uuid4()
        ws = AsyncMock()
        manager.connections[uid] = ws
        manager.chat_members[cid] = {uid}

        long_content = "x" * 100_000  # 100KB message
        await manager.handle_pubsub_message({
            "channel": f"chat:{cid}",
            "data": {"type": "message", "content": long_content, "sender_id": str(uuid.uuid4())},
        })
        ws.send_json.assert_called_once()

    def test_rate_limiter_zero_limit(self):
        """Rate limiter with 0 max should reject everything."""
        from websocket.rate_limiter import RateLimiter
        limiter = RateLimiter(max_messages=0, window_seconds=10.0)
        assert limiter.allow(uuid.uuid4()) is False
