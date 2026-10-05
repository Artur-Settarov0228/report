from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update
import datetime

from app.modules.payments.schemas import PaymentCreate
from app.modules.payments.models import Payment
from app.modules.payments.repository import PaymentRepository
from app.modules.orders.repository import OrderRepository
from app.modules.orders.models import Order
from app.shared.enums import OrderStatus

class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = PaymentRepository(db)
        self.order_repo = OrderRepository(db)

    async def process_payment(self, payment_in: PaymentCreate, restaurant_id: int, cashier_id: int) -> Payment:
        # 1. Check order exists and belongs to this restaurant
        order = await self.order_repo.get_by_id(payment_in.order_id, restaurant_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
            
        # 2. Check order is OPEN
        if order.status != OrderStatus.OPEN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Cannot pay for order that is {order.status}"
            )
            
        # 3. Check duplicate payment
        has_payment = await self.repo.has_completed_payment(order.id)
        if has_payment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order is already paid"
            )
            
        # 4. Check amount match (For MVP we don't allow partial payments yet)
        if payment_in.amount != order.total_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment amount ({payment_in.amount}) does not match order total ({order.total_amount})"
            )
            
        # 5. Create payment
        payment = await self.repo.create(payment_in, cashier_id)
        
        # 6. Mark order as PAID/COMPLETED
        await self.db.execute(
            update(Order).where(Order.id == order.id).values(
                status=OrderStatus.PAID,
                completed_at=datetime.datetime.utcnow()
            )
        )
        
        return payment
