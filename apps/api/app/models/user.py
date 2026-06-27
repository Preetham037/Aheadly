from sqlalchemy import Column, String, Boolean, DateTime, Integer, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True) # Nullable for OAuth users
    full_name = Column(String, nullable=True)
    google_id = Column(String, unique=True, index=True, nullable=True)
    google_refresh_token = Column(String, nullable=True)  # Stores OAuth refresh token
    
    productivity_score = Column(Float, default=0.0)
    streak_days = Column(Integer, default=0)
    last_completed_date = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tasks = relationship("Task", back_populates="owner", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="owner", cascade="all, delete-orphan")
    calendar_events = relationship("CalendarEvent", back_populates="owner", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="owner", cascade="all, delete-orphan")
    analytics = relationship("Analytics", back_populates="owner", cascade="all, delete-orphan")
    chat_history = relationship("ChatHistory", back_populates="owner", cascade="all, delete-orphan")
