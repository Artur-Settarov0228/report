from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.tables.schemas import TableCreate, TableUpdate, TableResponse, TableStatusResponse
from app.modules.tables.service import TableService

router = APIRouter(prefix="/api/v1/tables", tags=["tables"])

@router.post("", response_model=TableResponse, status_code=status.HTTP_201_CREATED)
async def create_table(
    table_in: TableCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = TableService(db)
    table = await service.create_table(table_in, current_user.restaurant_id)
    await db.commit()
    return table

@router.get("/status", response_model=List[TableStatusResponse])
async def get_tables_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = TableService(db)
    data = await service.get_tables_with_status(current_user.restaurant_id)
    
    # Map the repository results to the response schema
    response = []
    for item in data:
        table = item["table"]
        status = item["status"]
        response.append(
            TableStatusResponse(
                id=table.id,
                restaurant_id=table.restaurant_id,
                table_number=table.table_number,
                seats=table.seats,
                is_active=table.is_active,
                created_at=table.created_at,
                updated_at=table.updated_at,
                status=status
            )
        )
    return response

@router.get("", response_model=List[TableResponse])
async def get_tables(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = TableService(db)
    return await service.get_tables(current_user.restaurant_id)

@router.get("/{table_id}", response_model=TableResponse)
async def get_table(
    table_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = TableService(db)
    return await service.get_table(table_id, current_user.restaurant_id)

@router.patch("/{table_id}", response_model=TableResponse)
async def update_table(
    table_id: int,
    table_in: TableUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = TableService(db)
    table = await service.update_table(table_id, table_in, current_user.restaurant_id)
    await db.commit()
    return table

@router.delete("/{table_id}", response_model=TableResponse)
async def delete_table(
    table_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = TableService(db)
    table = await service.delete_table(table_id, current_user.restaurant_id)
    await db.commit()
    return table
