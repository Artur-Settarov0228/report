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

async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as session:
        # Get existing restaurant
        result = await session.execute(select(Restaurant))
        restaurant = result.scalars().first()
        if not restaurant:
            restaurant = Restaurant(name="Asosiy Restoran", address="Tashkent", phone="998901234567")
            session.add(restaurant)
            await session.commit()
            await session.refresh(restaurant)

        # Create Tables
        for i in range(1, 13):
            tbl_result = await session.execute(select(Table).where(Table.table_number == str(i)))
            if not tbl_result.scalars().first():
                table = Table(table_number=str(i), seats=4 if i % 2 == 0 else 6, restaurant_id=restaurant.id)
                session.add(table)

        # Create Categories
        cats = ["Milliy taomlar", "Yevropa taomlari", "Ichimliklar", "Shirinliklar", "Fast Food"]
        db_cats = {}
        for c in cats:
            c_result = await session.execute(select(Category).where(Category.name == c))
            cat_obj = c_result.scalars().first()
            if not cat_obj:
                cat_obj = Category(name=c, description=f"{c} kategoriyasi", restaurant_id=restaurant.id)
                session.add(cat_obj)
                await session.flush()
            db_cats[c] = cat_obj.id

        # Create Products
        prods = [
            ("Osh (To'y oshi)", "Milliy taomlar", 35000, "https://images.unsplash.com/photo-1590577976322-3d2d6e2130d5?auto=format&fit=crop&q=80&w=200"),
            ("Qozonkabob", "Milliy taomlar", 55000, ""),
            ("Norin", "Milliy taomlar", 45000, ""),
            ("Steak", "Yevropa taomlari", 120000, "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&q=80&w=200"),
            ("Klab Sendvich", "Fast Food", 35000, ""),
            ("Burger (Mol go'shti)", "Fast Food", 40000, "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=200"),
            ("Qora Choy (Choynak)", "Ichimliklar", 5000, ""),
            ("Ko'k Choy (Choynak)", "Ichimliklar", 5000, ""),
            ("Coca-Cola 1L", "Ichimliklar", 12000, "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200"),
            ("Muzqaymoq", "Shirinliklar", 15000, ""),
            ("Pahlava", "Shirinliklar", 20000, ""),
        ]

        for i, (name, cat, price, img) in enumerate(prods):
            p_result = await session.execute(select(Product).where(Product.name == name))
            if not p_result.scalars().first():
                prod = Product(
                    name=name, sku=f"SKU{i+100}", price=price, unit="PIECE",
                    image_url=img if img else None, category_id=db_cats[cat], restaurant_id=restaurant.id
                )
                session.add(prod)

        await session.commit()
        print("Ma'lumotlar bazaga muvaffaqiyatli qo'shildi!")

asyncio.run(seed())
