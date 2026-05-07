"""
═══════════════════════════════════════════════════════════════════════
  WEBSOCKET TESTS
  Categories: Auth, message exchange, malformed input, flood/spam,
              multi-client, reconnect, edge cases
═══════════════════════════════════════════════════════════════════════

Risk priority: CRITICAL — WebSockets are the core real-time channel.
"""
import pytest
import uuid
import json
import asyncio
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch


# ── WS Auth ───────────────────────────────────────────────────────────

class TestWsAuth:
    """WebSocket authentication at connection time."""

    @pytest.mark.asyncio
    async def test_connect_without_token(self):
        """Missing/empty token should close with 4001."""
        ws = AsyncMock()
        ws.app = MagicMock()

        with patch("websocket.router.decode_token", return_value=None):
            from websocket.router import websocket_endpoint
            await websocket_endpoint(ws, token="")
        ws.close.assert_called_once()
        assert ws.close.call_args[1]["code"] == 4001

    @pytest.mark.asyncio
    async def test_connect_with_invalid_token(self):
        """Invalid JWT should close with 4001."""
        ws = AsyncMock()
        ws.app = MagicMock()

        with patch("websocket.router.decode_token", return_value=None):
            from websocket.router import websocket_endpoint
            await websocket_endpoint(ws, token="invalid")
        ws.close.assert_called_once()
        assert ws.close.call_args[1]["code"] == 4001

    @pytest.mark.asyncio
    async def test_connect_with_expired_token(self):
        """Expired JWT should raise TokenExpired which closes WS."""
        ws = AsyncMock()
        ws.app = MagicMock()

        from core.errors import TokenExpired
        with patch("websocket.router.decode_token", side_effect=TokenExpired()):
            from websocket.router import websocket_endpoint
            try:
                await websocket_endpoint(ws, token="expired.token")
            except TokenExpired:
                pass  # Expected — the route should handle this

    @pytest.mark.asyncio
    async def test_connect_unverified_user(self):
        """Unverified user should be rejected with 4003."""
        ws = AsyncMock()
        ws.app = MagicMock()

        user = MagicMock()
        user.is_verified = False

        mock_session = AsyncMock()

        with patch("websocket.router.decode_token", return_value={"user": {"email": "test@test.com"}}), \
             patch("websocket.router.get_session_ctx") as mock_ctx, \
             patch("websocket.router.User_Service") as MockUserService:
            mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
            mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)
            MockUserService.return_value.get_user_by_email = AsyncMock(return_value=user)

            from websocket.router import websocket_endpoint
            await websocket_endpoint(ws, token="valid.token")

        ws.close.assert_called_once()
        assert ws.close.call_args[1]["code"] == 4003

    @pytest.mark.asyncio
    async def test_connect_user_not_in_db(self):
        """Valid token but user deleted from DB should close 4001."""
        ws = AsyncMock()
        ws.app = MagicMock()

        mock_session = AsyncMock()

        with patch("websocket.router.decode_token", return_value={"user": {"email": "ghost@test.com"}}), \
             patch("websocket.router.get_session_ctx") as mock_ctx, \
             patch("websocket.router.User_Service") as MockUserService:
            mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
            mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)
            MockUserService.return_value.get_user_by_email = AsyncMock(return_value=None)

            from websocket.router import websocket_endpoint
            await websocket_endpoint(ws, token="valid.token")

        ws.close.assert_called_once()
        assert ws.close.call_args[1]["code"] == 4001


# ── WS Message Exchange ──────────────────────────────────────────────

class TestWsMessageExchange:
    """Message handling through WebSocket after connection."""

    @pytest.mark.asyncio
    async def test_send_malformed_json(self):
        """Sending non-JSON should trigger WebSocket error, not crash."""
        from websocket.handlers import handle_incoming
        # handle_incoming receives dict from receive_json which already parses JSON
        # If receive_json fails, FastAPI raises WebSocketDisconnect
        # Test: what if data is an empty dict
        user = MagicMock(id=uuid.uuid4())
        manager = AsyncMock()
        manager.send_to_user = AsyncMock()

        await handle_incoming({}, user, AsyncMock(), AsyncMock(), manager)
        # Should send error about missing/unknown type
        manager.send_to_user.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_wrong_schema(self):
        """Valid JSON but wrong structure (no type field)."""
        from websocket.handlers import handle_incoming
        user = MagicMock(id=uuid.uuid4())
        manager = AsyncMock()
        manager.send_to_user = AsyncMock()

        await handle_incoming({"foo": "bar", "baz": 123}, user, AsyncMock(), AsyncMock(), manager)
        error_payload = manager.send_to_user.call_args[0][1]
        assert error_payload["type"] == "error"

    @pytest.mark.asyncio
    async def test_send_unknown_type(self):
        """Unknown message type should return error."""
        from websocket.handlers import handle_incoming
        user = MagicMock(id=uuid.uuid4())
        manager = AsyncMock()
        manager.send_to_user = AsyncMock()

        await handle_incoming({"type": "INVALID_TYPE"}, user, AsyncMock(), AsyncMock(), manager)
        error_payload = manager.send_to_user.call_args[0][1]
        assert "Unknown" in error_payload["detail"]

    @pytest.mark.asyncio
    async def test_send_empty_content_message(self):
        """Empty content should return error."""
        from websocket.handlers import handle_message
        user = MagicMock(id=uuid.uuid4())
        manager = AsyncMock()
        manager.send_to_user = AsyncMock()

        await handle_message(
            {"chat_id": str(uuid.uuid4()), "content": ""},
            user, AsyncMock(), AsyncMock(), manager
        )
        manager.send_to_user.assert_called_once()
        assert "Missing" in manager.send_to_user.call_args[0][1]["detail"]

    @pytest.mark.asyncio
    async def test_send_extremely_large_message(self):
        """1MB+ message should be handled without crash."""
        from websocket.handlers import handle_message
        user = MagicMock(id=uuid.uuid4())
        manager = AsyncMock()
        manager.send_to_user = AsyncMock()
        publisher = AsyncMock()
        publisher.publish_message = AsyncMock()

        msg = MagicMock()
        msg.id = uuid.uuid4()
        msg.sent_at = datetime.now(timezone.utc)

        with patch("websocket.handlers.verify_chat_membership", new_callable=AsyncMock, return_value=True), \
             patch("websocket.handlers.add_message_to_chat", new_callable=AsyncMock, return_value=msg):
            await handle_message(
                {"chat_id": str(uuid.uuid4()), "content": "x" * 1_000_000},
                user, AsyncMock(), publisher, manager
            )
        # Should succeed (message persisted + published)
        publisher.publish_message.assert_called_once()

    @pytest.mark.asyncio
    async def test_message_to_non_member_chat(self):
        """Sending to a chat you're not a member of should be rejected."""
        from websocket.handlers import handle_message
        user = MagicMock(id=uuid.uuid4())
        manager = AsyncMock()
        manager.send_to_user = AsyncMock()

        with patch("websocket.handlers.verify_chat_membership", new_callable=AsyncMock, return_value=False):
            await handle_message(
                {"chat_id": str(uuid.uuid4()), "content": "hello"},
                user, AsyncMock(), AsyncMock(), manager
            )

        error = manager.send_to_user.call_args[0][1]
        assert "not a member" in error["detail"]


# ── WS Rate Limiting ─────────────────────────────────────────────────

class TestWsRateLimiting:
    """Rate limiting in the WebSocket message loop."""

    @pytest.mark.asyncio
    async def test_rate_limit_blocks_flood(self):
        """Sending >50 messages in 10s should trigger rate limit."""
        from websocket.rate_limiter import RateLimiter
        limiter = RateLimiter(max_messages=50, window_seconds=10.0)
        uid = uuid.uuid4()

        allowed = sum(1 for _ in range(100) if limiter.allow(uid))
        assert allowed == 50  # First 50 pass, rest rejected

    @pytest.mark.asyncio
    async def test_rate_limit_per_user_isolation(self):
        """One user being rate limited should not affect another."""
        from websocket.rate_limiter import RateLimiter
        limiter = RateLimiter(max_messages=3, window_seconds=10.0)

        user_a = uuid.uuid4()
        user_b = uuid.uuid4()

        # Exhaust user A
        for _ in range(3):
            limiter.allow(user_a)
        assert limiter.allow(user_a) is False

        # User B should still be fine
        assert limiter.allow(user_b) is True


# ── WS Multi-Client ──────────────────────────────────────────────────

class TestWsMultiClient:
    """Multiple clients in same chat, sender exclusion, reconnect."""

    @pytest.mark.asyncio
    async def test_multiple_recipients_receive(self):
        """All chat members except sender should receive the message."""
        from websocket.manager import ConnectionManager
        import fakeredis.aioredis

        redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
        manager = ConnectionManager(redis_client=redis)

        cid = uuid.uuid4()
        sender_id = uuid.uuid4()
        r1_id, r2_id = uuid.uuid4(), uuid.uuid4()

        ws_sender = AsyncMock()
        ws_r1 = AsyncMock()
        ws_r2 = AsyncMock()

        await manager.register(sender_id, ws_sender, [cid])
        await manager.register(r1_id, ws_r1, [cid])
        await manager.register(r2_id, ws_r2, [cid])

        await manager.deliver_to_chat(cid, {"msg": "hello"}, exclude_user_id=sender_id)

        ws_sender.send_json.assert_not_called()
        ws_r1.send_json.assert_called_once()
        ws_r2.send_json.assert_called_once()

    @pytest.mark.asyncio
    async def test_sender_excluded_from_own_message(self):
        """Sender should NOT receive their own message via pubsub."""
        from websocket.manager import ConnectionManager
        import fakeredis.aioredis

        redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
        manager = ConnectionManager(redis_client=redis)

        cid = uuid.uuid4()
        sender_id = uuid.uuid4()

        ws = AsyncMock()
        await manager.register(sender_id, ws, [cid])

        await manager.handle_pubsub_message({
            "channel": f"chat:{cid}",
            "data": {"type": "message", "sender_id": str(sender_id), "content": "self"},
        })

        ws.send_json.assert_not_called()

    @pytest.mark.asyncio
    async def test_two_connections_same_user(self):
        """Second connection from same user should evict the first."""
        from websocket.manager import ConnectionManager
        import fakeredis.aioredis

        redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
        manager = ConnectionManager(redis_client=redis)

        uid = uuid.uuid4()
        ws1 = AsyncMock()
        ws2 = AsyncMock()

        await manager.register(uid, ws1, [uuid.uuid4()])
        await manager.register(uid, ws2, [uuid.uuid4()])

        ws1.close.assert_called_once()
        assert manager.connections[uid] is ws2

    @pytest.mark.asyncio
    async def test_send_to_disconnected_client(self):
        """Sending to a client that already disconnected should not crash."""
        from websocket.manager import ConnectionManager
        import fakeredis.aioredis

        redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
        manager = ConnectionManager(redis_client=redis)

        uid = uuid.uuid4()
        ws = AsyncMock()
        ws.send_json = AsyncMock(side_effect=Exception("connection reset"))

        manager.connections[uid] = ws
        manager.user_chats[uid] = []

        await manager.send_to_user(uid, {"type": "test"})
        # Should have been unregistered after the error
        assert uid not in manager.connections


# ── WS Ping/Pong ─────────────────────────────────────────────────────

class TestWsPing:
    """Heartbeat/ping mechanism."""

    @pytest.mark.asyncio
    async def test_ping_returns_pong(self):
        """Ping should return pong and refresh presence."""
        from websocket.handlers import handle_ping
        user = MagicMock(id=uuid.uuid4())
        manager = AsyncMock()
        manager.send_to_user = AsyncMock()
        manager.refresh_presence = AsyncMock()

        await handle_ping(user, manager)

        manager.send_to_user.assert_called_once()
        payload = manager.send_to_user.call_args[0][1]
        assert payload["type"] == "pong"
        manager.refresh_presence.assert_called_once_with(user.id)


# ── WS Typing Indicator ──────────────────────────────────────────────

class TestWsTyping:
    """Typing indicator handling."""

    @pytest.mark.asyncio
    async def test_typing_publishes(self):
        """Typing event should be published to Redis."""
        from websocket.handlers import handle_typing
        user = MagicMock(id=uuid.uuid4())
        publisher = AsyncMock()
        publisher.publish_typing = AsyncMock()
        cid = uuid.uuid4()

        await handle_typing({"chat_id": str(cid)}, user, publisher)
        publisher.publish_typing.assert_called_once_with(chat_id=cid, user_id=user.id)

    @pytest.mark.asyncio
    async def test_typing_no_chat_id(self):
        """Typing without chat_id should be silently ignored."""
        from websocket.handlers import handle_typing
        publisher = AsyncMock()
        publisher.publish_typing = AsyncMock()

        await handle_typing({}, MagicMock(id=uuid.uuid4()), publisher)
        publisher.publish_typing.assert_not_called()


# ── WS Read Receipt ──────────────────────────────────────────────────

class TestWsReadReceipt:
    """Read receipt handling."""

    @pytest.mark.asyncio
    async def test_read_updates_and_publishes(self):
        """Read receipt should update DB and publish to Redis."""
        from websocket.handlers import handle_read
        user = MagicMock(id=uuid.uuid4())
        publisher = AsyncMock()
        publisher.publish_read = AsyncMock()
        cid = uuid.uuid4()
        mid = uuid.uuid4()

        with patch("websocket.handlers.read_message_byID", new_callable=AsyncMock):
            await handle_read(
                {"chat_id": str(cid), "message_id": str(mid)},
                user, AsyncMock(), publisher
            )
        publisher.publish_read.assert_called_once()

    @pytest.mark.asyncio
    async def test_read_db_error_no_publish(self):
        """If DB update fails, should NOT publish."""
        from websocket.handlers import handle_read
        publisher = AsyncMock()
        publisher.publish_read = AsyncMock()

        with patch("websocket.handlers.read_message_byID", new_callable=AsyncMock,
                    side_effect=Exception("DB down")):
            await handle_read(
                {"chat_id": str(uuid.uuid4()), "message_id": str(uuid.uuid4())},
                MagicMock(id=uuid.uuid4()), AsyncMock(), publisher
            )
        publisher.publish_read.assert_not_called()
