import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.modules.restaurants.models import Restaurant
from app.modules.users.models import User
from app.modules.categories.models import Category
from app.modules.products.models import Product
from app.modules.tables.models import Table
from app.modules.orders.models import Order, OrderItem
from app.modules.payments.models import Payment

from app.core.security import get_password_hash
from app.core.config import settings

async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        restaurant = Restaurant(name="Asosiy Restoran", address="Tashkent", phone="998901234567")
        session.add(restaurant)
        await session.commit()
        await session.refresh(restaurant)
        
        user = User(
            username="admin",
            password_hash=get_password_hash("admin123"),
            full_name="Asosiy Kassir",
            restaurant_id=restaurant.id,
            is_active=True
        )
        session.add(user)
        await session.commit()
        print("TAYYOR! Username: admin, Parol: admin123")

asyncio.run(main())
