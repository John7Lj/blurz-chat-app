# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Integration tests for server/auth/routes.py
Uses FastAPI TestClient with mocked DB/Redis/Celery.
"""
import pytest
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone


class TestSignup:
    @pytest.mark.asyncio
    async def test_signup_success(self, mock_session, sample_user_model):
        from httpx import AsyncClient, ASGITransport

        new_user = sample_user_model
        new_user.is_verified = False

        with patch("auth.router.user_service") as svc, \
             patch("auth.router.email_verification_link") as evl, \
             patch("auth.router.bg_send_mail") as bsm, \
             patch("auth.router.bg_save_profile_picture") as bspp:
            svc.user_exist = AsyncMock(return_value=None)
            svc.create_user = AsyncMock(return_value=new_user)
            evl.create_safe_url = MagicMock(return_value="test-token")

            from main import app
            from db.main import get_session

            async def override():
                yield mock_session
            app.dependency_overrides[get_session] = override

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                resp = await ac.post("/api/v1/auth/signup", json={
                    "username": "newuser", "email": "new@test.com",
                    "phone": "+9999999999", "first_name": "New",
                    "last_name": "User", "password": "strongpass123",
                    "profile_picture": None,
                })
            assert resp.status_code == 201
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_signup_duplicate_user(self, mock_session, sample_user_model):
        from httpx import AsyncClient, ASGITransport

        with patch("auth.router.user_service") as svc:
            svc.user_exist = AsyncMock(return_value=sample_user_model)

            from main import app
            from db.main import get_session

            async def override():
                yield mock_session
            app.dependency_overrides[get_session] = override

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                resp = await ac.post("/api/v1/auth/signup", json={
                    "username": "testuser", "email": "testuser@example.com",
                    "phone": "+1234567890", "first_name": "Test",
                    "last_name": "User", "password": "strongpass123",
                    "profile_picture": None,
                })
            assert resp.status_code == 403
            app.dependency_overrides.clear()


class TestLogin:
    @pytest.mark.asyncio
    async def test_login_success(self, mock_session, sample_user_model):
        from httpx import AsyncClient, ASGITransport
        from core.utils import generate_hashed_password

        sample_user_model.password_hash = generate_hashed_password("correctpass")

        with patch("auth.router.user_service") as svc:
            svc.get_user_by_email = AsyncMock(return_value=sample_user_model)

            from main import app
            from db.main import get_session

            async def override():
                yield mock_session
            app.dependency_overrides[get_session] = override

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                resp = await ac.post("/api/v1/auth/login", json={
                    "email": "testuser@example.com",
                    "password": "correctpass",
                })
            data = resp.json()
            assert resp.status_code == 200
            assert "access_token" in data
            assert "refresh_token" in data
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, mock_session, sample_user_model):
        from httpx import AsyncClient, ASGITransport
        from core.utils import generate_hashed_password

        sample_user_model.password_hash = generate_hashed_password("correctpass")

        with patch("auth.router.user_service") as svc:
            svc.get_user_by_email = AsyncMock(return_value=sample_user_model)

            from main import app
            from db.main import get_session

            async def override():
                yield mock_session
            app.dependency_overrides[get_session] = override

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                resp = await ac.post("/api/v1/auth/login", json={
                    "email": "testuser@example.com",
                    "password": "wrongpassword",
                })
            assert resp.status_code == 400
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_login_user_not_found(self, mock_session):
        from httpx import AsyncClient, ASGITransport

        with patch("auth.router.user_service") as svc:
            svc.get_user_by_email = AsyncMock(return_value=None)
            svc.get_user_by_phone = AsyncMock(return_value=None)

            from main import app
            from db.main import get_session

            async def override():
                yield mock_session
            app.dependency_overrides[get_session] = override

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                resp = await ac.post("/api/v1/auth/login", json={
                    "email": "nobody@test.com",
                    "password": "anypassword",
                })
            assert resp.status_code == 404
            app.dependency_overrides.clear()


class TestLogout:
    @pytest.mark.asyncio
    async def test_logout_success(self, mock_session, sample_user_model):
        from httpx import AsyncClient, ASGITransport
        from core.utils import access_token
        from datetime import timedelta

        token = access_token(
            user_data={"email": sample_user_model.email, "id": str(sample_user_model.id), "username": sample_user_model.username},
            expire=timedelta(minutes=30),
        )

        with patch("auth.router.add_to_blacklist", new_callable=AsyncMock, return_value=True), \
             patch("auth.dependencies.check_blacklist", new_callable=AsyncMock, return_value=False):
            from main import app
            app.dependency_overrides.clear()

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                resp = await ac.post("/api/v1/auth/logout", headers={
                    "Authorization": f"Bearer {token}"
                })
            assert resp.status_code == 200


class TestRefreshToken:
    @pytest.mark.asyncio
    async def test_refresh_returns_new_access(self, sample_user_model):
        from httpx import AsyncClient, ASGITransport
        from core.utils import access_token
        from datetime import timedelta

        refresh = access_token(
            user_data={"email": sample_user_model.email, "id": str(sample_user_model.id), "username": sample_user_model.username},
            expire=timedelta(days=7), refresh=True,
        )

        with patch("auth.dependencies.check_blacklist", new_callable=AsyncMock, return_value=False):
            from main import app
            app.dependency_overrides.clear()

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                resp = await ac.post("/api/v1/auth/refresh_token", headers={
                    "Authorization": f"Bearer {refresh}"
                })
            assert resp.status_code == 200
            assert "access_token" in resp.json()

