# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import asyncio
import uuid
from sqlmodel.ext.asyncio.session import AsyncSession
from db.main import engine
from db.models import User
from core.utils import generate_hashed_password
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def seed_users():
    password_hash = generate_hashed_password("blurzblurz")
    
    async with AsyncSession(engine) as session:
        for i in range(51):
            if i == 0:
                email = "blurz@gmail.com"
                username = "blurz"
                phone = "0000000000"
            else:
                email = f"blurz{i}@gmail.com"
                username = f"blurz{i}"
                phone = f"000000000{i:02d}"
                
            # Check if user already exists
            from sqlalchemy import text
            user_exists = await session.execute(
                text(f"SELECT 1 FROM \"user\" WHERE email = '{email}'")
            )
            if user_exists.fetchone():
                logger.info(f"User {email} already exists, skipping.")
                continue

            user = User(
                username=username,
                email=email,
                phone=phone,
                first_name=f"User{i}",
                last_name="Test",
                password_hash=password_hash,
                is_verified=True
            )
            session.add(user)
        
        await session.commit()
        logger.info("Successfully created 51 users.")

if __name__ == "__main__":
    asyncio.run(seed_users())
