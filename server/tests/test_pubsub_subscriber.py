# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Unit tests for server/pubsub/subscriber.py
Tests: PubSubListener — subscribe, unsubscribe, channel tracking,
       listen loop, reconnect, _process_one, _decode, stop
"""
import pytest
import uuid
import json
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch


@pytest.fixture
def redis_mock():
    r = AsyncMock()
    pubsub = AsyncMock()
    pubsub.subscribe = AsyncMock()
    pubsub.unsubscribe = AsyncMock()
    pubsub.aclose = AsyncMock()
    pubsub.get_message = AsyncMock(return_value=None)
    r.pubsub = MagicMock(return_value=pubsub)
    return r


@pytest.fixture
def subscriber(redis_mock):
    from pubsub.subscriber import PubSubListener
    sub = PubSubListener(redis_client=redis_mock, poll_timeout=0.01)
    handler = AsyncMock()
    handler.__qualname__ = "mock_handler"
    sub.set_handler(handler)
    return sub


# ── Subscribe / Unsubscribe ──────────────────────────────────────────

class TestSubscribe:
    @pytest.mark.asyncio
    async def test_subscribes_to_channels(self, subscriber):
        cids = [uuid.uuid4(), uuid.uuid4()]
        await subscriber.subscribe(cids)
        subscriber.pubsub.subscribe.assert_called_once()
        args = subscriber.pubsub.subscribe.call_args[0]
        assert len(args) == 2

    @pytest.mark.asyncio
    async def test_empty_list_noop(self, subscriber):
        await subscriber.subscribe([])
        subscriber.pubsub.subscribe.assert_not_called()

    @pytest.mark.asyncio
    async def test_tracks_subscribed_channels(self, subscriber):
        cid = uuid.uuid4()
        await subscriber.subscribe([cid])
        assert f"chat:{cid}" in subscriber._subscribed_channels

    @pytest.mark.asyncio
    async def test_multiple_subscribes_accumulate(self, subscriber):
        cid1, cid2 = uuid.uuid4(), uuid.uuid4()
        await subscriber.subscribe([cid1])
        await subscriber.subscribe([cid2])
        assert len(subscriber._subscribed_channels) == 2


class TestUnsubscribe:
    @pytest.mark.asyncio
    async def test_unsubscribes_from_channels(self, subscriber):
        cids = [uuid.uuid4()]
        await subscriber.unsubscribe(cids)
        subscriber.pubsub.unsubscribe.assert_called_once()

    @pytest.mark.asyncio
    async def test_empty_list_noop(self, subscriber):
        await subscriber.unsubscribe([])
        subscriber.pubsub.unsubscribe.assert_not_called()

    @pytest.mark.asyncio
    async def test_removes_from_tracked_channels(self, subscriber):
        cid = uuid.uuid4()
        await subscriber.subscribe([cid])
        assert f"chat:{cid}" in subscriber._subscribed_channels
        await subscriber.unsubscribe([cid])
        assert f"chat:{cid}" not in subscriber._subscribed_channels

    @pytest.mark.asyncio
    async def test_unsubscribe_nonexistent_channel_no_error(self, subscriber):
        await subscriber.unsubscribe([uuid.uuid4()])


# ── Channel tracking ─────────────────────────────────────────────────

class TestChannelTracking:
    @pytest.mark.asyncio
    async def test_subscribe_unsubscribe_cycle(self, subscriber):
        cid = uuid.uuid4()
        await subscriber.subscribe([cid])
        assert len(subscriber._subscribed_channels) == 1
        await subscriber.unsubscribe([cid])
        assert len(subscriber._subscribed_channels) == 0

    @pytest.mark.asyncio
    async def test_duplicate_subscribe_no_duplicates(self, subscriber):
        cid = uuid.uuid4()
        await subscriber.subscribe([cid])
        await subscriber.subscribe([cid])
        assert len(subscriber._subscribed_channels) == 1

    @pytest.mark.asyncio
    async def test_partial_unsubscribe(self, subscriber):
        cid1, cid2, cid3 = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
        await subscriber.subscribe([cid1, cid2, cid3])
        assert len(subscriber._subscribed_channels) == 3
        await subscriber.unsubscribe([cid2])
        assert len(subscriber._subscribed_channels) == 2
        assert f"chat:{cid1}" in subscriber._subscribed_channels
        assert f"chat:{cid3}" in subscriber._subscribed_channels


# ── Handler registration ─────────────────────────────────────────────

class TestSetHandler:
    def test_set_handler_stores_callback(self, redis_mock):
        from pubsub.subscriber import PubSubListener
        sub = PubSubListener(redis_client=redis_mock)
        handler = AsyncMock()
        handler.__qualname__ = "test_handler"
        sub.set_handler(handler)
        assert sub._handler is handler

    @pytest.mark.asyncio
    async def test_listen_without_handler_returns_immediately(self, redis_mock):
        from pubsub.subscriber import PubSubListener
        sub = PubSubListener(redis_client=redis_mock)
        await sub.listen()
        assert sub._running is False


# ── Stop ──────────────────────────────────────────────────────────────

class TestStop:
    @pytest.mark.asyncio
    async def test_stop_sets_flag(self, subscriber):
        subscriber._running = True
        await subscriber.stop()
        assert subscriber._running is False


# ── _decode ───────────────────────────────────────────────────────────

class TestDecode:
    def test_decodes_str_message(self):
        from pubsub.subscriber import PubSubListener
        cid = uuid.uuid4()
        payload = {"type": "message", "content": "hello"}
        raw = {
            "type": "message",
            "channel": f"chat:{cid}",
            "data": json.dumps(payload),
        }
        result = PubSubListener._decode(raw)
        assert result["channel"] == f"chat:{cid}"
        assert result["data"]["content"] == "hello"

    def test_raises_on_invalid_json(self):
        from pubsub.subscriber import PubSubListener
        raw = {"type": "message", "channel": "chat:test", "data": "not-json{"}
        with pytest.raises(json.JSONDecodeError):
            PubSubListener._decode(raw)


# ── _process_one ──────────────────────────────────────────────────────

class TestProcessOne:
    @pytest.mark.asyncio
    async def test_calls_handler_for_message_type(self, subscriber):
        cid = uuid.uuid4()
        raw = {
            "type": "message",
            "channel": f"chat:{cid}",
            "data": json.dumps({"type": "msg", "content": "hi"}),
        }
        await subscriber._process_one(raw)
        subscriber._handler.assert_called_once()

    @pytest.mark.asyncio
    async def test_skips_non_message_types(self, subscriber):
        raw = {"type": "subscribe", "channel": "chat:test", "data": "1"}
        await subscriber._process_one(raw)
        subscriber._handler.assert_not_called()

    @pytest.mark.asyncio
    async def test_malformed_json_logged_not_raised(self, subscriber):
        raw = {"type": "message", "channel": "chat:test", "data": "not-json"}
        await subscriber._process_one(raw)  # should not raise
        subscriber._handler.assert_not_called()

    @pytest.mark.asyncio
    async def test_handler_error_logged_not_raised(self, subscriber):
        subscriber._handler.side_effect = Exception("boom")
        raw = {
            "type": "message",
            "channel": "chat:test",
            "data": json.dumps({"content": "hi"}),
        }
        await subscriber._process_one(raw)  # should not raise


# ── _reconnect ────────────────────────────────────────────────────────

class TestReconnect:
    @pytest.mark.asyncio
    async def test_recreates_pubsub(self, subscriber, redis_mock):
        old_pubsub = subscriber.pubsub
        new_pubsub = AsyncMock()
        new_pubsub.subscribe = AsyncMock()
        redis_mock.pubsub.return_value = new_pubsub

        await subscriber._reconnect()

        old_pubsub.aclose.assert_called_once()
        assert subscriber.pubsub is new_pubsub

    @pytest.mark.asyncio
    async def test_resubscribes_tracked_channels(self, subscriber, redis_mock):
        cid = uuid.uuid4()
        await subscriber.subscribe([cid])

        new_pubsub = AsyncMock()
        new_pubsub.subscribe = AsyncMock()
        redis_mock.pubsub.return_value = new_pubsub

        await subscriber._reconnect()

        new_pubsub.subscribe.assert_called_once()
        args = new_pubsub.subscribe.call_args[0]
        assert f"chat:{cid}" in args

    @pytest.mark.asyncio
    async def test_reconnect_with_no_channels(self, subscriber, redis_mock):
        new_pubsub = AsyncMock()
        redis_mock.pubsub.return_value = new_pubsub

        await subscriber._reconnect()

        new_pubsub.subscribe.assert_not_called()


# ── listen loop ───────────────────────────────────────────────────────

class TestListen:
    @pytest.mark.asyncio
    async def test_processes_message_via_handler(self, subscriber):
        cid = uuid.uuid4()
        payload = json.dumps({"type": "msg", "content": "hi"})

        call_count = 0
        async def fake_get_message(**kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                return {"type": "message", "channel": f"chat:{cid}", "data": payload}
            subscriber._running = False
            return None

        subscriber.pubsub.get_message = fake_get_message

        task = asyncio.create_task(subscriber.listen())
        try:
            await asyncio.wait_for(task, timeout=2.0)
        except (asyncio.TimeoutError, asyncio.CancelledError):
            pass

        subscriber._handler.assert_called_once()

    @pytest.mark.asyncio
    async def test_reconnects_after_crash(self, subscriber, redis_mock):
        crash_count = 0
        async def crashing_get_message(**kwargs):
            nonlocal crash_count
            crash_count += 1
            if crash_count == 1:
                raise ConnectionError("Redis connection lost")
            subscriber._running = False
            return None

        subscriber.pubsub.get_message = crashing_get_message

        new_pubsub = AsyncMock()
        new_pubsub.subscribe = AsyncMock()
        new_pubsub.aclose = AsyncMock()
        new_pubsub.get_message = AsyncMock(return_value=None)
        redis_mock.pubsub.return_value = new_pubsub

        # Need to stop after reconnect
        original_reconnect = subscriber._reconnect
        async def reconnect_then_stop():
            await original_reconnect()
            subscriber._running = False
        subscriber._reconnect = reconnect_then_stop

        task = asyncio.create_task(subscriber.listen())
        try:
            await asyncio.wait_for(task, timeout=5.0)
        except (asyncio.TimeoutError, asyncio.CancelledError):
            pass

        # Should have reconnected
        assert subscriber.pubsub is new_pubsub

    @pytest.mark.asyncio
    async def test_stop_exits_loop(self, subscriber):
        call_count = 0
        async def slow_get_message(**kwargs):
            nonlocal call_count
            call_count += 1
            if call_count >= 3:
                subscriber._running = False
            return None

        subscriber.pubsub.get_message = slow_get_message
        task = asyncio.create_task(subscriber.listen())
        try:
            await asyncio.wait_for(task, timeout=2.0)
        except (asyncio.TimeoutError, asyncio.CancelledError):
            pass

        assert subscriber._running is False
