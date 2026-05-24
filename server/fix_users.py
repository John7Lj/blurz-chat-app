# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.


import asyncio
import asyncpg
import os

async def run():
    db_url = os.getenv("DB_URL", "postgresql://postgres:postgres@localhost:5432/blurz_chat")
    conn = await asyncpg.connect(db_url)
    await conn.execute('UPDATE "user" SET is_verified = TRUE;')
    await conn.close()
    print('Users verified successfully.')

asyncio.run(run())

