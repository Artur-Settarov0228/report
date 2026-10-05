from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Sequence

from app.modules.tables.schemas import TableCreate, TableUpdate, TableStatusResponse
from app.modules.tables.models import Table
from app.modules.tables.repository import TableRepository

class TableService:
    def __init__(self, db: AsyncSession):
        self.repo = TableRepository(db)

    async def create_table(self, table_in: TableCreate, restaurant_id: int) -> Table:
        existing = await self.repo.get_by_number(table_in.table_number, restaurant_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Table with this number already exists"
            )
        return await self.repo.create(table_in, restaurant_id)

    async def get_tables(self, restaurant_id: int) -> Sequence[Table]:
        return await self.repo.get_all(restaurant_id)
        
    async def get_tables_with_status(self, restaurant_id: int) -> list[dict]:
        return await self.repo.get_tables_with_status(restaurant_id)

    async def get_table(self, table_id: int, restaurant_id: int) -> Table:
        table = await self.repo.get_by_id(table_id, restaurant_id)
        if not table:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found")
        return table

    async def update_table(self, table_id: int, table_in: TableUpdate, restaurant_id: int) -> Table:
        table = await self.get_table(table_id, restaurant_id)
        
        if table_in.table_number and table_in.table_number != table.table_number:
            existing = await self.repo.get_by_number(table_in.table_number, restaurant_id)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Table with this number already exists"
                )
                
        return await self.repo.update(table, table_in)

    async def delete_table(self, table_id: int, restaurant_id: int) -> Table:
        table = await self.get_table(table_id, restaurant_id)
        return await self.repo.soft_delete(table)
