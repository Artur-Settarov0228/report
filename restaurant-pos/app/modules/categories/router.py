from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.categories.schemas import CategoryCreate, CategoryUpdate, CategoryResponse
from app.modules.categories.service import CategoryService

router = APIRouter(prefix="/api/v1/categories", tags=["categories"])

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_in: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = CategoryService(db)
    category = await service.create_category(category_in, current_user.restaurant_id)
    await db.commit()
    return category

@router.get("", response_model=List[CategoryResponse])
async def get_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = CategoryService(db)
    return await service.get_categories(current_user.restaurant_id)

@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = CategoryService(db)
    return await service.get_category(category_id, current_user.restaurant_id)

@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_in: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = CategoryService(db)
    category = await service.update_category(category_id, category_in, current_user.restaurant_id)
    await db.commit()
    return category

@router.delete("/{category_id}", response_model=CategoryResponse)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = CategoryService(db)
    category = await service.delete_category(category_id, current_user.restaurant_id)
    await db.commit()
    return category
