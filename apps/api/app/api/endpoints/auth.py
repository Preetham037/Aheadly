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
import google_auth_oauthlib.flow
from fastapi.responses import RedirectResponse
import json
import base64

# Global store for OAuth PKCE verifiers (hackathon/demo environment only)
oauth_state_store = {}

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

def get_google_flow(state=None):
    client_config = {
        "web": {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [settings.GOOGLE_REDIRECT_URI],
        }
    }
    return google_auth_oauthlib.flow.Flow.from_client_config(
        client_config,
        scopes=settings.GOOGLE_SCOPES,
        state=state
    )

@router.get("/google/login")
async def google_login(current_user: User = Depends(get_current_user)):
    """Initiates Google OAuth flow to connect calendar for the logged in user."""
    flow = get_google_flow(state=current_user.id)
    flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent' # Force consent to ensure we get a refresh token
    )
    oauth_state_store[state] = flow.code_verifier
    return {"authorization_url": authorization_url}

@router.get("/google/login-flow")
async def google_login_flow():
    """Initiates Google OAuth flow from the login page (no auth required)."""
    # Use a dummy state for the hackathon
    flow = get_google_flow(state="demo_hackathon_login")
    flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'
    )
    oauth_state_store[state] = flow.code_verifier
    return RedirectResponse(url=authorization_url)

@router.get("/google/callback")
async def google_callback(state: str, code: str, db: AsyncSession = Depends(get_db)):
    """Handles Google OAuth callback and stores the refresh token."""
    flow = get_google_flow(state=state)
    flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
    
    verifier = None
    if state in oauth_state_store:
        verifier = oauth_state_store.pop(state)
        print(f"DEBUG: Found verifier in store for state {state}: {verifier}")
    else:
        print(f"DEBUG: No verifier found in store for state {state}. Current store keys: {list(oauth_state_store.keys())}")
        
    flow.fetch_token(code=code, code_verifier=verifier)
    credentials = flow.credentials
    
    # State contains the user ID we passed in /google/login, or 'demo_hackathon_login'
    user_id = state
    
    if user_id == "demo_hackathon_login":
        if credentials.id_token:
            parts = credentials.id_token.split(".")
            if len(parts) == 3:
                padded = parts[1] + '=' * (4 - len(parts[1]) % 4)
                id_info = json.loads(base64.urlsafe_b64decode(padded))
                full_name = id_info.get("name")
                if full_name:
                    res = await db.execute(select(User).where(User.email == "demo@aheadly.app"))
                    demo_user = res.scalars().first()
                    if demo_user:
                        demo_user.full_name = full_name
                        db.add(demo_user)
                        await db.commit()
        # Hackathon behavior: Just redirect them to the dashboard and we'll use demo-login there
        # Or redirect with a flag so the frontend knows they 'logged in' with Google
        return RedirectResponse(url="http://localhost:3000/dashboard?google_login=success")
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if credentials.refresh_token:
        user.google_refresh_token = credentials.refresh_token
        db.add(user)
        await db.commit()
        
    # Redirect back to frontend dashboard after success
    return RedirectResponse(url="http://localhost:3000/dashboard?google_connected=true")

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
