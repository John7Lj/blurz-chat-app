# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Unit tests for server/websocket/handlers.py
Tests: handle_incoming dispatcher, handle_message (with membership validation),
       handle_typing, handle_read, handle_ping
"""
import pytest
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone


@pytest.fixture
def user():
    u = MagicMock()
    u.id = uuid.uuid4()
    u.username = "testuser"
    return u


# ── Dispatcher ────────────────────────────────────────────────────────

class TestHandleIncoming:
    @pytest.mark.asyncio
    async def test_dispatches_message_type(self, user, mock_publisher, mock_manager, mock_session):
        from websocket.handlers import handle_incoming
        data = {"type": "message", "chat_id": str(uuid.uuid4()), "content": "hi"}

        with patch("websocket.handlers.handle_message", new_callable=AsyncMock) as mock_hm:
            await handle_incoming(data, user, mock_session, mock_publisher, mock_manager)
            mock_hm.assert_called_once()

    @pytest.mark.asyncio
    async def test_dispatches_typing_type(self, user, mock_publisher, mock_manager, mock_session):
        from websocket.handlers import handle_incoming
        data = {"type": "typing", "chat_id": str(uuid.uuid4())}

        with patch("websocket.handlers.handle_typing", new_callable=AsyncMock) as mock_ht:
            await handle_incoming(data, user, mock_session, mock_publisher, mock_manager)
            mock_ht.assert_called_once()

    @pytest.mark.asyncio
    async def test_dispatches_read_type(self, user, mock_publisher, mock_manager, mock_session):
        from websocket.handlers import handle_incoming
        data = {"type": "read", "chat_id": str(uuid.uuid4()), "message_id": str(uuid.uuid4())}

        with patch("websocket.handlers.handle_read", new_callable=AsyncMock) as mock_hr:
            await handle_incoming(data, user, mock_session, mock_publisher, mock_manager)
            mock_hr.assert_called_once()

    @pytest.mark.asyncio
    async def test_dispatches_ping_type(self, user, mock_publisher, mock_manager, mock_session):
        from websocket.handlers import handle_incoming
        data = {"type": "ping"}

        with patch("websocket.handlers.handle_ping", new_callable=AsyncMock) as mock_hp:
            await handle_incoming(data, user, mock_session, mock_publisher, mock_manager)
            mock_hp.assert_called_once()

    @pytest.mark.asyncio
    async def test_unknown_type_sends_error(self, user, mock_publisher, mock_manager, mock_session):
        from websocket.handlers import handle_incoming
        data = {"type": "INVALID"}
        await handle_incoming(data, user, mock_session, mock_publisher, mock_manager)
        mock_manager.send_to_user.assert_called_once()
        args = mock_manager.send_to_user.call_args
        assert args[0][1]["type"] == "error"

    @pytest.mark.asyncio
    async def test_missing_type_sends_error(self, user, mock_publisher, mock_manager, mock_session):
        from websocket.handlers import handle_incoming
        data = {"content": "no type field"}
        await handle_incoming(data, user, mock_session, mock_publisher, mock_manager)
        mock_manager.send_to_user.assert_called_once()


# ── Handle message (with membership validation) ──────────────────────

class TestHandleMessage:
    @pytest.mark.asyncio
    async def test_missing_chat_id_sends_error(self, user, mock_publisher, mock_manager):
        from websocket.handlers import handle_message
        data = {"content": "hello"}
        await handle_message(data, user, AsyncMock(), mock_publisher, mock_manager)
        mock_manager.send_to_user.assert_called_once()
        assert "Missing" in mock_manager.send_to_user.call_args[0][1]["detail"]

    @pytest.mark.asyncio
    async def test_missing_content_sends_error(self, user, mock_publisher, mock_manager):
        from websocket.handlers import handle_message
        data = {"chat_id": str(uuid.uuid4())}
        await handle_message(data, user, AsyncMock(), mock_publisher, mock_manager)
        mock_manager.send_to_user.assert_called_once()

    @pytest.mark.asyncio
    async def test_invalid_uuid_sends_error(self, user, mock_publisher, mock_manager):
        from websocket.handlers import handle_message
        data = {"chat_id": "not-a-uuid", "content": "hi"}
        await handle_message(data, user, AsyncMock(), mock_publisher, mock_manager)
        mock_manager.send_to_user.assert_called_once()
        assert "Invalid" in mock_manager.send_to_user.call_args[0][1]["detail"]

    @pytest.mark.asyncio
    async def test_non_member_rejected(self, user, mock_publisher, mock_manager):
        """User who is NOT a member of the chat should be rejected."""
        from websocket.handlers import handle_message
        cid = uuid.uuid4()

        with patch("websocket.handlers.verify_chat_membership", new_callable=AsyncMock, return_value=False):
            data = {"chat_id": str(cid), "content": "hello"}
            await handle_message(data, user, AsyncMock(), mock_publisher, mock_manager)
            mock_manager.send_to_user.assert_called_once()
            assert "not a member" in mock_manager.send_to_user.call_args[0][1]["detail"]
            mock_publisher.publish_message.assert_not_called()

    @pytest.mark.asyncio
    async def test_member_can_send(self, user, mock_publisher, mock_manager):
        """User who IS a member should have their message persisted and published."""
        from websocket.handlers import handle_message
        cid = uuid.uuid4()
        msg_mock = MagicMock()
        msg_mock.id = uuid.uuid4()
        msg_mock.sent_at = datetime.now(timezone.utc)

        with patch("websocket.handlers.verify_chat_membership", new_callable=AsyncMock, return_value=True), \
             patch("websocket.handlers.add_message_to_chat", new_callable=AsyncMock, return_value=msg_mock):
            data = {"chat_id": str(cid), "content": "hello"}
            await handle_message(data, user, AsyncMock(), mock_publisher, mock_manager)
            # Should send ack to sender
            assert mock_manager.send_to_user.call_count == 1
            ack = mock_manager.send_to_user.call_args[0][1]
            assert ack["type"] == "message_ack"
            # Should publish to Redis
            mock_publisher.publish_message.assert_called_once()

    @pytest.mark.asyncio
    async def test_membership_check_failure_sends_error(self, user, mock_publisher, mock_manager):
        """If the membership check itself fails (DB error), send error."""
        from websocket.handlers import handle_message
        cid = uuid.uuid4()

        with patch("websocket.handlers.verify_chat_membership", new_callable=AsyncMock, side_effect=Exception("DB down")):
            data = {"chat_id": str(cid), "content": "hello"}
            await handle_message(data, user, AsyncMock(), mock_publisher, mock_manager)
            mock_manager.send_to_user.assert_called_once()
            assert "verify" in mock_manager.send_to_user.call_args[0][1]["detail"].lower()

    @pytest.mark.asyncio
    async def test_persist_failure_sends_error(self, user, mock_publisher, mock_manager):
        """If persisting the message fails, send error and don't publish."""
        from websocket.handlers import handle_message
        cid = uuid.uuid4()

        with patch("websocket.handlers.verify_chat_membership", new_callable=AsyncMock, return_value=True), \
             patch("websocket.handlers.add_message_to_chat", new_callable=AsyncMock, side_effect=Exception("DB error")):
            data = {"chat_id": str(cid), "content": "hello"}
            await handle_message(data, user, AsyncMock(), mock_publisher, mock_manager)
            mock_manager.send_to_user.assert_called_once()
            assert "Failed" in mock_manager.send_to_user.call_args[0][1]["detail"]
            mock_publisher.publish_message.assert_not_called()


# ── Handle typing ─────────────────────────────────────────────────────

class TestHandleTyping:
    @pytest.mark.asyncio
    async def test_publishes_typing(self, user, mock_publisher):
        from websocket.handlers import handle_typing
        cid = uuid.uuid4()
        await handle_typing({"chat_id": str(cid)}, user, mock_publisher)
        mock_publisher.publish_typing.assert_called_once_with(chat_id=cid, user_id=user.id)

    @pytest.mark.asyncio
    async def test_no_chat_id_noop(self, user, mock_publisher):
        from websocket.handlers import handle_typing
        await handle_typing({}, user, mock_publisher)
        mock_publisher.publish_typing.assert_not_called()

    @pytest.mark.asyncio
    async def test_invalid_chat_id_noop(self, user, mock_publisher):
        from websocket.handlers import handle_typing
        await handle_typing({"chat_id": "invalid"}, user, mock_publisher)
        mock_publisher.publish_typing.assert_not_called()


# ── Handle read ───────────────────────────────────────────────────────

class TestHandleRead:
    @pytest.mark.asyncio
    async def test_updates_and_publishes(self, user, mock_publisher, mock_session):
        from websocket.handlers import handle_read
        cid, mid = uuid.uuid4(), uuid.uuid4()
        with patch("websocket.handlers.read_message_byID", new_callable=AsyncMock):
            await handle_read({"chat_id": str(cid), "message_id": str(mid)}, user, mock_session, mock_publisher)
            mock_publisher.publish_read.assert_called_once()

    @pytest.mark.asyncio
    async def test_missing_fields_noop(self, user, mock_publisher, mock_session):
        from websocket.handlers import handle_read
        await handle_read({}, user, mock_session, mock_publisher)
        mock_publisher.publish_read.assert_not_called()

    @pytest.mark.asyncio
    async def test_db_error_does_not_publish(self, user, mock_publisher, mock_session):
        from websocket.handlers import handle_read
        cid, mid = uuid.uuid4(), uuid.uuid4()
        with patch("websocket.handlers.read_message_byID", new_callable=AsyncMock, side_effect=Exception("DB error")):
            await handle_read({"chat_id": str(cid), "message_id": str(mid)}, user, mock_session, mock_publisher)
            mock_publisher.publish_read.assert_not_called()


# ── Handle ping ───────────────────────────────────────────────────────

class TestHandlePing:
    @pytest.mark.asyncio
    async def test_sends_pong(self, user, mock_manager):
        from websocket.handlers import handle_ping
        await handle_ping(user, mock_manager)
        mock_manager.send_to_user.assert_called_once()
        payload = mock_manager.send_to_user.call_args[0][1]
        assert payload["type"] == "pong"
        mock_manager.refresh_presence.assert_called_once()
