from fastapi import APIRouter, Depends
from backend.app.schemas.auth import UserRegister, UserLogin, Token, UserResponse
from backend.app.services.auth_service import AuthService, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
async def register(user_in: UserRegister):
    return await AuthService.register(user_in)

@router.post("/login", response_model=Token)
async def login(login_in: UserLogin):
    return await AuthService.login(login_in)

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "full_name": current_user.get("full_name", ""),
        "role": current_user.get("role", "recruiter"),
        "company_id": current_user["company_id"],
        "company_name": current_user.get("company_name", "TechCorp AI"),
        "created_at": current_user.get("created_at", "")
    }

