from pydantic import BaseModel
import datetime
from app.shared.enums import TableStatus

class TableBase(BaseModel):
    table_number: str
    seats: int | None = None

class TableCreate(TableBase):
    pass

class TableUpdate(BaseModel):
    table_number: str | None = None
    seats: int | None = None
    is_active: bool | None = None

class TableResponse(TableBase):
    id: int
    restaurant_id: int
    is_active: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class TableStatusResponse(TableResponse):
    status: TableStatus
