# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Unit tests for server/messages/service.py
Tests: get_message_by_chatId, delete_messages_byID, edit_message_byID, read_message_byID
"""
import pytest
import uuid
from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException


class TestGetMessageByChatId:
    """Tests for get_message_by_chatId()"""

    @pytest.mark.asyncio
    async def test_returns_messages(self, mock_session, sample_chat_id, sample_user_id):
        from messages.service import get_message_by_chatId

        msg1, msg2 = MagicMock(), MagicMock()
        mock_result = MagicMock()
        mock_result.all.return_value = [msg1, msg2]
        mock_session.exec = AsyncMock(return_value=mock_result)

        result = await get_message_by_chatId(
            limit=50, skip=0, chat_id=sample_chat_id,
            user_id=sample_user_id, session=mock_session
        )
        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_returns_empty_for_nonexistent_chat(self, mock_session, sample_user_id):
        from messages.service import get_message_by_chatId

        mock_result = MagicMock()
        mock_result.all.return_value = []
        mock_session.exec = AsyncMock(return_value=mock_result)

        result = await get_message_by_chatId(
            limit=50, skip=0, chat_id=uuid.uuid4(),
            user_id=sample_user_id, session=mock_session
        )
        assert result == []

    @pytest.mark.asyncio
    async def test_respects_limit_parameter(self, mock_session, sample_chat_id, sample_user_id):
        from messages.service import get_message_by_chatId

        mock_result = MagicMock()
        mock_result.all.return_value = [MagicMock()]
        mock_session.exec = AsyncMock(return_value=mock_result)

        result = await get_message_by_chatId(
            limit=1, skip=0, chat_id=sample_chat_id,
            user_id=sample_user_id, session=mock_session
        )
        assert len(result) <= 1


class TestDeleteMessagesByID:
    """Tests for delete_messages_byID()"""

    @pytest.mark.asyncio
    async def test_deletes_owned_messages(self, mock_session, sample_user_id):
        from messages.service import delete_messages_byID

        msg_id = uuid.uuid4()
        mock_scalars = MagicMock()
        mock_scalars.all.return_value = [msg_id]
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars
        mock_session.execute = AsyncMock(return_value=mock_result)

        result = await delete_messages_byID([msg_id], sample_user_id, mock_session)
        assert result is True
        mock_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_raises_on_unauthorized_delete(self, mock_session, sample_user_id):
        from messages.service import delete_messages_byID

        msg_id = uuid.uuid4()
        mock_scalars = MagicMock()
        mock_scalars.all.return_value = []  # user doesn't own any
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars
        mock_session.execute = AsyncMock(return_value=mock_result)

        with pytest.raises(HTTPException) as exc_info:
            await delete_messages_byID([msg_id], sample_user_id, mock_session)
        assert exc_info.value.status_code == 403

    @pytest.mark.asyncio
    async def test_raises_on_partial_ownership(self, mock_session, sample_user_id):
        from messages.service import delete_messages_byID

        msg_id1, msg_id2 = uuid.uuid4(), uuid.uuid4()
        mock_scalars = MagicMock()
        mock_scalars.all.return_value = [msg_id1]  # only owns 1 of 2
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars
        mock_session.execute = AsyncMock(return_value=mock_result)

        with pytest.raises(HTTPException) as exc_info:
            await delete_messages_byID([msg_id1, msg_id2], sample_user_id, mock_session)
        assert exc_info.value.status_code == 403


class TestEditMessageByID:
    """Tests for edit_message_byID()"""

    @pytest.mark.asyncio
    async def test_edits_message_successfully(self, mock_session, sample_message_id, sample_user_id):
        from messages.service import edit_message_byID

        mock_session.execute = AsyncMock()

        result = await edit_message_byID(
            sample_message_id, sample_user_id, "Updated content", mock_session
        )
        assert result is True
        mock_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_rollback_on_error(self, mock_session, sample_message_id, sample_user_id):
        from messages.service import edit_message_byID

        mock_session.execute = AsyncMock(side_effect=Exception("DB error"))

        with pytest.raises(Exception, match="DB error"):
            await edit_message_byID(
                sample_message_id, sample_user_id, "content", mock_session
            )
        mock_session.rollback.assert_called_once()


class TestReadMessageByID:
    """Tests for read_message_byID()"""

    @pytest.mark.asyncio
    async def test_marks_message_as_read(self, mock_session, sample_message_id, sample_user_id):
        from messages.service import read_message_byID

        mock_session.execute = AsyncMock()

        result = await read_message_byID(sample_message_id, sample_user_id, mock_session)
        assert result is True
        mock_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_rollback_on_error(self, mock_session, sample_message_id, sample_user_id):
        from messages.service import read_message_byID

        mock_session.execute = AsyncMock(side_effect=Exception("DB error"))

        with pytest.raises(Exception, match="DB error"):
            await read_message_byID(sample_message_id, sample_user_id, mock_session)
        mock_session.rollback.assert_called_once()
