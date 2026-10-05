import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import text
from app.core.config import settings

async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        await session.execute(text("TRUNCATE TABLE order_items, orders, products, categories CASCADE;"))
        await session.commit()
        print("Tozalandi!")

asyncio.run(main())
