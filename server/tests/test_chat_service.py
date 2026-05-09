# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Unit tests for server/chats/service.py
Tests: get_user_chats_with_others, find_existing_chat, create_chat_with_message,
       add_message_to_chat, delete_chats_service, get_user_chat_ids
"""
import pytest
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException


class TestGetUserChatsWithOthers:
    """Tests for get_user_chats_with_others()"""

    @pytest.mark.asyncio
    async def test_returns_chat_user_pairs(self, mock_session, sample_user_id):
        from chats.service import get_user_chats_with_others

        chat = MagicMock()
        other_user = MagicMock()
        mock_result = MagicMock()
        mock_result.all.return_value = [(chat, other_user)]
        mock_session.exec = AsyncMock(return_value=mock_result)

        result = await get_user_chats_with_others(mock_session, sample_user_id)
        assert len(result) == 1
        assert result[0] == (chat, other_user)

    @pytest.mark.asyncio
    async def test_returns_empty_when_no_chats(self, mock_session, sample_user_id):
        from chats.service import get_user_chats_with_others

        mock_result = MagicMock()
        mock_result.all.return_value = []
        mock_session.exec = AsyncMock(return_value=mock_result)

        result = await get_user_chats_with_others(mock_session, sample_user_id)
        assert result == []


class TestFindExistingChat:
    """Tests for find_existing_chat()"""

    @pytest.mark.asyncio
    async def test_returns_chat_when_exists(self, mock_session, sample_chat_model):
        from chats.service import find_existing_chat

        mock_scalars = MagicMock()
        mock_scalars.first.return_value = sample_chat_model
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars
        mock_session.execute = AsyncMock(return_value=mock_result)

        result = await find_existing_chat(mock_session, uuid.uuid4(), uuid.uuid4())
        assert result is not None
        assert result.id == sample_chat_model.id

    @pytest.mark.asyncio
    async def test_returns_none_when_no_chat(self, mock_session):
        from chats.service import find_existing_chat

        mock_scalars = MagicMock()
        mock_scalars.first.return_value = None
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars
        mock_session.execute = AsyncMock(return_value=mock_result)

        result = await find_existing_chat(mock_session, uuid.uuid4(), uuid.uuid4())
        assert result is None


class TestCreateChatWithMessage:
    """Tests for create_chat_with_message()"""

    @pytest.mark.asyncio
    async def test_creates_chat_and_message(self, mock_session):
        from chats.service import create_chat_with_message

        sender_id = uuid.uuid4()
        recipient_id = uuid.uuid4()

        chat, message = await create_chat_with_message(
            session=mock_session,
            sender_id=sender_id,
            recipient_id=recipient_id,
            content="Hello!",
        )

        # 3 adds: chat + 2 participants + 1 message = 4 calls total
        assert mock_session.add.call_count >= 3
        mock_session.flush.assert_called_once()
        mock_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_message_has_correct_content(self, mock_session):
        from chats.service import create_chat_with_message

        chat, message = await create_chat_with_message(
            session=mock_session,
            sender_id=uuid.uuid4(),
            recipient_id=uuid.uuid4(),
            content="Test content",
        )
        assert message.content == "Test content"


class TestAddMessageToChat:
    """Tests for add_message_to_chat()"""

    @pytest.mark.asyncio
    async def test_adds_message_to_existing_chat(self, mock_session, sample_chat_id, sample_user_id):
        from chats.service import add_message_to_chat

        message = await add_message_to_chat(
            session=mock_session,
            chat_id=sample_chat_id,
            sender_id=sample_user_id,
            content="New message",
        )

        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()
        assert message.content == "New message"
        assert message.sender_id == sample_user_id
        assert message.chat_id == sample_chat_id

    @pytest.mark.asyncio
    async def test_message_default_type_is_text(self, mock_session, sample_chat_id, sample_user_id):
        from chats.service import add_message_to_chat

        message = await add_message_to_chat(
            session=mock_session,
            chat_id=sample_chat_id,
            sender_id=sample_user_id,
            content="Typed msg",
        )
        assert message.msg_type.value == "text"


class TestDeleteChatsService:
    """Tests for delete_chats_service()"""

    @pytest.mark.asyncio
    async def test_raises_on_empty_ids(self, mock_session):
        from chats.service import delete_chats_service

        with pytest.raises(HTTPException) as exc_info:
            await delete_chats_service([], uuid.uuid4(), mock_session)
        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_raises_on_unauthorized_chat(self, mock_session):
        from chats.service import delete_chats_service

        chat_id = uuid.uuid4()
        mock_scalars = MagicMock()
        mock_scalars.all.return_value = []  # no valid IDs
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars
        mock_session.execute = AsyncMock(return_value=mock_result)

        with pytest.raises(HTTPException) as exc_info:
            await delete_chats_service([chat_id], uuid.uuid4(), mock_session)
        assert exc_info.value.status_code == 403

    @pytest.mark.asyncio
    async def test_deletes_valid_chats(self, mock_session):
        from chats.service import delete_chats_service

        chat_id = uuid.uuid4()
        user_id = uuid.uuid4()

        mock_scalars = MagicMock()
        mock_scalars.all.return_value = [chat_id]
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars
        mock_session.execute = AsyncMock(return_value=mock_result)

        result = await delete_chats_service([chat_id], user_id, mock_session)
        assert result is True
        mock_session.commit.assert_called_once()


class TestGetUserChatIds:
    """Tests for get_user_chat_ids()"""

    @pytest.mark.asyncio
    async def test_returns_list_of_chat_ids(self, mock_session, sample_user_id):
        from chats.service import get_user_chat_ids

        chat_id1 = uuid.uuid4()
        chat_id2 = uuid.uuid4()
        mock_result = MagicMock()
        mock_result.all.return_value = [chat_id1, chat_id2]
        mock_session.exec = AsyncMock(return_value=mock_result)

        result = await get_user_chat_ids(mock_session, sample_user_id)
        assert len(result) == 2
        assert chat_id1 in result

    @pytest.mark.asyncio
    async def test_returns_empty_for_new_user(self, mock_session, sample_user_id):
        from chats.service import get_user_chat_ids

        mock_result = MagicMock()
        mock_result.all.return_value = []
        mock_session.exec = AsyncMock(return_value=mock_result)

        result = await get_user_chat_ids(mock_session, sample_user_id)
        assert result == []
