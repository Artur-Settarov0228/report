import datetime
from decimal import Decimal
from sqlalchemy import Integer, String, DateTime, ForeignKey, Numeric, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.shared.enums import PaymentMethod, PaymentStatus

class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(Integer, ForeignKey("orders.id"), index=True)
    cashier_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    method: Mapped[PaymentMethod] = mapped_column(Enum(PaymentMethod), nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.COMPLETED)
    transaction_reference: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow, index=True)

    # Relationships
    order = relationship("Order", back_populates="payments")
    cashier = relationship("User", back_populates="payments")
