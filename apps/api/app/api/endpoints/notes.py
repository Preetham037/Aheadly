from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.note import Note
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class NoteCreate(BaseModel):
    title: str
    content: str = ""

class NoteResponse(BaseModel):
    id: str
    title: str
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[NoteResponse])
async def read_notes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    result = await db.execute(select(Note).where(Note.user_id == current_user.id).order_by(Note.created_at.desc()))
    return result.scalars().all()

@router.post("/", response_model=NoteResponse)
async def create_note(
    note_in: NoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    note = Note(
        title=note_in.title,
        content=note_in.content,
        user_id=current_user.id
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note

@router.delete("/{id}")
async def delete_note(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    result = await db.execute(select(Note).where(Note.id == id, Note.user_id == current_user.id))
    note = result.scalars().first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    await db.delete(note)
    await db.commit()
    return {"message": "Note deleted"}
