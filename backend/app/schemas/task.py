from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    date: Optional[date] = None
    deadline: Optional[datetime] = None
    estimated_duration: int = Field(default=30, ge=5, le=1440)
    priority: str = Field(default="medium")
    is_fixed: bool = False
    fixed_start_time: Optional[datetime] = None
    preferred_time_of_day: Optional[str] = None
    location: Optional[str] = None
    is_outdoor: bool = False
    category: str = Field(default="other")
    tags: List[str] = []
    source: str = "manual"
    raw_input: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    date: Optional[date] = None
    deadline: Optional[datetime] = None
    estimated_duration: Optional[int] = Field(None, ge=5, le=1440)
    priority: Optional[str] = None
    is_fixed: Optional[bool] = None
    fixed_start_time: Optional[datetime] = None
    preferred_time_of_day: Optional[str] = None
    location: Optional[str] = None
    is_outdoor: Optional[bool] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None


class TaskStatusUpdate(BaseModel):
    status: str
    actual_duration: Optional[int] = None
    note: Optional[str] = None


class NaturalLanguageTaskInput(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    date: Optional[date] = None


class TaskResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    description: Optional[str]
    date: Optional[date]
    deadline: Optional[datetime]
    estimated_duration: int
    actual_duration: Optional[int]
    priority: str
    is_fixed: bool
    fixed_start_time: Optional[datetime]
    preferred_time_of_day: Optional[str]
    location: Optional[str]
    is_outdoor: bool
    category: str
    tags: List[str]
    status: str
    scheduled_start: Optional[datetime]
    scheduled_end: Optional[datetime]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    source: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
