from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.ai import AITaskResponse
from app.schemas.issue_extras import TaskStatusResponse
from app.services.ai import AIService

router = APIRouter(tags=["ai"])


@router.post(
    "/projects/{project_id}/ai/{task_type}",
    response_model=AITaskResponse,
    status_code=202,
)
async def trigger_ai_task(
    project_id: UUID,
    task_type: str,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Trigger an AI background task for a project.

    Supported task_type values: smart_schedule, risk_prediction, summarize.
    Returns a task_id that can be polled for status.
    """
    service = AIService(session)
    result = await service.trigger_task(project_id, task_type, user_id)
    return AITaskResponse(
        task_id=result["task_id"],
        status=result["status"],
        message=result["message"],
    )


@router.get(
    "/ai/tasks/{task_id}",
    response_model=TaskStatusResponse,
)
async def get_ai_task_status(
    task_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    """Poll the status of an AI background task."""
    service = AIService(session)
    return await service.get_task_status(task_id)
