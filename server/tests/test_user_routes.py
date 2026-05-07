"""
Integration tests for server/users/routes.py
Tests: GET /users/me, PATCH /users/update, GET /users/contacts, GET /users/search

Routes are mounted at /users (no /api/v1 prefix).
"""
import pytest
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone, timedelta


class TestGetMe:
    @pytest.mark.asyncio
    async def test_returns_current_user(self, sample_user_model):
        from httpx import AsyncClient, ASGITransport
        from main import app
        from auth.dependencies import get_current_user

        async def override_user():
            return sample_user_model

        app.dependency_overrides[get_current_user] = override_user
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get("/api/v1/users/me")
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "testuser@example.com"
        app.dependency_overrides.clear()


class TestUpdateUser:
    @pytest.mark.asyncio
    async def test_update_username(self, mock_session, sample_user_model):
        from httpx import AsyncClient, ASGITransport
        from core.utils import access_token

        token = access_token(
            user_data={"email": sample_user_model.email, "id": str(sample_user_model.id), "username": sample_user_model.username},
            expire=timedelta(minutes=30),
        )

        updated = MagicMock()
        updated.id = sample_user_model.id
        updated.username = "newname"
        updated.email = sample_user_model.email
        updated.phone = sample_user_model.phone
        updated.first_name = sample_user_model.first_name
        updated.last_name = sample_user_model.last_name
        updated.is_verified = True
        updated.profile_url = None
        updated.created_at = datetime.now(timezone.utc)
        updated.updated_at = datetime.now(timezone.utc)

        with patch("users.router.update_user", new_callable=AsyncMock, return_value=updated), \
             patch("auth.dependencies.check_blacklist", new_callable=AsyncMock, return_value=False):
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
                    "/api/v1/users/update",
                    json={"username": "newname"},
                    headers={"Authorization": f"Bearer {token}"},
                )
            assert resp.status_code == 200
            app.dependency_overrides.clear()


class TestGetContacts:
    @pytest.mark.asyncio
    async def test_returns_contacts(self, mock_session, sample_user_model):
        from httpx import AsyncClient, ASGITransport
        from core.utils import access_token

        token = access_token(
            user_data={"email": sample_user_model.email, "id": str(sample_user_model.id), "username": sample_user_model.username},
            expire=timedelta(minutes=30),
        )

        contact = MagicMock()
        contact.id = uuid.uuid4()
        contact.username = "contact1"
        contact.first_name = "Contact"
        contact.last_name = "One"
        contact.profile_url = None
        contact.created_at = datetime.now(timezone.utc)

        with patch("users.router.get_contacts", new_callable=AsyncMock, return_value=[contact]), \
             patch("auth.dependencies.check_blacklist", new_callable=AsyncMock, return_value=False):
            from main import app
            from db.main import get_session

            async def override_session():
                yield mock_session

            app.dependency_overrides[get_session] = override_session

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                resp = await ac.get(
                    "/api/v1/users/contacts",
                    headers={"Authorization": f"Bearer {token}"},
                )
            assert resp.status_code == 200
            app.dependency_overrides.clear()


class TestSearchUser:
    @pytest.mark.asyncio
    async def test_search_returns_results(self, mock_session, sample_user_model):
        from httpx import AsyncClient, ASGITransport
        from core.utils import access_token

        token = access_token(
            user_data={"email": sample_user_model.email, "id": str(sample_user_model.id), "username": sample_user_model.username},
            expire=timedelta(minutes=30),
        )

        user = MagicMock()
        user.id = uuid.uuid4()
        user.username = "founduser"
        user.first_name = "Found"
        user.last_name = "User"
        user.profile_url = None
        user.created_at = datetime.now(timezone.utc)

        with patch("users.router.search_user", new_callable=AsyncMock, return_value=[user]), \
             patch("auth.dependencies.check_blacklist", new_callable=AsyncMock, return_value=False):
            from main import app
            from db.main import get_session

            async def override_session():
                yield mock_session

            app.dependency_overrides[get_session] = override_session

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                resp = await ac.get(
                    "/api/v1/users/search/found",
                    headers={"Authorization": f"Bearer {token}"},
                )
            assert resp.status_code == 200
            app.dependency_overrides.clear()
