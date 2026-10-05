from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Sequence

from app.modules.categories.schemas import CategoryCreate, CategoryUpdate
from app.modules.categories.models import Category
from app.modules.categories.repository import CategoryRepository

class CategoryService:
    def __init__(self, db: AsyncSession):
        self.repo = CategoryRepository(db)

    async def create_category(self, category_in: CategoryCreate, restaurant_id: int) -> Category:
        existing = await self.repo.get_by_name(category_in.name, restaurant_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category with this name already exists"
            )
        return await self.repo.create(category_in, restaurant_id)

    async def get_categories(self, restaurant_id: int) -> Sequence[Category]:
        return await self.repo.get_all(restaurant_id)

    async def get_category(self, category_id: int, restaurant_id: int) -> Category:
        category = await self.repo.get_by_id(category_id, restaurant_id)
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        return category

    async def update_category(self, category_id: int, category_in: CategoryUpdate, restaurant_id: int) -> Category:
        category = await self.get_category(category_id, restaurant_id)
        
        if category_in.name and category_in.name != category.name:
            existing = await self.repo.get_by_name(category_in.name, restaurant_id)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Category with this name already exists"
                )
                
        return await self.repo.update(category, category_in)

    async def delete_category(self, category_id: int, restaurant_id: int) -> Category:
        category = await self.get_category(category_id, restaurant_id)
        return await self.repo.soft_delete(category)
