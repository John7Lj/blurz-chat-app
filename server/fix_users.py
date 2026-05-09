# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.


import asyncio
import asyncpg

async def run():
    conn = await asyncpg.connect('postgresql://postgres:blurz@localhost:5432/blurz_chat')
    await conn.execute('UPDATE "user" SET is_verified = TRUE;')
    await conn.close()
    print('Users verified successfully.')

asyncio.run(run())

