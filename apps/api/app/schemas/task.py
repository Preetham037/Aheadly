from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.task import TaskPriority, TaskStatus

class SubtaskBase(BaseModel):
    title: str
    is_completed: bool = False

class SubtaskCreate(SubtaskBase):
    pass

class SubtaskResponse(SubtaskBase):
    id: str
    task_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.TODO
    estimated_duration_minutes: Optional[int] = None
    deadline: Optional[datetime] = None
    difficulty: Optional[str] = None
    category_id: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    estimated_duration_minutes: Optional[int] = None
    deadline: Optional[datetime] = None
    difficulty: Optional[str] = None
    category_id: Optional[str] = None

class TaskResponse(TaskBase):
    id: str
    user_id: str
    risk_score: Optional[float] = None
    suggested_schedule: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    subtasks: List[SubtaskResponse] = []
    
    class Config:
        from_attributes = True
