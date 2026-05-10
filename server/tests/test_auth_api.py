# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
═══════════════════════════════════════════════════════════════════════
  AUTH REST API TESTS
  Categories: Signup, Login, Logout, Token refresh, Password reset,
              Token security, Brute force, Input validation
═══════════════════════════════════════════════════════════════════════

Risk priority: HIGH — auth bugs = total app compromise.
Every test uses httpx.AsyncClient against a FastAPI TestClient
with DB/Redis/Celery fully mocked.
"""
import pytest
import uuid
import jwt
import time
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport


# ── Helpers ───────────────────────────────────────────────────────────

def _make_token(payload: dict, secret: str = "test-jwt-secret-key-12345", algorithm: str = "HS256"):
    """Create a real JWT with the given payload."""
    return jwt.encode(payload, secret, algorithm=algorithm)


def _valid_token_payload(email="test@test.com", user_id=None, refresh=False):
    return {
        "user": {"email": email, "id": str(user_id or uuid.uuid4()), "username": "testuser"},
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        "jti": str(uuid.uuid4()),
        "refresh_token": refresh,
        "iat": datetime.now(timezone.utc),
    }


def _expired_token_payload(email="test@test.com"):
    return {
        "user": {"email": email, "id": str(uuid.uuid4()), "username": "testuser"},
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),
        "jti": str(uuid.uuid4()),
        "refresh_token": False,
        "iat": datetime.now(timezone.utc) - timedelta(hours=2),
    }


# ── Fixtures ──────────────────────────────────────────────────────────

@pytest.fixture
def user_db():
    """A mock user as would come from DB."""
    u = MagicMock()
    u.id = uuid.uuid4()
    u.email = "test@test.com"
    u.username = "testuser"
    u.phone = "+1234567890"
    u.first_name = "Test"
    u.last_name = "User"
    u.password_hash = "$2b$04$somefakebcrypthash"
    u.is_verified = True
    u.profile_url = None
    u.bio = "Hey there! I am using Blurz."
    u.created_at = datetime.now(timezone.utc)
    u.updated_at = datetime.now(timezone.utc)
    return u


@pytest.fixture
async def client():
    """httpx AsyncClient against the real app, with DB and Celery mocked."""
    from main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac


# ═══════════════════════════════════════════════════════════════════════
#  1. SIGNUP
# ═══════════════════════════════════════════════════════════════════════

class TestSignup:
    """
    POST /auth/signup
    Schema: username, email, phone, first_name, last_name, password, profile_picture
    """

    ENDPOINT = "/api/v1/auth/signup"

    @pytest.mark.asyncio
    async def test_signup_success(self, client):
        """Valid signup should return 201."""
        with patch("auth.router.user_service.user_exist", new_callable=AsyncMock, return_value=False), \
             patch("auth.router.user_service.create_user", new_callable=AsyncMock) as mock_create, \
             patch("auth.router.bg_send_mail") as mock_mail:
            mock_user = MagicMock()
            mock_user.id = uuid.uuid4()
            mock_user.email = "new@test.com"
            mock_user.username = "newuser"
            mock_user.phone = "+9990001111"
            mock_user.first_name = "A"
            mock_user.last_name = "B"
            mock_user.is_verified = False
            mock_user.profile_url = None
            mock_user.bio = "Hey there! I am using Blurz."
            mock_user.created_at = None
            mock_user.updated_at = None
            mock_create.return_value = mock_user

            resp = await client.post(self.ENDPOINT, json={
                "username": "newuser",
                "email": "new@test.com",
                "phone": "+9990001111",
                "first_name": "A",
                "last_name": "B",
                "password": "strongpass123",
                "profile_picture": None,
            })
        assert resp.status_code == 201

    @pytest.mark.asyncio
    async def test_signup_missing_email(self, client):
        """Missing required field should return 422 Unprocessable Entity."""
        resp = await client.post(self.ENDPOINT, data={
            "username": "newuser",
            "phone": "+9990001111",
            "first_name": "A",
            "last_name": "B",
            "password": "strongpass123",
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_signup_password_too_short(self, client):
        """Password < 8 chars should be rejected by Pydantic."""
        resp = await client.post(self.ENDPOINT, data={
            "username": "newuser",
            "email": "new@test.com",
            "phone": "+9990001111",
            "first_name": "A",
            "last_name": "B",
            "password": "short",
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_signup_password_too_long(self, client):
        """Password > 72 chars should be rejected."""
        resp = await client.post(self.ENDPOINT, data={
            "username": "newuser",
            "email": "new@test.com",
            "phone": "+9990001111",
            "first_name": "A",
            "last_name": "B",
            "password": "a" * 73,
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_signup_username_too_long(self, client):
        """Username > 20 chars should fail validation."""
        resp = await client.post(self.ENDPOINT, data={
            "username": "a" * 21,
            "email": "new@test.com",
            "phone": "+9990001111",
            "first_name": "A",
            "last_name": "B",
            "password": "strongpass123",
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_signup_empty_username(self, client):
        """Empty string username should fail."""
        resp = await client.post(self.ENDPOINT, data={
            "username": "",
            "email": "new@test.com",
            "phone": "+9990001111",
            "first_name": "A",
            "last_name": "B",
            "password": "strongpass123",
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_signup_whitespace_only_email(self, client):
        """Whitespace-only email should fail validation."""
        resp = await client.post(self.ENDPOINT, data={
            "username": "newuser",
            "email": "   ",
            "phone": "+9990001111",
            "first_name": "A",
            "last_name": "B",
            "password": "strongpass123",
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_signup_invalid_email_format(self, client):
        """Not-an-email should fail."""
        resp = await client.post(self.ENDPOINT, data={
            "username": "newuser",
            "email": "not-an-email",
            "phone": "+9990001111",
            "first_name": "A",
            "last_name": "B",
            "password": "strongpass123",
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_signup_sql_injection_in_email(self, client):
        """SQL injection should be safely handled (not crash)."""
        resp = await client.post(self.ENDPOINT, data={
            "username": "newuser",
            "email": "'; DROP TABLE user; --",
            "phone": "+9990001111",
            "first_name": "A",
            "last_name": "B",
            "password": "strongpass123",
        })
        # Should fail validation, not crash
        assert resp.status_code in (400, 422)

    @pytest.mark.asyncio
    async def test_signup_duplicate_user(self, client, user_db):
        """Signing up with existing email should return 403."""
        mock_session = AsyncMock()
        async def _override():
            yield mock_session
        from main import app
        from db.main import get_session
        app.dependency_overrides[get_session] = _override
        try:
            with patch("auth.router.user_service.user_exist", new_callable=AsyncMock, return_value=True):
                resp = await client.post(self.ENDPOINT, json={
                    "username": "newuser",
                    "email": user_db.email,
                    "phone": "+9990001111",
                    "first_name": "A",
                    "last_name": "B",
                    "password": "strongpass123",
                    "profile_picture": None,
                })
            assert resp.status_code == 403
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_signup_extra_fields_ignored(self, client):
        """Extra unexpected fields in body should be ignored, not cause error."""
        with patch("auth.router.user_service.user_exist", new_callable=AsyncMock, return_value=False), \
             patch("auth.router.user_service.create_user", new_callable=AsyncMock) as mock_create, \
             patch("auth.router.bg_send_mail") as mock_mail:
            mock_user = MagicMock()
            mock_user.id = uuid.uuid4()
            mock_user.email = "new@test.com"
            mock_create.return_value = mock_user

            resp = await client.post(self.ENDPOINT, data={
                "username": "newuser",
                "email": "new@test.com",
                "phone": "+9990001111",
                "first_name": "A",
                "last_name": "B",
                "password": "strongpass123",
                "role": "admin",  # extra field
                "is_verified": "true",  # extra field
            })
        # Should not crash — extra fields ignored by Pydantic
        assert resp.status_code in (201, 422)


# ═══════════════════════════════════════════════════════════════════════
#  2. LOGIN
# ═══════════════════════════════════════════════════════════════════════

class TestLogin:
    """POST /auth/login"""

    ENDPOINT = "/api/v1/auth/login"

    @pytest.mark.asyncio
    async def test_login_success(self, client, user_db):
        """Valid credentials should return 200 with access+refresh tokens."""
        with patch("auth.router.user_service.get_user_by_email", new_callable=AsyncMock, return_value=user_db), \
             patch("auth.router.verify_password", return_value=True):
            resp = await client.post(self.ENDPOINT, json={
                "email": user_db.email,
                "password": "correctpassword1",
            })
        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        assert "refresh_token" in body
        assert body["email"] == user_db.email

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client, user_db):
        """Wrong password should return 400."""
        with patch("auth.router.user_service.get_user_by_email", new_callable=AsyncMock, return_value=user_db), \
             patch("auth.router.verify_password", return_value=False):
            resp = await client.post(self.ENDPOINT, json={
                "email": user_db.email,
                "password": "wrongpassword1",
            })
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client):
        """Non-existent email should return 404."""
        with patch("auth.router.user_service.get_user_by_email", new_callable=AsyncMock, return_value=None), \
             patch("auth.router.user_service.get_user_by_phone", new_callable=AsyncMock, return_value=None):
            resp = await client.post(self.ENDPOINT, json={
                "email": "nobody@test.com",
                "password": "anypassword1",
            })
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_login_missing_password(self, client):
        """Missing password should return 422."""
        resp = await client.post(self.ENDPOINT, json={"email": "test@test.com"})
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_login_empty_email(self, client):
        """Empty email string should fail."""
        mock_session = AsyncMock()
        async def _override():
            yield mock_session
        from main import app
        from db.main import get_session
        app.dependency_overrides[get_session] = _override
        try:
            with patch("auth.router.user_service.get_user_by_email", new_callable=AsyncMock, return_value=None), \
                 patch("auth.router.user_service.get_user_by_phone", new_callable=AsyncMock, return_value=None):
                resp = await client.post(self.ENDPOINT, json={
                    "email": "",
                    "password": "somepassword1",
                })
            assert resp.status_code in (400, 404, 422)
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_login_sql_injection_in_email(self, client):
        """SQL injection in email field."""
        with patch("auth.router.user_service.get_user_by_email", new_callable=AsyncMock, return_value=None), \
             patch("auth.router.user_service.get_user_by_phone", new_callable=AsyncMock, return_value=None):
            resp = await client.post(self.ENDPOINT, json={
                "email": "' OR 1=1; --",
                "password": "anypassword1",
            })
        # Should not crash. 404 or 422, never 500
        assert resp.status_code in (400, 404, 422)

    @pytest.mark.asyncio
    async def test_login_extremely_long_password(self, client):
        """10,000+ char password should be rejected by Pydantic (max_length=72)."""
        resp = await client.post(self.ENDPOINT, json={
            "email": "test@test.com",
            "password": "a" * 10_000,
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_login_wrong_http_method(self, client):
        """GET on a POST-only endpoint should return 405."""
        resp = await client.get(self.ENDPOINT)
        assert resp.status_code == 405

    @pytest.mark.asyncio
    async def test_login_null_fields(self, client):
        """Null values should fail validation."""
        resp = await client.post(self.ENDPOINT, json={
            "email": None,
            "password": None,
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_login_int_instead_of_string(self, client):
        """Integer where string expected should fail."""
        resp = await client.post(self.ENDPOINT, json={
            "email": 12345,
            "password": 12345,
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_login_extra_unexpected_fields(self, client, user_db):
        """Extra fields should be ignored, not cause crash."""
        with patch("auth.router.user_service.get_user_by_email", new_callable=AsyncMock, return_value=user_db), \
             patch("auth.router.verify_password", return_value=True):
            resp = await client.post(self.ENDPOINT, json={
                "email": user_db.email,
                "password": "correctpassword1",
                "role": "admin",
                "hack": True,
            })
        assert resp.status_code == 200


# ═══════════════════════════════════════════════════════════════════════
#  3. TOKEN SECURITY
# ═══════════════════════════════════════════════════════════════════════

class TestTokenSecurity:
    """Token validation, tampering, expiry, type confusion."""

    @pytest.mark.asyncio
    async def test_protected_route_no_token(self, client):
        """Accessing /users/me without token should return 403."""
        resp = await client.get("/api/v1/users/me")
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_protected_route_random_string_token(self, client):
        """Random string as token should return 401."""
        resp = await client.get("/api/v1/users/me", headers={
            "Authorization": "Bearer totally-not-a-jwt"
        })
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_protected_route_expired_token(self, client):
        """Expired JWT should return 401."""
        token = _make_token(_expired_token_payload())
        resp = await client.get("/api/v1/users/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_tampered_token_wrong_signature(self, client):
        """Token signed with wrong key should return 401."""
        payload = _valid_token_payload()
        token = _make_token(payload, secret="WRONG-SECRET-KEY")
        resp = await client.get("/api/v1/users/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_tampered_token_modified_payload(self, client):
        """Modify payload without re-signing — should be rejected."""
        token = _make_token(_valid_token_payload())
        # Tamper: change the middle part (payload)
        parts = token.split(".")
        parts[1] = parts[1][::-1]  # reverse payload
        tampered = ".".join(parts)
        resp = await client.get("/api/v1/users/me", headers={
            "Authorization": f"Bearer {tampered}"
        })
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_refresh_token_as_access_token(self, client):
        """Using a refresh token where access token is expected should return 401."""
        token = _make_token(_valid_token_payload(refresh=True))
        with patch("auth.dependencies.check_blacklist", new_callable=AsyncMock, return_value=False):
            resp = await client.get("/api/v1/users/me", headers={
                "Authorization": f"Bearer {token}"
            })
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_revoked_token_rejected(self, client):
        """Token on the blacklist should be rejected."""
        token = _make_token(_valid_token_payload())
        with patch("auth.dependencies.check_blacklist", new_callable=AsyncMock, return_value=True):
            resp = await client.get("/api/v1/users/me", headers={
                "Authorization": f"Bearer {token}"
            })
        assert resp.status_code == 403


# ═══════════════════════════════════════════════════════════════════════
#  4. LOGOUT
# ═══════════════════════════════════════════════════════════════════════

class TestLogout:
    """POST /auth/logout"""

    @pytest.mark.asyncio
    async def test_logout_success(self, client):
        """Valid token logout should return 200."""
        token = _make_token(_valid_token_payload())
        with patch("auth.dependencies.check_blacklist", new_callable=AsyncMock, return_value=False), \
             patch("auth.router.add_to_blacklist", new_callable=AsyncMock, return_value=True):
            resp = await client.post("/api/v1/auth/logout", headers={
                "Authorization": f"Bearer {token}"
            })
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_logout_without_token(self, client):
        """Logout without token should return 403."""
        resp = await client.post("/api/v1/auth/logout")
        assert resp.status_code == 403


# ═══════════════════════════════════════════════════════════════════════
#  5. TOKEN REFRESH
# ═══════════════════════════════════════════════════════════════════════

class TestTokenRefresh:
    """POST /auth/refresh_token"""

    @pytest.mark.asyncio
    async def test_refresh_with_access_token_rejected(self, client):
        """Using access token for refresh should return 403."""
        token = _make_token(_valid_token_payload(refresh=False))
        with patch("auth.dependencies.check_blacklist", new_callable=AsyncMock, return_value=False):
            resp = await client.post("/api/v1/auth/refresh_token", headers={
                "Authorization": f"Bearer {token}"
            })
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_refresh_success(self, client):
        """Valid refresh token should return new access token."""
        token = _make_token(_valid_token_payload(refresh=True))
        with patch("auth.dependencies.check_blacklist", new_callable=AsyncMock, return_value=False):
            resp = await client.post("/api/v1/auth/refresh_token", headers={
                "Authorization": f"Bearer {token}"
            })
        assert resp.status_code == 200
        assert "access_token" in resp.json()


# ═══════════════════════════════════════════════════════════════════════
#  6. PASSWORD RESET
# ═══════════════════════════════════════════════════════════════════════

class TestPasswordReset:
    """POST /auth/password_reset, POST /auth/confirm_password/{token}"""

    @pytest.mark.asyncio
    async def test_password_reset_nonexistent_email(self, client):
        """Reset for non-existent email should return 404."""
        with patch("auth.router.user_service.get_user_by_email", new_callable=AsyncMock, return_value=None):
            resp = await client.post("/api/v1/auth/password_reset", json={"email": "nobody@test.com"})
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_password_reset_empty_email(self, client):
        """Empty email should fail validation."""
        mock_session = AsyncMock()
        async def _override():
            yield mock_session
        from main import app
        from db.main import get_session
        app.dependency_overrides[get_session] = _override
        try:
            with patch("auth.router.user_service.get_user_by_email", new_callable=AsyncMock, return_value=None):
                resp = await client.post("/api/v1/auth/password_reset", json={"email": ""})
            assert resp.status_code in (404, 422)
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_confirm_password_mismatch(self, client, user_db):
        """Non-matching passwords should return 400."""
        from core.utils import CreationSafeLink
        link = CreationSafeLink("test-reset-secret", "password_reset_link")
        token = link.create_safe_url({"email": user_db.email})

        with patch("auth.router.check_blacklist", new_callable=AsyncMock, return_value=False), \
             patch("auth.router.user_service.get_user_by_email", new_callable=AsyncMock, return_value=user_db):
            resp = await client.post(f"/api/v1/auth/confirm_password/{token}", json={
                "new_password": "newpassword123",
                "confirm_password": "differentpass123",
            })
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_confirm_password_reused_link(self, client, user_db):
        """Re-using a reset link should return 400 (PasswordAlreadyReset)."""
        from core.utils import CreationSafeLink
        link = CreationSafeLink("test-reset-secret", "password_reset_link")
        token = link.create_safe_url({"email": user_db.email})

        with patch("auth.router.check_blacklist", new_callable=AsyncMock, return_value=True):
            resp = await client.post(f"/api/v1/auth/confirm_password/{token}", json={
                "new_password": "newpassword123",
                "confirm_password": "newpassword123",
            })
        assert resp.status_code == 400


# ═══════════════════════════════════════════════════════════════════════
#  7. CHANGE PASSWORD (authenticated)
# ═══════════════════════════════════════════════════════════════════════

class TestChangePassword:
    """POST /auth/change_password"""

    @pytest.mark.asyncio
    async def test_change_password_wrong_current(self, client, user_db):
        """Wrong current password should return 400."""
        token = _make_token(_valid_token_payload(email=user_db.email))
        mock_session = AsyncMock()
        async def _override_session():
            yield mock_session
        async def _override_user():
            return user_db
        from main import app
        from db.main import get_session
        from auth.dependencies import get_current_user
        app.dependency_overrides[get_session] = _override_session
        app.dependency_overrides[get_current_user] = _override_user
        try:
            with patch("auth.dependencies.check_blacklist", new_callable=AsyncMock, return_value=False), \
                 patch("auth.router.user_service.get_user_by_email", new_callable=AsyncMock, return_value=user_db), \
                 patch("auth.router.verify_password", return_value=False):
                resp = await client.post("/api/v1/auth/change_password",
                    json={
                        "current_password": "wrongcurrent1",
                        "new_password": "newpassword123",
                    },
                    headers={"Authorization": f"Bearer {token}"},
                )
            assert resp.status_code == 400
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_change_password_no_auth(self, client):
        """Change password without token should return 403."""
        resp = await client.post("/api/v1/auth/change_password", json={
            "current_password": "current123456",
            "new_password": "newpassword123",
        })
        assert resp.status_code == 403


# ═══════════════════════════════════════════════════════════════════════
#  8. BRUTE FORCE
# ═══════════════════════════════════════════════════════════════════════

class TestBruteForce:
    """Rapid-fire login attempts."""

    @pytest.mark.asyncio
    async def test_100_rapid_login_attempts(self, client, user_db):
        """
        100 login attempts with wrong password should all fail gracefully.
        No 500 errors, no crashes, no resource exhaustion.
        """
        with patch("auth.router.user_service.get_user_by_email", new_callable=AsyncMock, return_value=user_db), \
             patch("auth.router.verify_password", return_value=False):

            results = []
            for _ in range(100):
                resp = await client.post("/api/v1/auth/login", json={
                    "email": user_db.email,
                    "password": "wrongpassword1",
                })
                results.append(resp.status_code)

        # All should be 400 (invalid credentials), never 500
        assert all(code == 400 for code in results)
        assert len(results) == 100
