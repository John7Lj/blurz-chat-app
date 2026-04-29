from db.models import Chat ,ChatParticipants,User,Message
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from .schema import MessageType,MessageStatus
from annotated_types import List
from fastapi.exceptions import HTTPException
from fastapi import status
import uuid


# this is shred code and not make any request to the database directly
async def ownership_chat_id(chat_id:uuid.UUID,user_id:uuid.UUID):
    subquery=select(ChatParticipants.chat_id).where(
            ChatParticipants.chat_id.in_(chat_id),
            ChatParticipants.user_id == user_id
        )
    return subquery

async def get_message_by_chatId(limit:int,skip:int,
 chat_id:uuid.UUID,user_id:uuid.UUID
 ,session:AsyncSession):
    try:
        subquery=ownership_chat_id(chat_id,user_id)

        statement=select(Message).where(
            Message.chat_id.in_(subquery)
            ).offset(skip).limit(limit)

        result = await session.exec(statement)
        messages = result.all()
        return messages
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise e

    
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
                Message.sender_id == user_id
            )
            .values(status=MessageStatus.read.value)
        )
        await session.commit()
        return True
    except Exception as e:
        await session.rollback()
        raise e

    