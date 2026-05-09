# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Unit tests for server/websocket/routes.py
Tests: WebSocket authentication flow and route lifecycle

Note: The route uses decode_token (not _authenticate), get_session_ctx,
      and wires rate limiter + subscriber directly.
"""
import pytest
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone, timedelta


class TestWsRouteAuth:
    """Test the authentication logic at the top of websocket_endpoint."""

    @pytest.mark.asyncio
    async def test_invalid_token_closes_connection(self):
        """Invalid JWT should close the WS with 4001."""
        ws = AsyncMock()
        ws.app = MagicMock()

        with patch("websocket.router.decode_token", return_value=None):
            from websocket.router import websocket_endpoint
            await websocket_endpoint(ws, token="invalid.token")

        ws.close.assert_called_once()
        assert ws.close.call_args[1]["code"] == 4001

    @pytest.mark.asyncio
    async def test_missing_email_closes_connection(self):
        """Token with no email in payload should close with 4001."""
        ws = AsyncMock()
        ws.app = MagicMock()

        with patch("websocket.router.decode_token", return_value={"user": {}}):
            from websocket.router import websocket_endpoint
            await websocket_endpoint(ws, token="some.token")

        ws.close.assert_called_once()
        assert ws.close.call_args[1]["code"] == 4001

    @pytest.mark.asyncio
    async def test_user_not_found_closes_connection(self):
        """Valid token but user not in DB should close with 4001."""
        ws = AsyncMock()
        ws.app = MagicMock()

        mock_session = AsyncMock()

        with patch("websocket.router.decode_token", return_value={"user": {"email": "test@test.com"}}), \
             patch("websocket.router.get_session_ctx") as mock_ctx, \
             patch("websocket.router.User_Service") as MockUserService:

            mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
            mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)
            MockUserService.return_value.get_user_by_email = AsyncMock(return_value=None)

            from websocket.router import websocket_endpoint
            await websocket_endpoint(ws, token="valid.token")

        ws.close.assert_called_once()
        assert ws.close.call_args[1]["code"] == 4001

    @pytest.mark.asyncio
    async def test_unverified_user_closes_connection(self):
        """Unverified user should close with 4003."""
        ws = AsyncMock()
        ws.app = MagicMock()

        user = MagicMock()
        user.is_verified = False

        mock_session = AsyncMock()

        with patch("websocket.router.decode_token", return_value={"user": {"email": "test@test.com"}}), \
             patch("websocket.router.get_session_ctx") as mock_ctx, \
             patch("websocket.router.User_Service") as MockUserService:

            mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
            mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)
            MockUserService.return_value.get_user_by_email = AsyncMock(return_value=user)

            from websocket.router import websocket_endpoint
            await websocket_endpoint(ws, token="valid.token")

        ws.close.assert_called_once()
        assert ws.close.call_args[1]["code"] == 4003


class TestWsRouteLifecycle:
    """Test the full WebSocket connection lifecycle."""

    def _setup_mocks(self):
        """Create a full set of mocks for a successful connection."""
        user = MagicMock()
        user.id = uuid.uuid4()
        user.username = "testuser"
        user.is_verified = True

        ws = AsyncMock()
        ws.app = MagicMock()
        ws.app.state.manager = AsyncMock()
        ws.app.state.manager.register = AsyncMock()
        ws.app.state.manager.unregister = AsyncMock(return_value=[])
        ws.app.state.publisher = AsyncMock()
        ws.app.state.subscriber = AsyncMock()
        ws.app.state.subscriber.subscribe = AsyncMock()
        ws.app.state.subscriber.unsubscribe = AsyncMock()

        mock_session = AsyncMock()
        chat_ids = [uuid.uuid4()]

        return user, ws, mock_session, chat_ids

    @pytest.mark.asyncio
    async def test_successful_connection_sends_connected(self):
        """Valid auth should accept WS and send connected message."""
        user, ws, mock_session, chat_ids = self._setup_mocks()

        # Make receive_json raise disconnect immediately
        from fastapi import WebSocketDisconnect
        ws.receive_json = AsyncMock(side_effect=WebSocketDisconnect())

        with patch("websocket.router.decode_token", return_value={"user": {"email": "test@test.com"}}), \
             patch("websocket.router.get_session_ctx") as mock_ctx, \
             patch("websocket.router.User_Service") as MockUserService, \
             patch("websocket.router.get_user_chat_ids", new_callable=AsyncMock, return_value=chat_ids):

            mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
            mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)
            MockUserService.return_value.get_user_by_email = AsyncMock(return_value=user)

            from websocket.router import websocket_endpoint
            await websocket_endpoint(ws, token="valid.token")

        ws.accept.assert_called_once()
        ws.send_json.assert_called()
        connected_msg = ws.send_json.call_args[0][0]
        assert connected_msg["type"] == "connected"

    @pytest.mark.asyncio
    async def test_cleanup_on_disconnect(self):
        """On disconnect, manager.unregister and subscriber.unsubscribe should be called."""
        user, ws, mock_session, chat_ids = self._setup_mocks()

        orphaned = [uuid.uuid4()]
        ws.app.state.manager.unregister = AsyncMock(return_value=orphaned)

        from fastapi import WebSocketDisconnect
        ws.receive_json = AsyncMock(side_effect=WebSocketDisconnect())

        with patch("websocket.router.decode_token", return_value={"user": {"email": "test@test.com"}}), \
             patch("websocket.router.get_session_ctx") as mock_ctx, \
             patch("websocket.router.User_Service") as MockUserService, \
             patch("websocket.router.get_user_chat_ids", new_callable=AsyncMock, return_value=chat_ids):

            mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
            mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)
            MockUserService.return_value.get_user_by_email = AsyncMock(return_value=user)

            from websocket.router import websocket_endpoint
            await websocket_endpoint(ws, token="valid.token")

        ws.app.state.manager.unregister.assert_called_once_with(user.id)
        ws.app.state.subscriber.unsubscribe.assert_called_once_with(orphaned)
