from sqlalchemy import Column, String, Text, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base
import uuid


DEFAULT_MODES = ["work", "friends", "todo"]

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role_model_description = Column(Text, nullable=True)
    enabled_modes = Column(JSON, nullable=False, default=DEFAULT_MODES)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Conversion(Base):
    __tablename__ = "conversions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    source = Column(String, nullable=False, default="convert")  # convert | learn
    category = Column(String, nullable=False)
    sub_category = Column(String, nullable=True)
    korean_input = Column(Text, nullable=True)       # null for learn entries
    outputs = Column(JSON, nullable=False)           # [{expression, situation_label, explanation}]
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ReviewDismissal(Base):
    __tablename__ = "review_dismissals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    conversion_id = Column(UUID(as_uuid=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
