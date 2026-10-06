from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqladmin import Admin
from app.core.config import settings
from app.core.database import engine
from app.core.admin import setup_admin

# Ensure all models are imported so SQLAlchemy registry can resolve string references
from app.modules.restaurants.models import Restaurant
from app.modules.users.models import User
from app.modules.categories.models import Category
from app.modules.products.models import Product
from app.modules.tables.models import Table
from app.modules.orders.models import Order, OrderItem
from app.modules.payments.models import Payment


from app.modules.auth.router import router as auth_router
from app.modules.categories.router import router as categories_router
from app.modules.products.router import router as products_router
from app.modules.tables.router import router as tables_router
from app.modules.orders.router import router as orders_router
from app.modules.payments.router import router as payments_router
from app.modules.reports.router import router as reports_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Restaurant POS system for Cashier",
    version="1.0.0",
)

admin = Admin(app, engine, title="POS Admin Panel")
setup_admin(admin)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "ishla"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(categories_router)
app.include_router(products_router)
app.include_router(tables_router)
app.include_router(orders_router)
app.include_router(payments_router)
app.include_router(reports_router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

