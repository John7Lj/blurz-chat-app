# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Unit tests for server/websocket/manager.py
Tests: ConnectionManager — register, unregister, presence, delivery, pubsub callback
"""
import pytest
import uuid
from unittest.mock import AsyncMock, MagicMock


@pytest.fixture
def redis_mock():
    r = AsyncMock()
    r.set = AsyncMock()
    r.delete = AsyncMock()
    return r


@pytest.fixture
def manager(redis_mock):
    from websocket.manager import ConnectionManager
    return ConnectionManager(redis_client=redis_mock)


# ── Register ──────────────────────────────────────────────────────────

class TestRegister:
    @pytest.mark.asyncio
    async def test_registers_new_user(self, manager):
        uid = uuid.uuid4()
        ws = AsyncMock()
        await manager.register(uid, ws, [uuid.uuid4()])
        assert uid in manager.connections

    @pytest.mark.asyncio
    async def test_evicts_old_connection(self, manager):
        uid = uuid.uuid4()
        old_ws, new_ws = AsyncMock(), AsyncMock()
        await manager.register(uid, old_ws, [])
        await manager.register(uid, new_ws, [])
        old_ws.close.assert_called_once()
        assert manager.connections[uid] is new_ws

    @pytest.mark.asyncio
    async def test_sets_presence(self, manager, redis_mock):
        uid = uuid.uuid4()
        await manager.register(uid, AsyncMock(), [])
        redis_mock.set.assert_called_with(f"presence:{uid}", "online", ex=60)

    @pytest.mark.asyncio
    async def test_tracks_chat_members(self, manager):
        uid, cid = uuid.uuid4(), uuid.uuid4()
        await manager.register(uid, AsyncMock(), [cid])
        assert uid in manager.chat_members[cid]

    @pytest.mark.asyncio
    async def test_stores_user_chats(self, manager):
        uid = uuid.uuid4()
        cids = [uuid.uuid4(), uuid.uuid4()]
        await manager.register(uid, AsyncMock(), cids)
        assert manager.user_chats[uid] == cids

    @pytest.mark.asyncio
    async def test_multiple_users_same_chat(self, manager):
        cid = uuid.uuid4()
        u1, u2 = uuid.uuid4(), uuid.uuid4()
        await manager.register(u1, AsyncMock(), [cid])
        await manager.register(u2, AsyncMock(), [cid])
        assert u1 in manager.chat_members[cid]
        assert u2 in manager.chat_members[cid]


# ── Unregister ────────────────────────────────────────────────────────

class TestUnregister:
    @pytest.mark.asyncio
    async def test_removes_connection(self, manager):
        uid = uuid.uuid4()
        await manager.register(uid, AsyncMock(), [])
        await manager.unregister(uid)
        assert uid not in manager.connections

    @pytest.mark.asyncio
    async def test_deletes_presence(self, manager, redis_mock):
        uid = uuid.uuid4()
        await manager.register(uid, AsyncMock(), [])
        await manager.unregister(uid)
        redis_mock.delete.assert_called_with(f"presence:{uid}")

    @pytest.mark.asyncio
    async def test_returns_orphaned_channels(self, manager):
        uid, cid = uuid.uuid4(), uuid.uuid4()
        await manager.register(uid, AsyncMock(), [cid])
        orphaned = await manager.unregister(uid)
        assert cid in orphaned

    @pytest.mark.asyncio
    async def test_shared_channel_not_orphaned(self, manager):
        """If another user still needs the channel, it's not orphaned."""
        cid = uuid.uuid4()
        u1, u2 = uuid.uuid4(), uuid.uuid4()
        await manager.register(u1, AsyncMock(), [cid])
        await manager.register(u2, AsyncMock(), [cid])
        orphaned = await manager.unregister(u1)
        assert cid not in orphaned  # u2 still needs it

    @pytest.mark.asyncio
    async def test_unregister_nonexistent_user(self, manager):
        """Should not crash for unknown user."""
        result = await manager.unregister(uuid.uuid4())
        assert result == []

    @pytest.mark.asyncio
    async def test_cleans_up_chat_members(self, manager):
        uid, cid = uuid.uuid4(), uuid.uuid4()
        await manager.register(uid, AsyncMock(), [cid])
        assert uid in manager.chat_members[cid]
        await manager.unregister(uid)
        assert cid not in manager.chat_members  # deleted because empty


# ── Presence ──────────────────────────────────────────────────────────

class TestPresence:
    @pytest.mark.asyncio
    async def test_refresh_presence(self, manager, redis_mock):
        uid = uuid.uuid4()
        await manager.refresh_presence(uid)
        redis_mock.set.assert_called_with(f"presence:{uid}", "online", ex=60)

    def test_is_online_true(self, manager):
        uid = uuid.uuid4()
        manager.connections[uid] = AsyncMock()
        assert manager.is_online(uid) is True

    def test_is_online_false(self, manager):
        assert manager.is_online(uuid.uuid4()) is False


# ── Send to user ──────────────────────────────────────────────────────

class TestSendToUser:
    @pytest.mark.asyncio
    async def test_sends_json(self, manager):
        uid = uuid.uuid4()
        ws = AsyncMock()
        manager.connections[uid] = ws
        await manager.send_to_user(uid, {"type": "test"})
        ws.send_json.assert_called_once_with({"type": "test"})

    @pytest.mark.asyncio
    async def test_noop_for_disconnected(self, manager):
        """Should not crash when user is not connected."""
        await manager.send_to_user(uuid.uuid4(), {"type": "test"})

    @pytest.mark.asyncio
    async def test_unregisters_on_error(self, manager):
        uid = uuid.uuid4()
        ws = AsyncMock()
        ws.send_json = AsyncMock(side_effect=Exception("lost"))
        manager.connections[uid] = ws
        manager.user_chats[uid] = []
        await manager.send_to_user(uid, {"type": "test"})
        assert uid not in manager.connections


# ── Deliver to chat ───────────────────────────────────────────────────

class TestDeliverToChat:
    @pytest.mark.asyncio
    async def test_delivers_to_all(self, manager):
        cid = uuid.uuid4()
        uid1, uid2 = uuid.uuid4(), uuid.uuid4()
        ws1, ws2 = AsyncMock(), AsyncMock()
        manager.connections[uid1] = ws1
        manager.connections[uid2] = ws2
        manager.chat_members[cid] = {uid1, uid2}
        await manager.deliver_to_chat(cid, {"type": "msg"})
        ws1.send_json.assert_called_once()
        ws2.send_json.assert_called_once()

    @pytest.mark.asyncio
    async def test_excludes_sender(self, manager):
        cid = uuid.uuid4()
        sid, rid = uuid.uuid4(), uuid.uuid4()
        ws_s, ws_r = AsyncMock(), AsyncMock()
        manager.connections[sid] = ws_s
        manager.connections[rid] = ws_r
        manager.chat_members[cid] = {sid, rid}
        await manager.deliver_to_chat(cid, {"type": "msg"}, exclude_user_id=sid)
        ws_s.send_json.assert_not_called()
        ws_r.send_json.assert_called_once()

    @pytest.mark.asyncio
    async def test_noop_for_empty_chat(self, manager):
        await manager.deliver_to_chat(uuid.uuid4(), {"type": "msg"})


# ── PubSub callback ──────────────────────────────────────────────────

class TestHandlePubSubMessage:
    @pytest.mark.asyncio
    async def test_delivers_message_to_chat(self, manager):
        cid = uuid.uuid4()
        sid = uuid.uuid4()
        rid = uuid.uuid4()

        ws_r = AsyncMock()
        manager.connections[rid] = ws_r
        manager.chat_members[cid] = {sid, rid}

        decoded = {
            "channel": f"chat:{cid}",
            "data": {
                "type": "message",
                "sender_id": str(sid),
                "content": "hello",
            }
        }
        await manager.handle_pubsub_message(decoded)
        ws_r.send_json.assert_called_once()

    @pytest.mark.asyncio
    async def test_excludes_sender_from_delivery(self, manager):
        cid = uuid.uuid4()
        sid = uuid.uuid4()

        ws_s = AsyncMock()
        manager.connections[sid] = ws_s
        manager.chat_members[cid] = {sid}

        decoded = {
            "channel": f"chat:{cid}",
            "data": {"type": "message", "sender_id": str(sid), "content": "hi"}
        }
        await manager.handle_pubsub_message(decoded)
        ws_s.send_json.assert_not_called()

    @pytest.mark.asyncio
    async def test_bad_format_does_not_crash(self, manager):
        """Malformed messages should be logged, not crash."""
        await manager.handle_pubsub_message({"bad": "data"})

    @pytest.mark.asyncio
    async def test_missing_sender_id(self, manager):
        """Messages without sender_id should still be delivered to all."""
        cid = uuid.uuid4()
        uid = uuid.uuid4()
        ws = AsyncMock()
        manager.connections[uid] = ws
        manager.chat_members[cid] = {uid}

        decoded = {
            "channel": f"chat:{cid}",
            "data": {"type": "typing", "content": "..."}
        }
        await manager.handle_pubsub_message(decoded)
        ws.send_json.assert_called_once()
