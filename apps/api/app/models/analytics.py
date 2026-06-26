from sqlalchemy import Column, String, DateTime, Integer, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid

class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    date = Column(Date, index=True, nullable=False)
    
    completion_rate = Column(Float, default=0.0) # e.g. 85.5%
    focus_time_minutes = Column(Integer, default=0)
    burnout_indicator = Column(Float, default=0.0) # e.g. 0.0 to 1.0 (1.0 meaning high risk)
    
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="analytics")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
