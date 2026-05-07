"""
conftest.py — Shared fixtures for all tests.
Uses mocks/fakes for DB, Redis, and external services so tests run
without any infrastructure.
"""
import sys
import os
import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import fakeredis.aioredis

# ── Ensure the server package is importable ──────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# ── Patch heavy/env-dependent modules BEFORE they are imported ───────
# Patch config before anything reads .env
os.environ.setdefault("DB_URL", "sqlite+aiosqlite:///tests/test.db")
os.environ.setdefault("jwt_secret", "test-jwt-secret-key-12345")
os.environ.setdefault("jwt_algorithm", "HS256")
os.environ.setdefault("refresh_token_expiary", "7")
os.environ.setdefault("access_token_expiary", "30")
os.environ.setdefault("Redis_Url", "redis://localhost:6379/0")
os.environ.setdefault("MAIL_USERNAME", "test@test.com")
os.environ.setdefault("MAIL_PASSWORD", "testpass")
os.environ.setdefault("MAIL_FROM", "test@test.com")
os.environ.setdefault("MAIL_PORT", "587")
os.environ.setdefault("MAIL_SERVER", "smtp.test.com")
os.environ.setdefault("MAIL_FROM_NAME", "Test")
os.environ.setdefault("domain", "http://localhost:3000")
os.environ.setdefault("password_secrete_reset", "test-reset-secret")
os.environ.setdefault("profile_picture_path", "./test_media")
os.environ.setdefault("BCRYPT_ROUNDS", "4")  # Fast for tests


# ── Fake Redis ───────────────────────────────────────────────────────
@pytest.fixture
def fake_redis():
    """Return a fakeredis async client."""
    return fakeredis.aioredis.FakeRedis(decode_responses=True)


# ── Sample user data ─────────────────────────────────────────────────
@pytest.fixture
def sample_user_data():
    """A raw dict matching Create_User schema."""
    return {
        "username": "testuser",
        "email": "testuser@example.com",
        "phone": "+1234567890",
        "first_name": "Test",
        "last_name": "User",
        "password": "securepassword123",
        "profile_picture": None,
    }


@pytest.fixture
def sample_user_id():
    return uuid.uuid4()


@pytest.fixture
def sample_user_model(sample_user_id):
    """Mimics a db.models.User ORM object with attributes."""
    user = MagicMock()
    user.id = sample_user_id
    user.username = "testuser"
    user.email = "testuser@example.com"
    user.phone = "+1234567890"
    user.first_name = "Test"
    user.last_name = "User"
    user.profile_url = None
    user.password_hash = "$2b$04$fakehashedpassword"
    user.is_verified = True
    user.created_at = datetime.now(timezone.utc)
    user.updated_at = datetime.now(timezone.utc)
    return user


@pytest.fixture
def mock_session():
    """Mock AsyncSession for unit tests."""
    session = AsyncMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    session.add = MagicMock()
    session.rollback = AsyncMock()
    session.close = AsyncMock()
    session.flush = AsyncMock()
    return session


# ── Sample chat/message data ─────────────────────────────────────────
@pytest.fixture
def sample_chat_id():
    return uuid.uuid4()


@pytest.fixture
def sample_message_id():
    return uuid.uuid4()


@pytest.fixture
def sample_chat_model(sample_chat_id):
    """Mimics a db.models.Chat ORM object."""
    chat = MagicMock()
    chat.id = sample_chat_id
    chat.created_at = datetime.now(timezone.utc)
    chat.updated_at = datetime.now(timezone.utc)
    return chat


@pytest.fixture
def sample_message_model(sample_message_id, sample_chat_id, sample_user_id):
    """Mimics a db.models.Message ORM object."""
    msg = MagicMock()
    msg.id = sample_message_id
    msg.content = "Hello world"
    msg.sender_id = sample_user_id
    msg.chat_id = sample_chat_id
    msg.sent_at = datetime.now(timezone.utc)
    msg.updated_at = datetime.now(timezone.utc)
    msg.msg_type = "text"
    msg.status = "sent"
    msg.file_key = None
    msg.file_name = None
    msg.model_dump = MagicMock(return_value={
        "id": msg.id,
        "content": msg.content,
        "sender_id": msg.sender_id,
        "chat_id": msg.chat_id,
        "sent_at": msg.sent_at,
        "updated_at": msg.updated_at,
        "msg_type": msg.msg_type,
        "status": msg.status,
        "file_key": None,
        "file_name": None,
    })
    return msg


# ── JWT helpers ──────────────────────────────────────────────────────
@pytest.fixture
def make_access_token(sample_user_model):
    """Create a valid access token for the sample user."""
    def _make(user=None):
        from core.utils import access_token
        u = user or sample_user_model
        return access_token(
            user_data={
                "email": u.email,
                "id": str(u.id),
                "username": u.username,
            },
            expire=timedelta(minutes=30),
        )
    return _make


@pytest.fixture
def make_refresh_token(sample_user_model):
    """Create a valid refresh token for the sample user."""
    def _make(user=None):
        from core.utils import access_token
        u = user or sample_user_model
        return access_token(
            user_data={
                "email": u.email,
                "id": str(u.id),
                "username": u.username,
            },
            expire=timedelta(days=7),
            refresh=True,
        )
    return _make


# ── TestClient fixtures ──────────────────────────────────────────────
@pytest.fixture
def mock_get_session(mock_session):
    """Override get_session dependency to use mock_session."""
    async def _override():
        yield mock_session
    return _override


@pytest.fixture
def mock_get_current_user(sample_user_model):
    """Override get_current_user to return sample user without auth."""
    async def _override():
        return sample_user_model
    return _override


@pytest.fixture
def mock_access_token_bearer():
    """Override AccessTokenBearer to return a fake token dict."""
    async def _override():
        return {
            "user": {"email": "testuser@example.com", "id": str(uuid.uuid4()), "username": "testuser"},
            "jti": str(uuid.uuid4()),
            "refresh_token": False,
        }
    return _override


@pytest.fixture
def app_client(mock_get_session, mock_get_current_user, mock_access_token_bearer):
    """
    FastAPI TestClient with all external dependencies mocked.
    Uses httpx.AsyncClient for async testing.
    """
    from httpx import AsyncClient, ASGITransport
    from main import app
    from db.main import get_session
    from auth.dependencies import get_current_user, AccessTokenBearer

    app.dependency_overrides[get_session] = mock_get_session
    app.dependency_overrides[get_current_user] = mock_get_current_user
    app.dependency_overrides[AccessTokenBearer()] = mock_access_token_bearer

    async def _make_client():
        transport = ASGITransport(app=app)
        return AsyncClient(transport=transport, base_url="http://testserver")

    yield _make_client

    app.dependency_overrides.clear()


# ── Mock publisher/manager ───────────────────────────────────────────
@pytest.fixture
def mock_publisher():
    """Mock Publisher with async methods."""
    pub = AsyncMock()
    pub.publish_message = AsyncMock()
    pub.publish_typing = AsyncMock()
    pub.publish_read = AsyncMock()
    return pub


@pytest.fixture
def mock_manager():
    """Mock ConnectionManager with async methods."""
    mgr = AsyncMock()
    mgr.send_to_user = AsyncMock()
    mgr.deliver_to_chat = AsyncMock()
    mgr.register = AsyncMock()
    mgr.unregister = AsyncMock()
    mgr.refresh_presence = AsyncMock()
    mgr.connections = {}
    mgr.user_chats = {}
    mgr.chat_members = {}
    return mgr
