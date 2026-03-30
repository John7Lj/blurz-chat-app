from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select,or_
from db.config import config
from db.models import User as User_Model
from .schema import Create_User,Update_User
from utils import generate_hashed_password
from errors import UserAlreadyExists,UserAlreadyVerify,UserNotFound
from fastapi import  HTTPException, status
import uuid
import logging
import shutil
from pathlib import Path
class User_Service:

    # In your User_Service class, update get_user_by_email method:

    async def get_user_by_email(self, email: str, session: AsyncSession):
        
        email = email.strip().lower()  # Strip whitespace and lowercase
        
        statement = select(User_Model).where(User_Model.email == email)
        result = await session.execute(statement)
        user = result.scalar_one_or_none()
        
        print(f"   User found: {user is not None}")
        if user:
            print(f"   Found: {user.email}")
        
        return user

    async def get_user_by_phone(self, phone: str, session: AsyncSession):
        
        phone = phone.strip().lower()  # Strip whitespace and lowercase
        
        statement = select(User_Model).where(User_Model.phone == phone)
        result = await session.execute(statement)
        user = result.scalar_one_or_none()

        return user
    async def user_exist(self, email: str,phone:str | None, username:str | None, session: AsyncSession):

        query = select(User_Model).where(or_(User_Model.email == email, User_Model.username == username))
        result = await session.execute(query)
        user: User_Model | None = result.scalar_one_or_none()
        return user

  
    async def create_user(self, user_data: Create_User, session: AsyncSession):
        user_data_in_dict = user_data.model_dump()
        
        # Swap 'password' for 'password_hash'
        plain_password = user_data_in_dict.pop('password')
        user_data_in_dict['password_hash'] = generate_hashed_password(plain_password)
        
        # Create and save user
        new_user = User_Model(**user_data_in_dict)
        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)
        
        return new_user

        
    async def activation_user(self,email:str,session:AsyncSession):
        
        user_exist : User_Model = await self.get_user_by_email(email,session)
        if not user_exist:
            raise UserNotFound()
        if user_exist.is_verified:
            raise UserAlreadyVerify()
        user_exist.is_verified=True
        logging.info(f"User verified successfully: {email}")

        await session.commit()
        await session.refresh(user_exist)
        
def save_profile_picture_sync(picture_bytes: bytes, ext: str) -> str:
    allowed_exts = {".jpg", ".jpeg", ".png", ".webp"}
    if ext.lower() not in allowed_exts:
        raise ValueError(f"Unsupported extension: {ext}")

    base_path = Path(config.profile_picture_path)
    base_path.mkdir(parents=True, exist_ok=True)

    file_name = f"{uuid.uuid4()}{ext}"
    file_path = base_path / file_name


    try:
        with open(file_path, "wb") as f:
            f.write(picture_bytes)
        logging.info(f"File saved successfully at {file_path}")
    except OSError as e:
        logging.error(f"Failed to save file at {file_path}. Error: {e}")
    return str(file_path)