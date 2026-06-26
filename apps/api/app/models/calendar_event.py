from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid

class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    google_event_id = Column(String, unique=True, index=True, nullable=True)
    
    title = Column(String, nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="calendar_events")
    
    task_id = Column(String, ForeignKey("tasks.id"), nullable=True)
    task = relationship("Task", back_populates="calendar_events")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
