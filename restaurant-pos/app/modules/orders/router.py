from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.orders.schemas import OrderCreate, OrderItemAdd, OrderItemUpdate, OrderResponse, OrderStatusUpdate
from app.modules.orders.service import OrderService

router = APIRouter(prefix="/api/v1/orders", tags=["orders"])

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = OrderService(db)
    order = await service.create_order(order_in, current_user.restaurant_id, current_user.id)
    await db.commit()
    return order

from app.shared.enums import OrderStatus

@router.get("", response_model=List[OrderResponse])
async def get_orders(
    table_id: int | None = Query(None),
    status: OrderStatus | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = OrderService(db)
    return await service.get_orders(current_user.restaurant_id, table_id, status, skip, limit)

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = OrderService(db)
    return await service.get_order(order_id, current_user.restaurant_id)

@router.post("/{order_id}/items", response_model=OrderResponse)
async def add_order_item(
    order_id: int,
    item_in: OrderItemAdd,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = OrderService(db)
    order = await service.add_item(order_id, item_in, current_user.restaurant_id)
    await db.commit()
    return order

@router.patch("/{order_id}/items/{item_id}", response_model=OrderResponse)
async def update_order_item(
    order_id: int,
    item_id: int,
    item_in: OrderItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = OrderService(db)
    order = await service.update_item(order_id, item_id, item_in, current_user.restaurant_id)
    await db.commit()
    return order

@router.delete("/{order_id}/items/{item_id}", response_model=OrderResponse)
async def remove_order_item(
    order_id: int,
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = OrderService(db)
    order = await service.remove_item(order_id, item_id, current_user.restaurant_id)
    await db.commit()
    return order

@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    status_in: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = OrderService(db)
    order = await service.update_status(order_id, status_in.status, current_user.restaurant_id)
    await db.commit()
    return order
