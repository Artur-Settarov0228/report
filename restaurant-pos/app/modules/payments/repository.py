from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Sequence
from app.modules.payments.models import Payment
from app.modules.payments.schemas import PaymentCreate
from app.shared.enums import PaymentStatus

class PaymentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, payment_id: int) -> Payment | None:
        result = await self.db.execute(select(Payment).where(Payment.id == payment_id))
        return result.scalars().first()

    async def get_payments_by_order(self, order_id: int) -> Sequence[Payment]:
        result = await self.db.execute(
            select(Payment).where(Payment.order_id == order_id)
        )
        return result.scalars().all()

    async def has_completed_payment(self, order_id: int) -> bool:
        result = await self.db.execute(
            select(Payment).where(
                Payment.order_id == order_id,
                Payment.status == PaymentStatus.COMPLETED
            )
        )
        return result.scalars().first() is not None

    async def create(self, payment_in: PaymentCreate, cashier_id: int) -> Payment:
        payment = Payment(
            order_id=payment_in.order_id,
            cashier_id=cashier_id,
            amount=payment_in.amount,
            method=payment_in.method,
            status=PaymentStatus.COMPLETED  # For MVP, assume it is immediately completed
        )
        self.db.add(payment)
        await self.db.flush()
        await self.db.refresh(payment)
        return payment
