from datetime import datetime, timedelta, timezone
from pathlib import Path
import os

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field

import database


# Load environment variables from backend-api/.env
ENV_FILE = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_FILE, override=True)

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"

security = HTTPBearer()
router = APIRouter()


# -------------------------
# Request schemas
# -------------------------

class RegisterSchema(BaseModel):
    organization_name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


# -------------------------
# JWT
# -------------------------

def create_access_token(data: dict):
    if not SECRET_KEY:
        raise RuntimeError(
            "JWT_SECRET_KEY is not configured. "
            "Please check the .env file in backend-api."
        )

    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(hours=24)

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    if not SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="JWT_SECRET_KEY is not configured",
        )

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        email = payload.get("sub")

        if not email:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token",
            )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token has expired. Please log in again.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    user = await database.get_user_by_email(email)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User account not found",
        )

    return dict(user)



# -------------------------
# Register
# -------------------------

@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
)
async def register(user: RegisterSchema):
    existing_user = await database.get_user_by_email(user.email)

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email already registered",
        )

    hashed_password = bcrypt.hashpw(
        user.password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")

    await database.create_user(
        email=user.email,
        password_hash=hashed_password,
        organization_name=user.organization_name.strip(),
    )

    return {
        "message": "Registration successful",
        "email": user.email,
        "role": "STAFF",
        "subscription": "Basic",
    }


# -------------------------
# Login
# -------------------------

@router.post("/login")
async def login(credentials: LoginSchema):
    user = await database.get_user_by_email(credentials.email)
    print("LOGIN EMAIL:", repr(credentials.email))
    print("USER FOUND:", user is not None)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    password_hash = user["password"]

    if not bcrypt.checkpw(
        credentials.password.encode("utf-8"),
        password_hash.encode("utf-8"),
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    token = create_access_token({
        "sub": user["email"],
    })

    await database.update_user_token(
        user["email"],
        token,
    )

    return {
        "token": token,
        "email": user["email"],
        "organization_name": user["organization_name"],
        "role": user["role"],
        "subscription": user["subscription"],
    }

# -------------------------
# Get Current User
# -------------------------

@router.get("/me")
async def get_me(
    current_user: dict = Depends(get_current_user),
):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "organization_name": current_user["organization_name"],
        "role": current_user["role"],
        "subscription": current_user["subscription"],
    }

async def require_admin(
    current_user: dict = Depends(get_current_user),
):
    if str(current_user.get("role", "")).upper() != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )

    return current_user
