from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
import datetime
from decimal import Decimal

from app.modules.orders.models import Order, OrderItem
from app.modules.payments.models import Payment
from app.modules.tables.models import Table
from app.shared.enums import OrderStatus, PaymentMethod, PaymentStatus
from app.modules.reports.schemas import DashboardResponse, ReportResponse, PaymentBreakdown, TopProduct

class ReportService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_base_report(self, restaurant_id: int, start_date: datetime.datetime, end_date: datetime.datetime) -> ReportResponse:
        # Get all completed/paid orders in date range
        orders_query = select(Order).where(
            Order.restaurant_id == restaurant_id,
            Order.status.in_([OrderStatus.PAID, OrderStatus.COMPLETED]),
            Order.completed_at >= start_date,
            Order.completed_at <= end_date
        )
        orders_result = await self.db.execute(orders_query)
        orders = orders_result.scalars().all()
        
        total_orders = len(orders)
        order_ids = [o.id for o in orders]
        
        # Breakdown by payments
        payment_breakdown = {pm.value: Decimal('0.00') for pm in PaymentMethod}
        total_revenue = Decimal('0.00')
        
        if order_ids:
            payments_query = select(Payment.method, func.sum(Payment.amount)).where(
                Payment.order_id.in_(order_ids),
                Payment.status == PaymentStatus.COMPLETED
            ).group_by(Payment.method)
            
            payments_result = await self.db.execute(payments_query)
            
            for method, amount in payments_result.all():
                payment_breakdown[method.value] = amount
                total_revenue += amount

        average_value = total_revenue / total_orders if total_orders > 0 else Decimal('0.00')

        # Top products
        top_products = []
        if order_ids:
            products_query = select(
                OrderItem.product_name,
                func.sum(OrderItem.quantity).label("total_quantity"),
                func.sum(OrderItem.subtotal).label("total_revenue")
            ).where(
                OrderItem.order_id.in_(order_ids)
            ).group_by(
                OrderItem.product_name
            ).order_by(
                func.sum(OrderItem.quantity).desc()
            ).limit(5)
            
            products_result = await self.db.execute(products_query)
            for p_name, qty, rev in products_result.all():
                top_products.append(TopProduct(product_name=p_name, quantity=qty, revenue=rev))

        return ReportResponse(
            total_orders=total_orders,
            total_revenue=total_revenue,
            cash_revenue=payment_breakdown[PaymentMethod.CASH.value],
            card_revenue=payment_breakdown[PaymentMethod.CARD.value],
            click_revenue=payment_breakdown[PaymentMethod.CLICK.value],
            payme_revenue=payment_breakdown[PaymentMethod.PAYME.value],
            average_order_value=average_value,
            top_selling_products=top_products
        )

    async def get_dashboard(self, restaurant_id: int) -> DashboardResponse:
        now = datetime.datetime.utcnow()
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        report = await self._get_base_report(restaurant_id, start_of_day, now)
        
        # Additional dashboard metrics
        open_orders_query = select(func.count(Order.id)).where(
            Order.restaurant_id == restaurant_id,
            Order.status == OrderStatus.OPEN
        )
        open_orders_result = await self.db.execute(open_orders_query)
        open_orders_count = open_orders_result.scalar() or 0
        
        # Occupied tables: count distinct tables that have an OPEN order
        occupied_tables_query = select(func.count(func.distinct(Order.table_id))).where(
            Order.restaurant_id == restaurant_id,
            Order.status == OrderStatus.OPEN,
            Order.table_id.isnot(None)
        )
        occupied_tables_result = await self.db.execute(occupied_tables_query)
        occupied_tables_count = occupied_tables_result.scalar() or 0

        return DashboardResponse(
            revenue=report.total_revenue,
            orders_count=report.total_orders + open_orders_count,
            open_orders_count=open_orders_count,
            completed_orders_count=report.total_orders,
            occupied_tables_count=occupied_tables_count,
            payment_breakdown=PaymentBreakdown(
                CASH=report.cash_revenue,
                CARD=report.card_revenue,
                CLICK=report.click_revenue,
                PAYME=report.payme_revenue
            )
        )

    async def get_daily_report(self, restaurant_id: int) -> ReportResponse:
        now = datetime.datetime.utcnow()
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        return await self._get_base_report(restaurant_id, start, now)

    async def get_weekly_report(self, restaurant_id: int) -> ReportResponse:
        now = datetime.datetime.utcnow()
        start = (now - datetime.timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        return await self._get_base_report(restaurant_id, start, now)

    async def get_monthly_report(self, restaurant_id: int) -> ReportResponse:
        now = datetime.datetime.utcnow()
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        return await self._get_base_report(restaurant_id, start, now)
