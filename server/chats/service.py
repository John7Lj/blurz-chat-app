from logging import exception
from db.models import Chat ,ChatParticipants,User,Message
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from core.errors import UserNotFound, UserAlreadyExists
import uuid
from sqlalchemy.orm import selectinload
from .schemas import MessageType
from typing import List
from fastapi.exceptions import HTTPException
from fastapi import status
async def get_user_chats_with_others(session: AsyncSession, user_id: uuid.UUID):
    subquery = (
        select(ChatParticipants.chat_id)
        .where(ChatParticipants.user_id == user_id)
    )

    statement = (
        select(Chat, User)
        .join(ChatParticipants, ChatParticipants.chat_id == Chat.id)
        .join(User, User.id == ChatParticipants.user_id)
        .where(Chat.id.in_(subquery))              # chats I belong to
        .where(User.id != user_id)                 # exclude me
    )

    result = await session.exec(statement)
    return result.all()



# this for one to one chat only 
async def find_existing_chat(
    session: AsyncSession, 
    user1_id: uuid.UUID, 
    user2_id: uuid.UUID
) -> Chat | None:

    subquery = (
        select(ChatParticipants.chat_id)
        .where(ChatParticipants.user_id == user1_id)
        .intersect(
            select(ChatParticipants.chat_id)
            .where(ChatParticipants.user_id == user2_id)
        )
    )

    # 2. Use .in_(subquery) correctly
    statement = select(Chat).where(Chat.id.in_(subquery))
    
    # 3. Execute and get the first result
    result = await session.execute(statement)
    chat = result.scalars().first()
    
    return chat

# this for start chat that no past chat with a specefic user
async def create_chat_with_message(
    session: AsyncSession,
    sender_id: uuid.UUID,
    recipient_id: uuid.UUID,
    content: str,
    msg_type: MessageType = MessageType.text,
) -> tuple[Chat, Message]:

    """Create a new chat, add participants, and save the first message."""
    chat = Chat()
    session.add(chat)
    await session.flush()  # Get chat.id before inserting participants

    # Add both participants
    session.add(ChatParticipants(chat_id=chat.id, user_id=sender_id))
    session.add(ChatParticipants(chat_id=chat.id, user_id=recipient_id))

    # Save the message
    message = Message(
        content=content,
        sender_id=sender_id,
        chat_id=chat.id,
        msg_type=msg_type,
    )
    session.add(message)

    await session.commit()
    await session.refresh(chat)
    return chat, message

# Add message to an existing chat
async def add_message_to_chat(
    session: AsyncSession,
    chat_id: uuid.UUID,
    sender_id: uuid.UUID,
    content: str,
    msg_type: MessageType = MessageType.text,
) -> Message:
    message = Message(
        content=content,
        sender_id=sender_id,
        chat_id=chat_id,
        msg_type=msg_type,
    )
    session.add(message)
    await session.commit()
    await session.refresh(message)
    return message

from sqlmodel import delete
# this is for existing chat no need to create new chats this will matter in the endpoitn
async def delete_chats_service(
    ids: List[uuid.UUID],
    current_user_id: uuid.UUID,
    session: AsyncSession
) -> bool:
    if not ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide at least one ID."
        )

    try:
        # 1. Find which of the requested IDs actually belong to the user
        verify_query = select(ChatParticipants.chat_id).where(
            ChatParticipants.chat_id.in_(ids),
            ChatParticipants.user_id == current_user_id
        )
        
        result = await session.execute(verify_query)
        valid_ids = result.scalars().all()

        # 2. Check if the user owns ALL the chats they want to delete
        if len(valid_ids) != len(set(ids)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="One or more chat IDs are invalid or unauthorized."
            )

        # 3. Perform the bulk delete
        await session.execute(
            delete(Chat).where(Chat.id.in_(ids))
        )

        await session.commit()
        return True 
                
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise e


async def get_user_chat_ids(session: AsyncSession, user_id: uuid.UUID) -> list[uuid.UUID]:
    """Return all chat_ids this user belongs to."""
    stmt = select(ChatParticipants.chat_id).where(ChatParticipants.user_id == user_id)
    result = await session.exec(stmt)
    return list(result.all())


async def verify_chat_membership(
    session: AsyncSession, chat_id: uuid.UUID, user_id: uuid.UUID
) -> bool:
    """Check if user_id is a participant of chat_id."""
    stmt = select(ChatParticipants).where(
        ChatParticipants.chat_id == chat_id,
        ChatParticipants.user_id == user_id,
    )
    result = await session.exec(stmt)
    return result.first() is not None


