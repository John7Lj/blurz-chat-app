import asyncio
from sqlmodel.ext.asyncio.session import AsyncSession
from db.main import engine
from sqlalchemy import text

async def verify_all():
    async with AsyncSession(engine) as session:
        await session.execute(text("UPDATE \"user\" SET is_verified = TRUE"))
        await session.commit()
        print('All users verified!')

if __name__ == "__main__":
    asyncio.run(verify_all())
