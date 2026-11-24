from fastapi import APIRouter
from app.api.v1 import auth, tasks, schedule, context, events, wrapped, user, insights

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(tasks.router)
api_router.include_router(schedule.router)
api_router.include_router(context.router)
api_router.include_router(events.router)
api_router.include_router(wrapped.router)
api_router.include_router(user.router)
api_router.include_router(insights.router)
