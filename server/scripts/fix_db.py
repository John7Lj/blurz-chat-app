import asyncio
from sqlalchemy import text
from db.main import engine

async def alter():
    async with engine.begin() as conn:
        try:
            await conn.execute(text('ALTER TABLE "user" RENAME COLUMN profile_picture TO profile_url;'))
            print("Renamed profile_picture to profile_url")
        except Exception as e:
            print(f"Error renaming: {e}")

    async with engine.begin() as conn:
        try:
            await conn.execute(text('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS profile_url VARCHAR;'))
            print("Added profile_url column if not existed")
        except Exception as e:
            print(f"Error adding: {e}")

asyncio.run(alter())
