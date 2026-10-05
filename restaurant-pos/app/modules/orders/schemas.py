from pydantic import BaseModel, Field
from decimal import Decimal
import datetime
from app.shared.enums import OrderStatus

class OrderCreate(BaseModel):
    table_id: int | None = None

class OrderItemAdd(BaseModel):
    product_id: int
    quantity: int = Field(gt=0, description="Quantity must be greater than 0")
    note: str | None = None

class OrderItemUpdate(BaseModel):
    quantity: int = Field(gt=0, description="Quantity must be greater than 0")
    note: str | None = None

class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    product_id: int | None
    product_name: str
    unit_price: Decimal
    quantity: int
    subtotal: Decimal
    note: str | None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    restaurant_id: int
    table_id: int | None
    cashier_id: int
    status: OrderStatus
    total_amount: Decimal
    created_at: datetime.datetime
    updated_at: datetime.datetime
    completed_at: datetime.datetime | None
    items: list[OrderItemResponse] = []

    class Config:
        from_attributes = True
