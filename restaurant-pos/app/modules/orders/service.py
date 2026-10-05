from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Sequence

from app.modules.orders.schemas import OrderCreate, OrderItemAdd, OrderItemUpdate
from app.modules.orders.models import Order, OrderItem
from app.modules.orders.repository import OrderRepository
from app.modules.products.repository import ProductRepository
from app.modules.tables.repository import TableRepository
from app.shared.enums import OrderStatus, TableStatus

class OrderService:
    def __init__(self, db: AsyncSession):
        self.repo = OrderRepository(db)
        self.product_repo = ProductRepository(db)
        self.table_repo = TableRepository(db)

    async def create_order(self, order_in: OrderCreate, restaurant_id: int, cashier_id: int) -> Order:
        if order_in.table_id:
            table = await self.table_repo.get_by_id(order_in.table_id, restaurant_id)
            if not table:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found")
            if not table.is_active:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Table is inactive")
                
        return await self.repo.create(order_in, restaurant_id, cashier_id)

    async def get_orders(self, restaurant_id: int, table_id: int | None = None, status: str | None = None, skip: int = 0, limit: int = 1000) -> Sequence[Order]:
        return await self.repo.get_all(restaurant_id, table_id, status, skip, limit)

    async def get_order(self, order_id: int, restaurant_id: int) -> Order:
        order = await self.repo.get_by_id(order_id, restaurant_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        return order

    def _ensure_open(self, order: Order):
        if order.status != OrderStatus.OPEN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Cannot modify order because it is {order.status}"
            )

    async def add_item(self, order_id: int, item_in: OrderItemAdd, restaurant_id: int) -> Order:
        order = await self.get_order(order_id, restaurant_id)
        self._ensure_open(order)
        
        product = await self.product_repo.get_by_id(item_in.product_id, restaurant_id)
        if not product or not product.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product not found or inactive")

        # Snapshot pricing
        subtotal = product.price * item_in.quantity
        
        await self.repo.add_item(
            order_id=order.id,
            product_id=product.id,
            product_name=product.name,
            unit_price=product.price,
            quantity=item_in.quantity,
            subtotal=subtotal,
            note=item_in.note
        )
        
        await self.repo.recalculate_total(order.id)
        return await self.get_order(order.id, restaurant_id)

    async def update_item(self, order_id: int, item_id: int, item_in: OrderItemUpdate, restaurant_id: int) -> Order:
        order = await self.get_order(order_id, restaurant_id)
        self._ensure_open(order)
        
        item = await self.repo.get_item_by_id(item_id, order.id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order item not found")
            
        await self.repo.update_item(item, item_in.quantity, item_in.note)
        await self.repo.recalculate_total(order.id)
        return await self.get_order(order.id, restaurant_id)

    async def remove_item(self, order_id: int, item_id: int, restaurant_id: int) -> Order:
        order = await self.get_order(order_id, restaurant_id)
        self._ensure_open(order)
        
        item = await self.repo.get_item_by_id(item_id, order.id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order item not found")
            
        await self.repo.delete_item(item)
        await self.repo.recalculate_total(order.id)
        return await self.get_order(order.id, restaurant_id)

    async def update_status(self, order_id: int, status: str, restaurant_id: int) -> Order:
        order = await self.get_order(order_id, restaurant_id)
        await self.repo.update_status(order.id, status)
        return await self.get_order(order.id, restaurant_id)
