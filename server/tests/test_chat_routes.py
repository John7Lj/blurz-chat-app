# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Integration tests for server/chats/routes.py
Tests: GET /chats/mine, POST /chats/start, DELETE /chats/delete
"""
import pytest
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone


class TestGetMyChats:
    @pytest.mark.asyncio
    async def test_returns_chats(self, mock_session, sample_user_model):
        from httpx import AsyncClient, ASGITransport

        chat = MagicMock()
        chat.id = uuid.uuid4()
        chat.created_at = datetime.now(timezone.utc)
        other = MagicMock()
        other.id = uuid.uuid4()
        other.first_name = "Other"
        other.last_name = "User"
        other.profile_url = ""
        other.phone = "+1234567890"
        other.bio = "Hey there! I am using Blurz."

        with patch("chats.router.get_user_chats_with_others", new_callable=AsyncMock, return_value=[(chat, other)]):
            from main import app
            from db.main import get_session
            from auth.dependencies import get_current_user

            async def override_session():
                yield mock_session
            async def override_user():
                return sample_user_model

            app.dependency_overrides[get_session] = override_session
            app.dependency_overrides[get_current_user] = override_user

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                resp = await ac.get("/api/v1/chats/mine")
            assert resp.status_code == 200
            assert isinstance(resp.json(), list)
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_empty_chats(self, mock_session, sample_user_model):
        from httpx import AsyncClient, ASGITransport

        with patch("chats.router.get_user_chats_with_others", new_callable=AsyncMock, return_value=[]):
            from main import app
            from db.main import get_session
            from auth.dependencies import get_current_user

            async def override_session():
                yield mock_session
            async def override_user():
                return sample_user_model

            app.dependency_overrides[get_session] = override_session
            app.dependency_overrides[get_current_user] = override_user

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                resp = await ac.get("/api/v1/chats/mine")
            assert resp.status_code == 200
            assert resp.json() == []
            app.dependency_overrides.clear()


class TestStartChat:
    @pytest.mark.asyncio
    async def test_self_chat_rejected(self, mock_session, sample_user_model):
        from httpx import AsyncClient, ASGITransport
        from main import app
        from db.main import get_session
        from auth.dependencies import get_current_user

        async def override_session():
            yield mock_session
        async def override_user():
            return sample_user_model

        app.dependency_overrides[get_session] = override_session
        app.dependency_overrides[get_current_user] = override_user

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.post("/api/v1/chats/start", json={
                "recipient_id": str(sample_user_model.id),
                "message": "hi me",
            })
        assert resp.status_code == 400
        app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_recipient_not_found(self, mock_session, sample_user_model):
        from httpx import AsyncClient, ASGITransport

        with patch("chats.router.get_user_by_id", new_callable=AsyncMock, return_value=None):
            from main import app
            from db.main import get_session
            from auth.dependencies import get_current_user

            async def override_session():
                yield mock_session
            async def override_user():
                return sample_user_model

            app.dependency_overrides[get_session] = override_session
            app.dependency_overrides[get_current_user] = override_user

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                resp = await ac.post("/api/v1/chats/start", json={
                    "recipient_id": str(uuid.uuid4()),
                    "message": "hello",
                })
            assert resp.status_code == 404
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_new_chat_created(self, mock_session, sample_user_model):
        from httpx import AsyncClient, ASGITransport

        recipient = MagicMock()
        recipient.id = uuid.uuid4()

        chat = MagicMock()
        chat.id = uuid.uuid4()
        msg = MagicMock()
        msg.id = uuid.uuid4()
        msg.content = "hello"
        msg.sender_id = sample_user_model.id
        msg.chat_id = chat.id
        msg.sent_at = datetime.now(timezone.utc)
        msg.model_dump = MagicMock(return_value={
            "id": msg.id, "content": "hello", "sender_id": msg.sender_id,
            "chat_id": msg.chat_id, "sent_at": msg.sent_at,
        })

        with patch("chats.router.get_user_by_id", new_callable=AsyncMock, return_value=recipient), \
             patch("chats.router.find_existing_chat", new_callable=AsyncMock, return_value=None), \
             patch("chats.router.create_chat_with_message", new_callable=AsyncMock, return_value=(chat, msg)):
            from main import app
            from db.main import get_session
            from auth.dependencies import get_current_user

            async def override_session():
                yield mock_session
            async def override_user():
                return sample_user_model

            app.dependency_overrides[get_session] = override_session
            app.dependency_overrides[get_current_user] = override_user

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                resp = await ac.post("/api/v1/chats/start", json={
                    "recipient_id": str(recipient.id),
                    "message": "hello",
                })
            assert resp.status_code == 200
            assert resp.json()["is_new"] is True
            app.dependency_overrides.clear()
