from pydantic import BaseModel, Field
from decimal import Decimal
import datetime
from app.shared.enums import PaymentMethod, PaymentStatus

class PaymentCreate(BaseModel):
    order_id: int
    amount: Decimal = Field(gt=0)
    method: PaymentMethod

class PaymentResponse(BaseModel):
    id: int
    order_id: int
    cashier_id: int
    amount: Decimal
    method: PaymentMethod
    status: PaymentStatus
    transaction_reference: str | None
    created_at: datetime.datetime

    class Config:
        from_attributes = True
