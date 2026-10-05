from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.products.schemas import ProductCreate, ProductUpdate, ProductResponse
from app.modules.products.service import ProductService

router = APIRouter(prefix="/api/v1/products", tags=["products"])

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_in: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ProductService(db)
    product = await service.create_product(product_in, current_user.restaurant_id)
    await db.commit()
    return product

@router.get("", response_model=List[ProductResponse])
async def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: str | None = None,
    category_id: int | None = None,
    is_active: bool | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ProductService(db)
    return await service.get_products(
        current_user.restaurant_id, skip=skip, limit=limit,
        search=search, category_id=category_id, is_active=is_active
    )

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ProductService(db)
    return await service.get_product(product_id, current_user.restaurant_id)

@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ProductService(db)
    product = await service.update_product(product_id, product_in, current_user.restaurant_id)
    await db.commit()
    return product

@router.delete("/{product_id}", response_model=ProductResponse)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ProductService(db)
    product = await service.delete_product(product_id, current_user.restaurant_id)
    await db.commit()
    return product
