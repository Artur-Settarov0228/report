import datetime
from decimal import Decimal
from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey, Numeric, Enum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.shared.enums import Unit

class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        UniqueConstraint("restaurant_id", "sku", name="uix_restaurant_product_sku"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    restaurant_id: Mapped[int] = mapped_column(Integer, ForeignKey("restaurants.id"), index=True)
    category_id: Mapped[int] = mapped_column(Integer, ForeignKey("categories.id"), index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    sku: Mapped[str] = mapped_column(String, nullable=False, index=True)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    unit: Mapped[Unit] = mapped_column(Enum(Unit), default=Unit.PIECE)
    image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    restaurant = relationship("Restaurant", back_populates="products")
    category = relationship("Category", back_populates="products")
