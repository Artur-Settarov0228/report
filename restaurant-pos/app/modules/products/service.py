from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Sequence

from app.modules.products.schemas import ProductCreate, ProductUpdate
from app.modules.products.models import Product
from app.modules.products.repository import ProductRepository
from app.modules.categories.repository import CategoryRepository

class ProductService:
    def __init__(self, db: AsyncSession):
        self.repo = ProductRepository(db)
        self.category_repo = CategoryRepository(db)

    async def _validate_category(self, category_id: int, restaurant_id: int):
        category = await self.category_repo.get_by_id(category_id, restaurant_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category does not exist or does not belong to this restaurant"
            )
        if not category.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category is inactive"
            )

    async def create_product(self, product_in: ProductCreate, restaurant_id: int) -> Product:
        await self._validate_category(product_in.category_id, restaurant_id)
        
        existing_sku = await self.repo.get_by_sku(product_in.sku, restaurant_id)
        if existing_sku:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product with this SKU already exists in this restaurant"
            )
            
        return await self.repo.create(product_in, restaurant_id)

    async def get_products(
        self, 
        restaurant_id: int,
        skip: int = 0,
        limit: int = 50,
        search: str | None = None,
        category_id: int | None = None,
        is_active: bool | None = None
    ) -> Sequence[Product]:
        return await self.repo.get_all(
            restaurant_id, skip=skip, limit=limit, 
            search=search, category_id=category_id, is_active=is_active
        )

    async def get_product(self, product_id: int, restaurant_id: int) -> Product:
        product = await self.repo.get_by_id(product_id, restaurant_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return product

    async def update_product(self, product_id: int, product_in: ProductUpdate, restaurant_id: int) -> Product:
        product = await self.get_product(product_id, restaurant_id)
        
        if product_in.category_id is not None and product_in.category_id != product.category_id:
            await self._validate_category(product_in.category_id, restaurant_id)
            
        if product_in.sku is not None and product_in.sku != product.sku:
            existing_sku = await self.repo.get_by_sku(product_in.sku, restaurant_id)
            if existing_sku:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Product with this SKU already exists in this restaurant"
                )
                
        return await self.repo.update(product, product_in)

    async def delete_product(self, product_id: int, restaurant_id: int) -> Product:
        product = await self.get_product(product_id, restaurant_id)
        return await self.repo.soft_delete(product)
