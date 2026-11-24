from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from datetime import date, datetime
import uuid

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.task import Task, TaskHistory, TaskStatus
from app.schemas.task import TaskCreate, TaskUpdate, TaskStatusUpdate, TaskResponse, NaturalLanguageTaskInput
from app.services.task_parser import parse_natural_language_tasks

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=List[TaskResponse])
async def list_tasks(
    task_date: Optional[date] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(Task).where(Task.user_id == current_user.id)
    if task_date:
        q = q.where(Task.date == task_date)
    if status:
        q = q.where(Task.status == status)
    q = q.order_by(Task.created_at.desc())
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/", response_model=TaskResponse, status_code=201)
async def create_task(
    data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = Task(user_id=current_user.id, **data.model_dump())
    db.add(task)
    await db.flush()

    history = TaskHistory(
        task_id=task.id,
        user_id=current_user.id,
        action="created",
        old_status=None,
        new_status=task.status,
    )
    db.add(history)
    return task


@router.post("/parse", response_model=List[TaskResponse], status_code=201)
async def parse_and_create_tasks(
    data: NaturalLanguageTaskInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Parse natural language into structured tasks and create them."""
    parsed = parse_natural_language_tasks(data.text, data.date)
    created = []
    for task_data in parsed:
        task = Task(user_id=current_user.id, **task_data)
        db.add(task)
        await db.flush()
        created.append(task)

    return created


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Task).where(and_(Task.id == task_id, Task.user_id == current_user.id))
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: uuid.UUID,
    data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Task).where(and_(Task.id == task_id, Task.user_id == current_user.id))
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(task, field, value)
    task.updated_at = datetime.utcnow()
    return task


@router.patch("/{task_id}/status", response_model=TaskResponse)
async def update_task_status(
    task_id: uuid.UUID,
    data: TaskStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Task).where(and_(Task.id == task_id, Task.user_id == current_user.id))
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    old_status = task.status
    task.status = data.status
    task.updated_at = datetime.utcnow()

    if data.status == TaskStatus.IN_PROGRESS and not task.started_at:
        task.started_at = datetime.utcnow()
    elif data.status == TaskStatus.COMPLETED:
        task.completed_at = datetime.utcnow()
        if data.actual_duration:
            task.actual_duration = data.actual_duration

    history = TaskHistory(
        task_id=task.id,
        user_id=current_user.id,
        action=f"status_changed_to_{data.status}",
        old_status=old_status,
        new_status=data.status,
        note=data.note,
    )
    db.add(history)
    return task


@router.delete("/{task_id}", status_code=204)
async def delete_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Task).where(and_(Task.id == task_id, Task.user_id == current_user.id))
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    await db.delete(task)
