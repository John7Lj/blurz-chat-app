# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import asyncio
from sqlmodel.ext.asyncio.session import AsyncSession
from db.main import engine
from sqlalchemy import text

async def check_user():
    async with AsyncSession(engine) as session:
        result = await session.execute(text("SELECT email, is_verified, password_hash FROM \"user\" WHERE email = 'blurz@gmail.com'"))
        user = result.fetchone()
        if user:
            print(f"User found: Email: {user[0]}, Verified: {user[1]}, Hash length: {len(user[2])}")
            print(f"Hash prefix: {user[2][:10]}")
        else:
            print("User not found in database!")

if __name__ == "__main__":
    asyncio.run(check_user())
