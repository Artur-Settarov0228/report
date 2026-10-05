from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Sequence
from app.modules.categories.models import Category
from app.modules.categories.schemas import CategoryCreate, CategoryUpdate

class CategoryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, category_id: int, restaurant_id: int) -> Category | None:
        result = await self.db.execute(
            select(Category).where(
                Category.id == category_id,
                Category.restaurant_id == restaurant_id
            )
        )
        return result.scalars().first()

    async def get_by_name(self, name: str, restaurant_id: int) -> Category | None:
        result = await self.db.execute(
            select(Category).where(
                Category.name == name,
                Category.restaurant_id == restaurant_id
            )
        )
        return result.scalars().first()

    async def get_all(self, restaurant_id: int) -> Sequence[Category]:
        result = await self.db.execute(
            select(Category).where(Category.restaurant_id == restaurant_id).order_by(Category.id.desc())
        )
        return result.scalars().all()

    async def create(self, category_in: CategoryCreate, restaurant_id: int) -> Category:
        category = Category(
            **category_in.model_dump(),
            restaurant_id=restaurant_id
        )
        self.db.add(category)
        await self.db.flush()
        await self.db.refresh(category)
        return category

    async def update(self, category: Category, category_in: CategoryUpdate) -> Category:
        update_data = category_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(category, field, value)
        await self.db.flush()
        await self.db.refresh(category)
        return category

    async def soft_delete(self, category: Category) -> Category:
        category.is_active = False
        await self.db.flush()
        await self.db.refresh(category)
        return category
