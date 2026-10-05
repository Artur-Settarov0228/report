from pydantic import BaseModel
from decimal import Decimal

class PaymentBreakdown(BaseModel):
    CASH: Decimal = Decimal('0.00')
    CARD: Decimal = Decimal('0.00')
    CLICK: Decimal = Decimal('0.00')
    PAYME: Decimal = Decimal('0.00')

class TopProduct(BaseModel):
    product_name: str
    quantity: int
    revenue: Decimal

class DashboardResponse(BaseModel):
    revenue: Decimal
    orders_count: int
    open_orders_count: int
    completed_orders_count: int
    occupied_tables_count: int
    payment_breakdown: PaymentBreakdown

class ReportResponse(BaseModel):
    total_orders: int
    total_revenue: Decimal
    cash_revenue: Decimal
    card_revenue: Decimal
    click_revenue: Decimal
    payme_revenue: Decimal
    average_order_value: Decimal
    top_selling_products: list[TopProduct]
