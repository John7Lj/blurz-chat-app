
import asyncio
import asyncpg

async def run():
    conn = await asyncpg.connect('postgresql://postgres:blurz@localhost:5432/blurz_chat')
    await conn.execute('UPDATE "user" SET is_verified = TRUE;')
    await conn.close()
    print('Users verified successfully.')

asyncio.run(run())

