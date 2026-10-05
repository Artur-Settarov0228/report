from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.payments.schemas import PaymentCreate, PaymentResponse
from app.modules.payments.service import PaymentService

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])

@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    payment_in: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = PaymentService(db)
    payment = await service.process_payment(payment_in, current_user.restaurant_id, current_user.id)
    await db.commit()
    return payment

from typing import List
from fastapi import Query

@router.get("", response_model=List[PaymentResponse])
async def get_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = PaymentService(db)
    return await service.get_payments(current_user.restaurant_id, skip, limit)
