from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime, timezone, timedelta

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.task import Task, TaskStatus
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate

router = APIRouter()

@router.get("/", response_model=List[TaskResponse])
async def read_tasks(
    skip: int = 0, limit: int = 100, 
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Task).where(Task.user_id == current_user.id).offset(skip).limit(limit)
    )
    return result.scalars().all()

@router.post("/", response_model=TaskResponse)
async def create_task(
    task_in: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    task = Task(**task_in.model_dump(), user_id=current_user.id)
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task

@router.get("/{task_id}", response_model=TaskResponse)
async def read_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_in: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_in.model_dump(exclude_unset=True)
    
    # --- Streak computation ---
    if update_data.get("status") == TaskStatus.DONE and task.status != TaskStatus.DONE:
        now = datetime.now(timezone.utc)
        today = now.date()
        last = current_user.last_completed_date
        if last is None:
            current_user.streak_days = 1
        else:
            last_date = last.date()
            if last_date == today:
                pass  # Already counted today
            elif last_date == today - timedelta(days=1):
                current_user.streak_days = (current_user.streak_days or 0) + 1
            else:
                current_user.streak_days = 1  # Streak broken — restart
        current_user.last_completed_date = now
        db.add(current_user)
    # -------------------------

    for field, value in update_data.items():
        setattr(task, field, value)
        
    await db.commit()
    await db.refresh(task)
    return task


@router.get("/stats/me")
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns live productivity stats including streak for the dashboard."""
    result = await db.execute(
        select(Task).where(Task.user_id == current_user.id)
    )
    all_tasks = result.scalars().all()
    total = len(all_tasks)
    completed = sum(1 for t in all_tasks if t.status == TaskStatus.DONE)
    score = round((completed / total) * 100) if total > 0 else 0

    # Reset streak if last completion was more than 1 day ago
    streak = current_user.streak_days or 0
    if current_user.last_completed_date:
        last_date = current_user.last_completed_date.date()
        today = datetime.now(timezone.utc).date()
        if last_date < today - timedelta(days=1):
            streak = 0
            current_user.streak_days = 0
            db.add(current_user)
            await db.commit()

    return {
        "streak_days": streak,
        "productivity_score": score,
        "total_tasks": total,
        "completed_tasks": completed,
        "pending_tasks": total - completed,
    }

@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await db.delete(task)
    await db.commit()
    return {"status": "success"}
