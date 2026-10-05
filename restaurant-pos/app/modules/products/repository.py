from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, or_
from typing import Sequence, Tuple
from app.modules.products.models import Product
from app.modules.products.schemas import ProductCreate, ProductUpdate

class ProductRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, product_id: int, restaurant_id: int) -> Product | None:
        result = await self.db.execute(
            select(Product).where(
                Product.id == product_id,
                Product.restaurant_id == restaurant_id
            )
        )
        return result.scalars().first()

    async def get_by_sku(self, sku: str, restaurant_id: int) -> Product | None:
        result = await self.db.execute(
            select(Product).where(
                Product.sku == sku,
                Product.restaurant_id == restaurant_id
            )
        )
        return result.scalars().first()

    async def get_all(
        self, 
        restaurant_id: int, 
        skip: int = 0, 
        limit: int = 50,
        search: str | None = None,
        category_id: int | None = None,
        is_active: bool | None = None
    ) -> Sequence[Product]:
        query = select(Product).where(Product.restaurant_id == restaurant_id)
        
        if search:
            query = query.where(
                or_(
                    Product.name.ilike(f"%{search}%"),
                    Product.sku.ilike(f"%{search}%")
                )
            )
            
        if category_id is not None:
            query = query.where(Product.category_id == category_id)
            
        if is_active is not None:
            query = query.where(Product.is_active == is_active)
            
        query = query.order_by(Product.id.desc()).offset(skip).limit(limit)
        
        result = await self.db.execute(query)
        return result.scalars().all()

    async def create(self, product_in: ProductCreate, restaurant_id: int) -> Product:
        product = Product(
            **product_in.model_dump(),
            restaurant_id=restaurant_id
        )
        self.db.add(product)
        await self.db.flush()
        await self.db.refresh(product)
        return product

    async def update(self, product: Product, product_in: ProductUpdate) -> Product:
        update_data = product_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(product, field, value)
        await self.db.flush()
        await self.db.refresh(product)
        return product

    async def soft_delete(self, product: Product) -> Product:
        product.is_active = False
        await self.db.flush()
        await self.db.refresh(product)
        return product
