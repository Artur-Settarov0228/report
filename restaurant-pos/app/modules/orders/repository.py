from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from sqlalchemy.orm import selectinload
from typing import Sequence
from decimal import Decimal
from app.modules.orders.models import Order, OrderItem
from app.modules.orders.schemas import OrderCreate

class OrderRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, order_id: int, restaurant_id: int) -> Order | None:
        result = await self.db.execute(
            select(Order)
            .options(selectinload(Order.items))
            .where(
                Order.id == order_id,
                Order.restaurant_id == restaurant_id
            )
        )
        return result.scalars().first()

    async def get_all(self, restaurant_id: int, table_id: int | None = None, status: str | None = None, skip: int = 0, limit: int = 1000) -> Sequence[Order]:
        query = select(Order).options(selectinload(Order.items)).where(Order.restaurant_id == restaurant_id)
        if table_id is not None:
            query = query.where(Order.table_id == table_id)
        if status is not None:
            query = query.where(Order.status == status)
            
        result = await self.db.execute(
            query.order_by(Order.id.desc()).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def create(self, order_in: OrderCreate, restaurant_id: int, cashier_id: int) -> Order:
        order = Order(
            table_id=order_in.table_id,
            restaurant_id=restaurant_id,
            cashier_id=cashier_id
        )
        self.db.add(order)
        await self.db.flush()
        await self.db.refresh(order)
        return await self.get_by_id(order.id, restaurant_id)

    async def get_item_by_id(self, item_id: int, order_id: int) -> OrderItem | None:
        result = await self.db.execute(
            select(OrderItem).where(
                OrderItem.id == item_id,
                OrderItem.order_id == order_id
            )
        )
        return result.scalars().first()

    async def add_item(self, order_id: int, product_id: int, product_name: str, unit_price: Decimal, quantity: int, subtotal: Decimal, note: str | None) -> OrderItem:
        item = OrderItem(
            order_id=order_id,
            product_id=product_id,
            product_name=product_name,
            unit_price=unit_price,
            quantity=quantity,
            subtotal=subtotal,
            note=note
        )
        self.db.add(item)
        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def update_item(self, item: OrderItem, quantity: int, note: str | None) -> OrderItem:
        item.quantity = quantity
        item.subtotal = item.unit_price * quantity
        if note is not None:
            item.note = note
        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def delete_item(self, item: OrderItem):
        await self.db.delete(item)
        await self.db.flush()

    async def recalculate_total(self, order_id: int) -> Decimal:
        result = await self.db.execute(
            select(func.sum(OrderItem.subtotal)).where(OrderItem.order_id == order_id)
        )
        total = result.scalar() or Decimal('0.00')
        
        await self.db.execute(
            update(Order).where(Order.id == order_id).values(total_amount=total)
        )
        await self.db.flush()
        return total

    async def update_status(self, order_id: int, status: str) -> None:
        await self.db.execute(update(Order).where(Order.id == order_id).values(status=status))
        await self.db.flush()
