from fastapi import APIRouter, Depends
from backend.app.schemas.analytics import DashboardAnalyticsResponse
from backend.app.services.analytics_service import AnalyticsService
from backend.app.services.auth_service import get_current_user

router = APIRouter(prefix="/analytics", tags=["Recruitment Analytics"])

@router.get("/dashboard", response_model=DashboardAnalyticsResponse)
async def get_dashboard_metrics(current_user: dict = Depends(get_current_user)):
    return await AnalyticsService.get_dashboard_analytics(current_user)

