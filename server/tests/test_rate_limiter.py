"""
Unit tests for server/websocket/rate_limiter.py
Tests: RateLimiter — sliding window, burst rejection, cleanup, multi-user isolation
"""
import pytest
import uuid
from time import monotonic
from unittest.mock import patch


class TestRateLimiter:
    def test_allows_under_limit(self):
        from websocket.rate_limiter import RateLimiter
        limiter = RateLimiter(max_messages=5, window_seconds=10.0)
        uid = uuid.uuid4()
        for _ in range(5):
            assert limiter.allow(uid) is True

    def test_rejects_over_limit(self):
        from websocket.rate_limiter import RateLimiter
        limiter = RateLimiter(max_messages=3, window_seconds=10.0)
        uid = uuid.uuid4()
        for _ in range(3):
            limiter.allow(uid)
        assert limiter.allow(uid) is False

    def test_window_expiry_resets(self):
        from websocket.rate_limiter import RateLimiter
        limiter = RateLimiter(max_messages=2, window_seconds=0.1)
        uid = uuid.uuid4()
        limiter.allow(uid)
        limiter.allow(uid)
        assert limiter.allow(uid) is False

        import time
        time.sleep(0.15)
        assert limiter.allow(uid) is True

    def test_multi_user_isolation(self):
        from websocket.rate_limiter import RateLimiter
        limiter = RateLimiter(max_messages=2, window_seconds=10.0)
        u1, u2 = uuid.uuid4(), uuid.uuid4()

        limiter.allow(u1)
        limiter.allow(u1)
        assert limiter.allow(u1) is False
        # u2 should still be allowed
        assert limiter.allow(u2) is True

    def test_cleanup_removes_user(self):
        from websocket.rate_limiter import RateLimiter
        limiter = RateLimiter()
        uid = uuid.uuid4()
        limiter.allow(uid)
        assert uid in limiter._windows
        limiter.cleanup(uid)
        assert uid not in limiter._windows

    def test_cleanup_nonexistent_user(self):
        from websocket.rate_limiter import RateLimiter
        limiter = RateLimiter()
        limiter.cleanup(uuid.uuid4())  # should not raise
