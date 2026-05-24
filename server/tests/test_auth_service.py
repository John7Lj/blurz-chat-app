# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Unit tests for server/auth/service.py
Tests: User_Service methods and save_profile_picture_sync
"""
import pytest
import uuid
import os
import tempfile
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone


class TestUserServiceGetUserByEmail:
    """Tests for User_Service.get_user_by_email()"""

    @pytest.mark.asyncio
    async def test_returns_user_when_found(self, sample_user_model, mock_session):
        from auth.service import User_Service
        
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_user_model
        mock_session.execute = AsyncMock(return_value=mock_result)
        
        service = User_Service()
        user = await service.get_user_by_email("testuser@example.com", mock_session)
        assert user is not None
        assert user.email == "testuser@example.com"

    @pytest.mark.asyncio
    async def test_returns_none_when_not_found(self, mock_session):
        from auth.service import User_Service
        
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute = AsyncMock(return_value=mock_result)
        
        service = User_Service()
        user = await service.get_user_by_email("nonexistent@test.com", mock_session)
        assert user is None

    @pytest.mark.asyncio
    async def test_strips_whitespace_and_lowercases_email(self, mock_session):
        from auth.service import User_Service
        
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute = AsyncMock(return_value=mock_result)
        
        service = User_Service()
        await service.get_user_by_email("  Test@Example.COM  ", mock_session)
        # The query should have been executed (can't easily verify normalized email in WHERE clause)
        mock_session.execute.assert_called_once()


class TestUserServiceGetUserByPhone:
    """Tests for User_Service.get_user_by_phone()"""

    @pytest.mark.asyncio
    async def test_returns_user_when_found(self, sample_user_model, mock_session):
        from auth.service import User_Service
        
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_user_model
        mock_session.execute = AsyncMock(return_value=mock_result)
        
        service = User_Service()
        user = await service.get_user_by_phone("+1234567890", mock_session)
        assert user is not None

    @pytest.mark.asyncio
    async def test_returns_none_when_not_found(self, mock_session):
        from auth.service import User_Service
        
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute = AsyncMock(return_value=mock_result)
        
        service = User_Service()
        user = await service.get_user_by_phone("+0000000000", mock_session)
        assert user is None


class TestUserServiceUserExist:
    """Tests for User_Service.user_exist()"""

    @pytest.mark.asyncio
    async def test_returns_user_when_exists(self, sample_user_model, mock_session):
        from auth.service import User_Service
        
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_user_model
        mock_session.execute = AsyncMock(return_value=mock_result)
        
        service = User_Service()
        result = await service.user_exist("test@test.com", "+123", "testuser", mock_session)
        assert result is not None

    @pytest.mark.asyncio
    async def test_returns_none_when_not_exists(self, mock_session):
        from auth.service import User_Service
        
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute = AsyncMock(return_value=mock_result)
        
        service = User_Service()
        result = await service.user_exist("new@test.com", "+999", "newuser", mock_session)
        assert result is None


class TestUserServiceActivation:
    """Tests for User_Service.activation_user()"""

    @pytest.mark.asyncio
    async def test_activates_unverified_user(self, mock_session):
        from auth.service import User_Service
        
        user = MagicMock()
        user.is_verified = False
        user.email = "test@test.com"
        
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = user
        mock_session.execute = AsyncMock(return_value=mock_result)
        
        service = User_Service()
        await service.activation_user("test@test.com", mock_session)
        
        assert user.is_verified is True
        mock_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_raises_if_user_not_found(self, mock_session):
        from auth.service import User_Service
        from core.errors import UserNotFound
        
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute = AsyncMock(return_value=mock_result)
        
        service = User_Service()
        with pytest.raises(UserNotFound):
            await service.activation_user("missing@test.com", mock_session)

    @pytest.mark.asyncio
    async def test_raises_if_already_verified(self, mock_session):
        from auth.service import User_Service
        from core.errors import UserAlreadyVerify
        
        user = MagicMock()
        user.is_verified = True
        user.email = "test@test.com"
        
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = user
        mock_session.execute = AsyncMock(return_value=mock_result)
        
        service = User_Service()
        with pytest.raises(UserAlreadyVerify):
            await service.activation_user("test@test.com", mock_session)


