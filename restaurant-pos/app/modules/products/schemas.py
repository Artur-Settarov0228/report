from pydantic import BaseModel, Field
from decimal import Decimal
import datetime
from app.shared.enums import Unit

class ProductBase(BaseModel):
    name: str
    category_id: int
    sku: str
    price: Decimal = Field(gt=0, description="Price must be greater than 0")
    unit: Unit = Unit.PIECE
    image_url: str | None = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: str | None = None
    category_id: int | None = None
    sku: str | None = None
    price: Decimal | None = Field(None, gt=0)
    unit: Unit | None = None
    image_url: str | None = None
    is_active: bool | None = None

class ProductResponse(ProductBase):
    id: int
    restaurant_id: int
    is_active: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True
