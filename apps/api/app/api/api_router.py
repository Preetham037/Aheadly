from fastapi import APIRouter
from app.api.endpoints import auth, tasks, ai, notes

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(notes.router, prefix="/notes", tags=["notes"])
