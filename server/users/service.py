from db.models import User 
from sqlmodel import select,where
from sqlmodel.ext.asyncio.session import AsyncSession
from .error import UserNotFound
from .schema import Update_User

# get all active users
async def get_contacts(session:AsyncSession):
    query = select(User).where(User.is_active == True)
    result = await session.execute(query)
    users = result.scalars().all()
    return users

# search for user by username
async def search_user(query:str,session:AsyncSession):
    query = select(User).where(User.username.ilike(f"%{query}%"))
    result = await session.execute(query)
    users = result.scalars().all()
    return users

async def is_username_exist(username:str,session:AsyncSession):
    query = select(User).where(User.username == username)
    result = await session.execute(query)
    user = result.scalar_one_or_none()
    return user


async def update_user(user_id:str,session:AsyncSession,update_data:Update_User):
    if update_data.username:
        user = await is_username_exist(update_data.username,session)
        if user:
            raise UserAlreadyExists()
    query = select(User).where(User.id == user_id)
    result = await session.execute(query)
    user = result.scalar_one_or_none()
    if not user:
        raise UserNotFound()
    for key,value in update_data.model_dump().items():
        setattr(user,key,value)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


