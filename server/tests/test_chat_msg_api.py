# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
═══════════════════════════════════════════════════════════════════════
  CHAT & MESSAGE REST API TESTS
  Endpoints: GET /chats/mine, POST /chats/start, DELETE /chats/delete
             GET /messages/{chat_id}, DELETE /messages/messages,
             PATCH /messages/messages/{id}, PATCH /messages/messages/{id}/read
═══════════════════════════════════════════════════════════════════════

Risk priority: HIGH — chat CRUD correctness is core functionality.
"""
import pytest
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport


# ── Fixtures ──────────────────────────────────────────────────────────

@pytest.fixture
async def authed_client(sample_user_model, mock_session):
    """Client with auth and DB mocked out."""
    from main import app
    from db.main import get_session
    from auth.dependencies import get_current_user, AccessTokenBearer

    async def _override_session():
        yield mock_session

    async def _override_user():
        return sample_user_model

    async def _override_token():
        return {
            "user": {"email": sample_user_model.email, "id": str(sample_user_model.id), "username": "testuser"},
            "jti": str(uuid.uuid4()),
            "refresh_token": False,
        }

    app.dependency_overrides[get_session] = _override_session
    app.dependency_overrides[get_current_user] = _override_user
    app.dependency_overrides[AccessTokenBearer()] = _override_token

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    app.dependency_overrides.clear()


# ═══════════════════════════════════════════════════════════════════════
#  CHAT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════

class TestGetMyChats:
    """GET /chats/mine"""

    @pytest.mark.asyncio
    async def test_returns_user_chats(self, authed_client, sample_user_model):
        """Should return list of chats for authenticated user."""
        mock_chat = MagicMock()
        mock_chat.id = uuid.uuid4()
        mock_chat.created_at = datetime.now(timezone.utc)

        mock_other_user = MagicMock()
        mock_other_user.id = uuid.uuid4()
        mock_other_user.first_name = "Other"
        mock_other_user.last_name = "User"
        mock_other_user.profile_url = ""
        mock_other_user.phone = "+1234567890"
        mock_other_user.bio = "Hey there! I am using Blurz."

        with patch("chats.router.get_user_chats_with_others", new_callable=AsyncMock,
                    return_value=[(mock_chat, mock_other_user)]):
            resp = await authed_client.get("/api/v1/chats/mine")

        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 1

    @pytest.mark.asyncio
    async def test_returns_empty_list(self, authed_client):
        """User with no chats should get empty list."""
        with patch("chats.router.get_user_chats_with_others", new_callable=AsyncMock, return_value=[]):
            resp = await authed_client.get("/api/v1/chats/mine")
        assert resp.status_code == 200
        assert resp.json() == []

    @pytest.mark.asyncio
    async def test_wrong_http_method(self, authed_client):
        """POST to GET-only endpoint should return 405."""
        resp = await authed_client.post("/api/v1/chats/mine")
        assert resp.status_code == 405


class TestStartChat:
    """POST /chats/start"""

    @pytest.mark.asyncio
    async def test_start_chat_with_self_rejected(self, authed_client, sample_user_model):
        """Cannot start a chat with yourself."""
        resp = await authed_client.post("/api/v1/chats/start", json={
            "recipient_id": str(sample_user_model.id),
            "message": "Hello me",
        })
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_start_chat_nonexistent_user(self, authed_client):
        """Chat with non-existent user should return 404."""
        with patch("chats.router.get_user_by_id", new_callable=AsyncMock, return_value=None):
            resp = await authed_client.post("/api/v1/chats/start", json={
                "recipient_id": str(uuid.uuid4()),
                "message": "Hello stranger",
            })
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_start_chat_missing_recipient(self, authed_client):
        """Missing recipient_id should return 422."""
        resp = await authed_client.post("/api/v1/chats/start", json={"message": "Hello"})
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_start_chat_missing_message(self, authed_client):
        """Missing message should return 422."""
        resp = await authed_client.post("/api/v1/chats/start", json={
            "recipient_id": str(uuid.uuid4()),
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_start_chat_invalid_uuid(self, authed_client):
        """Invalid UUID for recipient should return 422."""
        resp = await authed_client.post("/api/v1/chats/start", json={
            "recipient_id": "not-a-uuid",
            "message": "Hello",
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_start_chat_existing_chat(self, authed_client, sample_user_model, sample_message_model):
        """If chat already exists, should add message to it."""
        recipient = MagicMock()
        recipient.id = uuid.uuid4()

        existing_chat = MagicMock()
        existing_chat.id = uuid.uuid4()

        with patch("chats.router.get_user_by_id", new_callable=AsyncMock, return_value=recipient), \
             patch("chats.router.find_existing_chat", new_callable=AsyncMock, return_value=existing_chat), \
             patch("chats.router.add_message_to_chat", new_callable=AsyncMock, return_value=sample_message_model):
            resp = await authed_client.post("/api/v1/chats/start", json={
                "recipient_id": str(recipient.id),
                "message": "Hello existing",
            })

        assert resp.status_code == 200
        body = resp.json()
        assert body["is_new"] is False

    @pytest.mark.asyncio
    async def test_start_chat_new_chat(self, authed_client, sample_user_model, sample_message_model, sample_chat_model):
        """If no existing chat, should create new one."""
        recipient = MagicMock()
        recipient.id = uuid.uuid4()

        with patch("chats.router.get_user_by_id", new_callable=AsyncMock, return_value=recipient), \
             patch("chats.router.find_existing_chat", new_callable=AsyncMock, return_value=None), \
             patch("chats.router.create_chat_with_message", new_callable=AsyncMock,
                   return_value=(sample_chat_model, sample_message_model)):
            resp = await authed_client.post("/api/v1/chats/start", json={
                "recipient_id": str(recipient.id),
                "message": "Hello new",
            })

        assert resp.status_code == 200
        body = resp.json()
        assert body["is_new"] is True

    @pytest.mark.asyncio
    async def test_start_chat_extremely_long_message(self, authed_client):
        """10,000+ character message should be handled (not crash)."""
        with patch("chats.router.get_user_by_id", new_callable=AsyncMock, return_value=MagicMock(id=uuid.uuid4())), \
             patch("chats.router.find_existing_chat", new_callable=AsyncMock, return_value=None), \
             patch("chats.router.create_chat_with_message", new_callable=AsyncMock) as mock_create:
            mock_chat = MagicMock(id=uuid.uuid4())
            mock_msg = MagicMock()
            mock_msg.model_dump = MagicMock(return_value={
                "id": uuid.uuid4(), "content": "x" * 10_000, "sender_id": uuid.uuid4(),
                "chat_id": mock_chat.id, "sent_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc), "msg_type": "text",
                "status": "sent", "file_key": None, "file_name": None,
            })
            mock_create.return_value = (mock_chat, mock_msg)

            resp = await authed_client.post("/api/v1/chats/start", json={
                "recipient_id": str(uuid.uuid4()),
                "message": "x" * 10_000,
            })
        assert resp.status_code in (200, 422)  # either accepted or rejected, never 500


class TestDeleteChats:
    """DELETE /chats/delete"""

    @pytest.mark.asyncio
    async def test_delete_success(self, authed_client, sample_user_model):
        """Deleting owned chats should return 200."""
        cid = uuid.uuid4()
        with patch("chats.router.delete_chats_service", new_callable=AsyncMock, return_value=True):
            resp = await authed_client.delete(f"/api/v1/chats/delete?ids={cid}")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_nonexistent_chat(self, authed_client, sample_user_model):
        """Deleting non-existent chats should return 404."""
        with patch("chats.router.delete_chats_service", new_callable=AsyncMock, return_value=False):
            resp = await authed_client.delete(f"/api/v1/chats/delete?ids={uuid.uuid4()}")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_without_ids(self, authed_client):
        """Missing ids query param should return 422."""
        resp = await authed_client.delete("/api/v1/chats/delete")
        assert resp.status_code == 422


# ═══════════════════════════════════════════════════════════════════════
#  MESSAGE ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════

class TestGetMessages:
    """GET /messages/{chat_id}"""

    @pytest.mark.asyncio
    async def test_get_messages_success(self, authed_client, sample_user_model, sample_message_model):
        """Should return messages for a valid chat."""
        with patch("messages.router.get_message_by_chatId", new_callable=AsyncMock,
                    return_value=[sample_message_model]):
            cid = uuid.uuid4()
            resp = await authed_client.get(f"/api/v1/messages/{cid}")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_messages_empty_chat(self, authed_client):
        """Empty chat should return 404."""
        with patch("messages.router.get_message_by_chatId", new_callable=AsyncMock, return_value=[]):
            resp = await authed_client.get(f"/api/v1/messages/{uuid.uuid4()}")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_get_messages_invalid_uuid(self, authed_client):
        """Invalid chat_id should return 422."""
        resp = await authed_client.get("/api/v1/messages/not-a-uuid")
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_get_messages_pagination_limit_0(self, authed_client):
        """limit=0 should return 422 (ge=1)."""
        resp = await authed_client.get(f"/api/v1/messages/{uuid.uuid4()}?limit=0")
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_get_messages_pagination_limit_negative(self, authed_client):
        """Negative limit should return 422."""
        resp = await authed_client.get(f"/api/v1/messages/{uuid.uuid4()}?limit=-5")
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_get_messages_pagination_limit_too_high(self, authed_client):
        """limit > 100 should return 422 (le=100)."""
        resp = await authed_client.get(f"/api/v1/messages/{uuid.uuid4()}?limit=999")
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_get_messages_skip_negative(self, authed_client):
        """Negative skip should return 422."""
        resp = await authed_client.get(f"/api/v1/messages/{uuid.uuid4()}?skip=-1")
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_get_messages_float_limit(self, authed_client):
        """Float where int expected should return 422."""
        resp = await authed_client.get(f"/api/v1/messages/{uuid.uuid4()}?limit=3.5")
        assert resp.status_code == 422


class TestDeleteMessages:
    """DELETE /messages/messages"""

    @pytest.mark.asyncio
    async def test_delete_success(self, authed_client):
        """Delete owned messages should succeed."""
        mid = uuid.uuid4()
        with patch("messages.router.delete_messages_byID", new_callable=AsyncMock, return_value=True):
            resp = await authed_client.delete(f"/api/v1/messages/delete?message_id={mid}")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_without_ids(self, authed_client):
        """Missing message_id should return 422."""
        resp = await authed_client.delete("/api/v1/messages/delete")
        assert resp.status_code == 422


class TestEditMessage:
    """PATCH /messages/{message_id}"""

    @pytest.mark.asyncio
    async def test_edit_nonexistent_message(self, authed_client):
        """Editing non-existent message should return 404."""
        mid = uuid.uuid4()
        with patch("messages.router.edit_message_byID", new_callable=AsyncMock, return_value=False):
            resp = await authed_client.patch(f"/api/v1/messages/{mid}", json={"content": "updated"})
        assert resp.status_code == 404


class TestReadMessage:
    """PATCH /messages/{message_id}/read"""

    @pytest.mark.asyncio
    async def test_read_success(self, authed_client):
        """Marking a message as read should return 200."""
        mid = uuid.uuid4()
        with patch("messages.router.read_message_byID", new_callable=AsyncMock, return_value=True):
            resp = await authed_client.patch(f"/api/v1/messages/{mid}/read")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_read_nonexistent_message(self, authed_client):
        """Marking non-existent message as read should return 404."""
        mid = uuid.uuid4()
        with patch("messages.router.read_message_byID", new_callable=AsyncMock, return_value=False):
            resp = await authed_client.patch(f"/api/v1/messages/{mid}/read")
        assert resp.status_code == 404
