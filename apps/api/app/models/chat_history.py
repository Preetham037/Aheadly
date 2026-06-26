from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid
import enum

class ChatRole(str, enum.Enum):
    USER = "USER"
    AI = "AI"

class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    message = Column(String, nullable=False)
    role = Column(Enum(ChatRole), nullable=False)
    
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="chat_history")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
