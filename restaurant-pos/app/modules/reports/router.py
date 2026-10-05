from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.reports.schemas import DashboardResponse, ReportResponse
from app.modules.reports.service import ReportService

router = APIRouter(prefix="/api/v1", tags=["reports & dashboard"])

@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ReportService(db)
    return await service.get_dashboard(current_user.restaurant_id)

@router.get("/reports/daily", response_model=ReportResponse)
async def get_daily_report(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ReportService(db)
    return await service.get_daily_report(current_user.restaurant_id)

@router.get("/reports/weekly", response_model=ReportResponse)
async def get_weekly_report(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ReportService(db)
    return await service.get_weekly_report(current_user.restaurant_id)

@router.get("/reports/monthly", response_model=ReportResponse)
async def get_monthly_report(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ReportService(db)
    return await service.get_monthly_report(current_user.restaurant_id)
