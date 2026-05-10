# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from db.models import User 
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from core.errors import UserNotFound, UserAlreadyExists
from .schemas import Update_User
import uuid

# get all active users or verified users
async def get_contacts(session: AsyncSession):
    query = select(User).where(User.is_verified == True)
    result = await session.execute(query)
    users = result.scalars().all()
    return users

# search for user by username
async def search_user(query_str: str, session: AsyncSession):
    query = select(User).where(User.username.ilike(f"%{query_str}%"))
    result = await session.execute(query)
    users = result.scalars().all()
    return users

async def is_username_exist(username: str, session: AsyncSession):
    query = select(User).where(User.username == username)
    result = await session.execute(query)
    user = result.scalar_one_or_none()
    return user


async def update_user(user_id: uuid.UUID, session: AsyncSession, update_data: Update_User):
    if update_data.username:
        existing = await is_username_exist(update_data.username, session)
        if existing and existing.id != user_id:
            raise UserAlreadyExists()
    
    query = select(User).where(User.id == user_id)
    result = await session.execute(query)
    user = result.scalar_one_or_none()
    if not user:
        raise UserNotFound()
    
    # Only update fields that were explicitly set (not None)
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def get_user_by_id(id:uuid.UUID,session:AsyncSession):
    statment = select(User).where(User.id == id)
    result = await session.execute(statment)
    user = result.scalar_one_or_none()
    return user


async def delete_user_account(user_id: uuid.UUID, session: AsyncSession) -> bool:
    """Delete user and all associated data (chats, messages, participants)."""
    from sqlmodel import delete
    from db.models import ChatParticipants, Message, Chat
    
    try:
        user = await get_user_by_id(user_id, session)
        if not user:
            return False
        
        # 1. Delete all messages sent by this user
        await session.execute(
            delete(Message).where(Message.sender_id == user_id)
        )
        
        # 2. Delete all chat_participants entries for this user
        await session.execute(
            delete(ChatParticipants).where(ChatParticipants.user_id == user_id)
        )
        
        # 3. Delete the user
        await session.delete(user)
        await session.commit()
        return True
        
    except Exception as e:
        await session.rollback()
        raise e
