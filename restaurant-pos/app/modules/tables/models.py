import datetime
from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Table(Base):
    __tablename__ = "tables"
    __table_args__ = (
        UniqueConstraint("restaurant_id", "table_number", name="uix_restaurant_table_number"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    restaurant_id: Mapped[int] = mapped_column(Integer, ForeignKey("restaurants.id"))
    table_number: Mapped[str] = mapped_column(String, nullable=False)
    seats: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    restaurant = relationship("Restaurant", back_populates="tables")
    orders = relationship("Order", back_populates="table")
