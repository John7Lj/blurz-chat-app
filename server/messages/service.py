# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from db.models import Chat ,ChatParticipants,User,Message
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from .schemas import MessageType,MessageStatus
from typing import List
from fastapi.exceptions import HTTPException
from fastapi import status
import uuid


# this is shred code and not make any request to the database directly
async def get_message_by_chatId(
    limit: int,
    skip: int,
    chat_id: uuid.UUID,
    user_id: uuid.UUID,
    session: AsyncSession
):
    statement = (
        select(Message)
        .join(ChatParticipants, ChatParticipants.chat_id == Message.chat_id)
        .where(
            Message.chat_id == chat_id,
            ChatParticipants.user_id == user_id
        )
        .order_by(Message.sent_at.asc())
        .offset(skip)
        .limit(limit)
    )

    result = await session.exec(statement)
    messages = result.all()

    return messages
    
from sqlmodel import delete,update
async def delete_messages_byID(
    message_ids:List[uuid.UUID],
    user_id:uuid.UUID,
    session:AsyncSession
    ):
    try:
        verify_query=select(Message.id).where(
            Message.id.in_(message_ids),
            Message.sender_id == user_id
            )
        result = await session.execute(verify_query)
        valid_ids = result.scalars().all()
        if len(valid_ids) != len(set(message_ids)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="One or more message IDs are invalid or unauthorized."
            )
        await session.execute(delete(Message).where(Message.id.in_(valid_ids)))
        await session.commit()
        return True
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise e


async def edit_message_byID(message_id:uuid.UUID
,user_id:uuid.UUID,content:str,session:AsyncSession):
    try:
        await session.execute(
            update(Message)
            .where(
                Message.id == message_id,
                Message.sender_id == user_id
            )
            .values(content=content)
        )
        await session.commit()

        return True
    except Exception as e:
        await session.rollback()
        raise e
    
#this is the same as update_message but for readding
async def read_message_byID(message_id:uuid.UUID
,user_id:uuid.UUID,session:AsyncSession):
    try:
        await session.execute(
            update(Message)
            .where(
                Message.id == message_id,
                Message.sender_id != user_id  # reader is NOT the sender
            )
            .values(status=MessageStatus.read.value)
        )
        await session.commit()
        return True
    except Exception as e:
        await session.rollback()
        raise e

    