from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db, get_current_user
from app.core.config import settings
from app.core.security import verify_password, create_access_token, get_password_hash
from app.models.user import User
from pydantic import BaseModel

router = APIRouter()

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str = None

@router.post("/login", response_model=Token)
async def login_access_token(
    db: AsyncSession = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/signup", response_model=Token)
async def signup(
    user_in: UserCreate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        full_name=user_in.full_name
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "full_name": current_user.full_name}

# Placeholder for Google OAuth
@router.post("/google")
async def google_auth():
    # Typically would receive an ID token from frontend, verify it using Google library,
    # find or create the user, and return a JWT access_token.
    return {"message": "Google OAuth endpoint placeholder. Please pass ID token."}

@router.post("/demo-login", response_model=Token)
async def demo_login(db: AsyncSession = Depends(get_db)):
    """
    Hackathon helper: Instantly logs in as a demo user without a password.
    Creates the demo user if it doesn't exist.
    """
    email = "demo@aheadly.app"
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    
    if not user:
        user = User(
            email=email,
            password_hash=get_password_hash("demo_password"),
            full_name="Demo User"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 24 * 7) # 1 week for demo
    return {
        "access_token": create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }
