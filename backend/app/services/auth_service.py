import uuid
from datetime import datetime, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.app.core.config import settings
from backend.app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from backend.app.database.mongodb import get_db
from backend.app.schemas.auth import UserRegister, UserLogin

security = HTTPBearer()

class AuthService:
    @staticmethod
    async def register(user_in: UserRegister) -> dict:
        db = get_db()
        existing = await db["users"].find_one({"email": user_in.email.lower()})
        if existing:
            raise HTTPException(status_code=400, detail="User with this email already exists")

        # Company lookup or create
        company_name = user_in.company_name or "TechCorp AI"
        company = await db["companies"].find_one({"name": company_name})
        if not company:
            company_id = str(uuid.uuid4())
            await db["companies"].insert_one({
                "_id": company_id,
                "name": company_name,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        else:
            company_id = str(company["_id"])

        user_id = str(uuid.uuid4())
        hashed_pwd = get_password_hash(user_in.password)
        now_iso = datetime.now(timezone.utc).isoformat()

        user_doc = {
            "_id": user_id,
            "email": user_in.email.lower(),
            "full_name": user_in.full_name,
            "hashed_password": hashed_pwd,
            "role": user_in.role,
            "company_id": company_id,
            "company_name": company_name,
            "created_at": now_iso,
            "updated_at": now_iso
        }
        await db["users"].insert_one(user_doc)

        token = create_access_token({
            "sub": user_id,
            "role": user_in.role,
            "company_id": company_id,
            "email": user_in.email.lower()
        })

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "email": user_in.email.lower(),
                "full_name": user_in.full_name,
                "role": user_in.role,
                "company_id": company_id,
                "company_name": company_name,
                "created_at": now_iso
            }
        }

    @staticmethod
    async def login(login_in: UserLogin) -> dict:
        db = get_db()
        user = await db["users"].find_one({"email": login_in.email.lower()})
        if not user or not verify_password(login_in.password, user.get("hashed_password", "")):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        token = create_access_token({
            "sub": str(user["_id"]),
            "role": user.get("role", "recruiter"),
            "company_id": str(user.get("company_id")),
            "email": user["email"]
        })

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "full_name": user.get("full_name", "Recruiter"),
                "role": user.get("role", "recruiter"),
                "company_id": str(user.get("company_id")),
                "company_name": user.get("company_name", "TechCorp AI"),
                "created_at": user.get("created_at", "")
            }
        }

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    db = get_db()
    user = await db["users"].find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["id"] = str(user["_id"])
    return user

