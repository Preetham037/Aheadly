from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid
import enum

class RecommendationType(str, enum.Enum):
    SCHEDULE = "SCHEDULE"
    FOCUS = "FOCUS"
    BREAK = "BREAK"

class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    content = Column(String, nullable=False)
    type = Column(Enum(RecommendationType), default=RecommendationType.SCHEDULE)
    
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
