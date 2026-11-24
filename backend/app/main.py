from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import api_router

# Import all models so Base knows about them
import app.models  # noqa


app = FastAPI(
    title="Gocha API",
    description="Personal Execution & Memory System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.on_event("startup")
async def startup():
    """Auto-create all tables on startup (dev convenience)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅  Gocha API ready — tables created")


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    if settings.APP_ENV == "development":
        return JSONResponse(status_code=500, content={"detail": str(exc), "trace": traceback.format_exc()})
    return JSONResponse(status_code=500, content={"detail": "Internal server error."})
