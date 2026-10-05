from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

