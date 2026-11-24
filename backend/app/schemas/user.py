from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=1, max_length=255)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    full_name: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PreferencesUpdate(BaseModel):
    wake_time: Optional[str] = None
    sleep_time: Optional[str] = None
    work_start: Optional[str] = None
    work_end: Optional[str] = None
    interests: Optional[List[str]] = None
    notification_style: Optional[str] = None
    notification_cooldown_minutes: Optional[int] = None
    calendar_connected: Optional[bool] = None
    calendar_provider: Optional[str] = None
    fitness_connected: Optional[bool] = None
    fitness_provider: Optional[str] = None
    location_enabled: Optional[bool] = None
    photos_enabled: Optional[bool] = None
    screen_time_enabled: Optional[bool] = None
    event_discovery_radius_km: Optional[int] = None
    timezone: Optional[str] = None
    demo_mode: Optional[bool] = None


class PreferencesResponse(BaseModel):
    wake_time: str
    sleep_time: str
    work_start: str
    work_end: str
    interests: List[str] = []
    notification_style: str
    notification_cooldown_minutes: int
    calendar_connected: bool
    calendar_provider: Optional[str] = None
    fitness_connected: bool
    fitness_provider: Optional[str] = None
    location_enabled: bool
    photos_enabled: bool
    screen_time_enabled: bool
    event_discovery_radius_km: int
    timezone: str
    demo_mode: bool

    class Config:
        from_attributes = True
