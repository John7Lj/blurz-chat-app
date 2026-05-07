"""
WebSocket Rate Limiter

Pure-asyncio sliding-window rate limiter.
No extra dependencies — uses only the standard library.

Usage:
    limiter = RateLimiter(max_messages=50, window_seconds=10)

    # Inside the message loop:
    if not limiter.allow(user_id):
        await ws.send_json({"type": "error", "detail": "Too many requests"})
        continue
"""
import uuid
from collections import deque
from time import monotonic


class RateLimiter:
    """
    Per-user sliding-window rate limiter.

    Keeps a deque of timestamps for each user_id.
    On each call to allow(), it purges timestamps older than
    `window_seconds` and then checks whether the user is under
    the `max_messages` cap.

    Thread-safety: asyncio is single-threaded, so no lock is needed.
    Memory: the deque is bounded to max_messages entries per user,
    so worst-case memory is O(connected_users × max_messages).
    """

    def __init__(self, max_messages: int = 50, window_seconds: float = 10.0):
        self.max_messages = max_messages
        self.window_seconds = window_seconds
        # user_id → deque of monotonic timestamps
        self._windows: dict[uuid.UUID, deque] = {}

    def allow(self, user_id: uuid.UUID) -> bool:
        """
        Return True if the user is within the rate limit, False otherwise.
        Call this once per incoming message.
        """
        now = monotonic()
        cutoff = now - self.window_seconds

        if user_id not in self._windows:
            self._windows[user_id] = deque()

        window = self._windows[user_id]

        # Purge expired timestamps from the left
        while window and window[0] < cutoff:
            window.popleft()

        if len(window) >= self.max_messages:
            return False  # over limit

        window.append(now)
        return True

    def cleanup(self, user_id: uuid.UUID):
        """Remove tracking state for a disconnected user."""
        self._windows.pop(user_id, None)