from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid
import enum

class NotificationType(str, enum.Enum):
    REMINDER = "REMINDER"
    URGENT = "URGENT"
    AI_SUGGESTION = "AI_SUGGESTION"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    message = Column(String, nullable=False)
    type = Column(Enum(NotificationType), default=NotificationType.REMINDER)
    is_read = Column(Boolean, default=False)
    scheduled_for = Column(DateTime(timezone=True), nullable=True)
    
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="notifications")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
