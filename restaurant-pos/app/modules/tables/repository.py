from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from typing import Sequence
from app.modules.tables.models import Table
from app.modules.orders.models import Order
from app.shared.enums import OrderStatus, TableStatus
from app.modules.tables.schemas import TableCreate, TableUpdate

class TableRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, table_id: int, restaurant_id: int) -> Table | None:
        result = await self.db.execute(
            select(Table).where(
                Table.id == table_id,
                Table.restaurant_id == restaurant_id
            )
        )
        return result.scalars().first()

    async def get_by_number(self, table_number: str, restaurant_id: int) -> Table | None:
        result = await self.db.execute(
            select(Table).where(
                Table.table_number == table_number,
                Table.restaurant_id == restaurant_id
            )
        )
        return result.scalars().first()

    async def get_all(self, restaurant_id: int) -> Sequence[Table]:
        result = await self.db.execute(
            select(Table).where(Table.restaurant_id == restaurant_id).order_by(Table.id.desc())
        )
        return result.scalars().all()

    async def get_tables_with_status(self, restaurant_id: int):
        # We fetch tables and check if they have any OPEN orders
        result = await self.db.execute(
            select(Table).where(Table.restaurant_id == restaurant_id).order_by(Table.table_number)
        )
        tables = result.scalars().all()
        
        # Fetch open orders for this restaurant
        orders_result = await self.db.execute(
            select(Order.table_id).where(
                Order.restaurant_id == restaurant_id,
                Order.status == OrderStatus.OPEN,
                Order.table_id.isnot(None)
            )
        )
        open_table_ids = set(orders_result.scalars().all())
        
        return [
            {
                "table": table,
                "status": TableStatus.OCCUPIED if table.id in open_table_ids else TableStatus.FREE
            }
            for table in tables
        ]

    async def create(self, table_in: TableCreate, restaurant_id: int) -> Table:
        table = Table(
            **table_in.model_dump(),
            restaurant_id=restaurant_id
        )
        self.db.add(table)
        await self.db.flush()
        await self.db.refresh(table)
        return table

    async def update(self, table: Table, table_in: TableUpdate) -> Table:
        update_data = table_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(table, field, value)
        await self.db.flush()
        await self.db.refresh(table)
        return table

    async def soft_delete(self, table: Table) -> Table:
        table.is_active = False
        await self.db.flush()
        await self.db.refresh(table)
        return table
