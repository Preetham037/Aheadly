from typing import Generator, AsyncGenerator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    # Bypass JWT Validation for Hackathon Demo
    # We will just fetch the first user in the database, or create a demo user if none exists
    result = await db.execute(select(User).limit(1))
    user = result.scalars().first()
    
    if not user:
        # Create a dummy user
        user = User(
            id="demo-user-123",
            email="demo@aheadly.app",
            full_name="Hackathon Judge"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
    return user
