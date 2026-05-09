# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Integration tests for server/messages/routes.py
Tests: GET /messages/{chat_id}, DELETE, PATCH, PATCH read

Routes are mounted at /messages (no /api/v1 prefix).
"""
import pytest
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone


class TestGetMessages:
    @pytest.mark.asyncio
    async def test_returns_messages(self, mock_session, sample_user_model):
        from httpx import AsyncClient, ASGITransport

        msg = MagicMock()
        msg.id = uuid.uuid4()
        msg.content = "hello"
        msg.sender_id = sample_user_model.id
        msg.chat_id = uuid.uuid4()
        msg.sent_at = datetime.now(timezone.utc)

        with patch("messages.router.get_message_by_chatId", new_callable=AsyncMock, return_value=[msg]):
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
                resp = await ac.get(f"/api/v1/messages/{msg.chat_id}")
            assert resp.status_code == 200
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_no_messages_404(self, mock_session, sample_user_model):
        from httpx import AsyncClient, ASGITransport

        with patch("messages.router.get_message_by_chatId", new_callable=AsyncMock, return_value=[]):
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
                resp = await ac.get(f"/api/v1/messages/{uuid.uuid4()}")
            assert resp.status_code == 404
            app.dependency_overrides.clear()


class TestDeleteMessage:
    @pytest.mark.asyncio
    async def test_delete_success(self, mock_session, sample_user_model):
        from httpx import AsyncClient, ASGITransport

        mid = uuid.uuid4()
        with patch("messages.router.delete_messages_byID", new_callable=AsyncMock):
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
                resp = await ac.delete(f"/api/v1/messages/messages?message_id={mid}")
            assert resp.status_code == 200
            app.dependency_overrides.clear()


class TestEditMessage:
    @pytest.mark.asyncio
    async def test_edit_success(self, mock_session, sample_user_model):
        from httpx import AsyncClient, ASGITransport

        mid = uuid.uuid4()
        with patch("messages.router.edit_message_byID", new_callable=AsyncMock, return_value=True):
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
                resp = await ac.patch(
                    f"/api/v1/messages/messages/{mid}",
                    params={"content": "updated"},
                )
            assert resp.status_code == 200
            app.dependency_overrides.clear()


class TestReadMessage:
    @pytest.mark.asyncio
    async def test_read_success(self, mock_session, sample_user_model):
        from httpx import AsyncClient, ASGITransport

        mid = uuid.uuid4()
        with patch("messages.router.read_message_byID", new_callable=AsyncMock, return_value=True):
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
                resp = await ac.patch(f"/api/v1/messages/messages/{mid}/read")
            assert resp.status_code == 200
            app.dependency_overrides.clear()
