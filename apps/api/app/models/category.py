from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid

class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    color = Column(String, default="#000000")
    
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="categories")
    
    tasks = relationship("Task", back_populates="category")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
