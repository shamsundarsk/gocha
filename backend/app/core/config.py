from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    APP_NAME: str = "Gocha"
    APP_ENV: str = "development"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/gocha_db"
    SYNC_DATABASE_URL: str = "postgresql://user:password@localhost:5432/gocha_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # External APIs
    OPENWEATHER_API_KEY: Optional[str] = None
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    ELEVENLABS_API_KEY: Optional[str] = None
    ELEVENLABS_VOICE_ID: Optional[str] = None

    # AWS
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "ap-south-1"
    S3_BUCKET_NAME: str = "gocha-media"

    # Event Sources
    EVENTBRITE_API_KEY: Optional[str] = None
    TICKETMASTER_API_KEY: Optional[str] = None

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:8081"

    # Demo Mode
    DEMO_MODE: bool = False

    @property
    def cors_origins(self) -> List[str]:
        if self.APP_ENV == "development":
            return ["*"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
