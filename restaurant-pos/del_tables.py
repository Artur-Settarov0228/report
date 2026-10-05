import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.core.config import settings

from app.modules.restaurants.models import Restaurant
from app.modules.tables.models import Table
from app.modules.categories.models import Category
from app.modules.products.models import Product
from app.modules.users.models import User
from app.modules.orders.models import Order, OrderItem
from app.modules.payments.models import Payment

async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(select(Table))
        tables = result.scalars().all()
        
        for table in tables:
            if table.table_number in [str(i) for i in range(1, 13)]:
                await session.delete(table)
                
        await session.commit()
        print("Tozalandi!")

asyncio.run(main())
