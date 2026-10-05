import datetime
from decimal import Decimal
from sqlalchemy import Integer, String, DateTime, ForeignKey, Numeric, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.shared.enums import OrderStatus

class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    restaurant_id: Mapped[int] = mapped_column(Integer, ForeignKey("restaurants.id"), index=True)
    table_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("tables.id"), index=True, nullable=True)
    cashier_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.OPEN, index=True)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal('0.00'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    completed_at: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    restaurant = relationship("Restaurant", back_populates="orders")
    table = relationship("Table", back_populates="orders")
    cashier = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(Integer, ForeignKey("orders.id"), index=True)
    product_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("products.id"), nullable=True)
    product_name: Mapped[str] = mapped_column(String, nullable=False) # Historical snapshot
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False) # Historical snapshot
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    note: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product")
