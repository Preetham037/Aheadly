from sqlalchemy import Column, String, Boolean, DateTime, Integer, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid
import enum

class TaskPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class TaskStatus(str, enum.Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIUM)
    status = Column(Enum(TaskStatus), default=TaskStatus.TODO)
    
    # AI Extracted or User Input
    estimated_duration_minutes = Column(Integer, nullable=True)
    deadline = Column(DateTime(timezone=True), nullable=True)
    difficulty = Column(String, nullable=True)
    risk_score = Column(Float, nullable=True) # e.g., 0.0 to 1.0 indicating chance of missing deadline
    suggested_schedule = Column(DateTime(timezone=True), nullable=True) # AI suggested time to do this
    
    # Relationships
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="tasks")
    
    category_id = Column(String, ForeignKey("categories.id"), nullable=True)
    category = relationship("Category", back_populates="tasks")
    
    subtasks = relationship("Subtask", back_populates="parent_task", cascade="all, delete-orphan", lazy="selectin")
    calendar_events = relationship("CalendarEvent", back_populates="task", lazy="selectin")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Subtask(Base):
    __tablename__ = "subtasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    is_completed = Column(Boolean, default=False)
    
    task_id = Column(String, ForeignKey("tasks.id"), nullable=False)
    parent_task = relationship("Task", back_populates="subtasks")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
