from fastapi import APIRouter, Depends, Body
from pydantic import BaseModel
from typing import Optional
from backend.app.core.config import settings
from backend.app.services.auth_service import get_current_user

router = APIRouter(prefix="/settings", tags=["System Settings"])

class SettingsUpdate(BaseModel):
    llm_provider: Optional[str] = None
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    demo_mode: Optional[bool] = None

@router.get("")
async def get_system_settings(current_user: dict = Depends(get_current_user)):
    return {
        "llm_provider": settings.LLM_PROVIDER,
        "has_gemini_key": bool(settings.GEMINI_API_KEY),
        "has_openai_key": bool(settings.OPENAI_API_KEY),
        "embedding_model": settings.EMBEDDING_MODEL_NAME,
        "demo_mode": settings.DEMO_MODE,
        "company_name": current_user.get("company_name", "TechCorp AI"),
        "company_id": current_user.get("company_id")
    }

@router.post("")
async def update_system_settings(
    update_in: SettingsUpdate,
    current_user: dict = Depends(get_current_user)
):
    if update_in.llm_provider is not None:
        settings.LLM_PROVIDER = update_in.llm_provider
    if update_in.gemini_api_key is not None:
        settings.GEMINI_API_KEY = update_in.gemini_api_key
    if update_in.openai_api_key is not None:
        settings.OPENAI_API_KEY = update_in.openai_api_key
    if update_in.demo_mode is not None:
        settings.DEMO_MODE = update_in.demo_mode

    return {
        "success": True,
        "message": "Settings updated successfully",
        "current_provider": settings.LLM_PROVIDER,
        "demo_mode": settings.DEMO_MODE
    }

