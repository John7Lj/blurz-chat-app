"""
WebSocket Route
Single endpoint: ws://host/ws?token=<JWT>

Key design decisions:
- subscribe/unsubscribe is called directly on app.state.subscriber
  from the route, not buried inside ConnectionManager.
- ConnectionManager.unregister() returns orphaned chat_ids so the
  route knows exactly what to unsubscribe from Redis.
- DB sessions are short-lived: one for auth, one per message.
  No session is held open during the WebSocket lifetime.
"""
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from core.utils import decode_token
from auth.service import User_Service
from db.main import get_session_ctx
from chats.service import get_user_chat_ids
from .handlers import handle_incoming
from .rate_limiter import RateLimiter

logger = logging.getLogger(__name__)

ws_router = APIRouter()


@ws_router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
):
    """
    Main WebSocket endpoint.

    Flow:
    1.  Validate JWT
    2.  Load user from DB (short-lived session)
    3.  Fetch user's chat_ids from DB
    4.  Close DB session — no connection held during WS lifetime
    5.  Accept WebSocket
    6.  Register in ConnectionManager (no DB calls inside manager)
    7.  Subscribe to Redis channels
    8.  Enter message loop (each message gets its own DB session)
    9.  On disconnect → unregister → unsubscribe orphaned channels
    """

    # ── 1. Auth ───────────────────────────────────────────────────────────
    token_data = decode_token(token)
    if not token_data:
        await websocket.close(code=4001, reason="Invalid token")
        return

    email = token_data.get("user", {}).get("email")
    if not email:
        await websocket.close(code=4001, reason="Invalid token payload")
        return

    # ── 2 & 3. Load user + chat_ids — then CLOSE the session ─────────────
    # Using get_session_ctx() (context manager) instead of get_session()
    # (async generator) so the session is deterministically closed here,
    # not held open for the entire WebSocket lifetime.
    async with get_session_ctx() as session:
        user = await User_Service().get_user_by_email(email, session)
        if not user:
            await websocket.close(code=4001, reason="User not found")
            return

        if not user.is_verified:
            await websocket.close(code=4003, reason="Account not verified")
            return

        # DB validates membership — manager receives already-trusted list
        chat_ids = await get_user_chat_ids(session=session, user_id=user.id)
    # ← session is CLOSED here — no DB connection held during WS lifetime

    # ── 4. Accept connection ──────────────────────────────────────────────
    await websocket.accept()

    # Grab shared global instances
    manager    = websocket.app.state.manager
    publisher  = websocket.app.state.publisher
    subscriber = websocket.app.state.subscriber

    # ── 5. Register in manager (pure in-memory, no Redis pub/sub) ─────────
    await manager.register(
        user_id=user.id,
        websocket=websocket,
        chat_ids=chat_ids,
    )

    # ── 6. Subscribe to Redis channels directly ───────────────────────────
    # Route owns the subscribe/unsubscribe lifecycle, not the manager.
    # This makes the flow explicit and easy to follow.
    await subscriber.subscribe(chat_ids)

    await websocket.send_json({
        "type": "connected",
        "user_id": str(user.id),
    })

    logger.info(f"WebSocket connected: {user.username} ({user.id})")

    # ── 7. Message loop ───────────────────────────────────────────────────
    # Rate limiter: 50 messages per 10 seconds per user
    rate_limiter = RateLimiter(max_messages=50, window_seconds=10)

    try:
        while True:
            data = await websocket.receive_json()

            # Check rate limit before processing
            if not rate_limiter.allow(user.id):
                await websocket.send_json({
                    "type": "error",
                    "detail": "Rate limited — slow down",
                })
                continue

            # Each message gets its own short-lived DB session
            # Using context manager ensures deterministic cleanup
            async with get_session_ctx() as msg_session:
                await handle_incoming(
                    data=data,
                    user=user,
                    session=msg_session,
                    publisher=publisher,
                    manager=manager,
                )

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {user.username}")
    except Exception as e:
        logger.error(f"WebSocket error for {user.username}: {e}")
    finally:
        # ── 8. Cleanup ────────────────────────────────────────────────────
        # unregister() returns chat_ids that have NO remaining local users
        orphaned_channels = await manager.unregister(user.id)
        rate_limiter.cleanup(user.id)

        # Only unsubscribe channels nobody else needs locally
        if orphaned_channels:
            await subscriber.unsubscribe(orphaned_channels)

        logger.info(f"Cleanup complete for {user.username}")