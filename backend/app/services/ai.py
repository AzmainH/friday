from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundException, ValidationException
from app.repositories.issue_extras import TaskStatusRepository

VALID_TASK_TYPES = {"smart_schedule", "risk_prediction", "summarize"}

TASK_TYPE_TO_FUNCTION = {
    "smart_schedule": "ai_smart_schedule",
    "risk_prediction": "ai_risk_prediction",
    "summarize": "ai_summarize",
}


class AIService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.task_repo = TaskStatusRepository(session)

    async def trigger_task(
        self, project_id: UUID, task_type: str, user_id: UUID
    ) -> dict:
        """Create a TaskStatus entry and enqueue the corresponding ARQ task."""
        if task_type not in VALID_TASK_TYPES:
            raise ValidationException(
                f"Invalid task_type '{task_type}'. "
                f"Must be one of: {', '.join(sorted(VALID_TASK_TYPES))}"
            )

        # Create TaskStatus record to track the background job
        task_status = await self.task_repo.create(
            {
                "task_type": f"ai_{task_type}",
                "entity_id": project_id,
                "user_id": user_id,
                "status": "pending",
                "progress_pct": 0,
            }
        )

        # Enqueue the ARQ task
        from arq.connections import ArqRedis, create_pool

        from app.worker import get_redis_settings

        redis: ArqRedis = await create_pool(get_redis_settings())
        function_name = TASK_TYPE_TO_FUNCTION[task_type]
        await redis.enqueue_job(
            function_name,
            str(project_id),
            str(task_status.id),
        )
        await redis.close()

        return {
            "task_id": task_status.id,
            "status": task_status.status,
            "message": f"AI {task_type} task enqueued successfully",
        }

    async def get_task_status(self, task_id: UUID) -> object:
        """Retrieve a TaskStatus by ID."""
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise NotFoundException("AI task not found")
        return task
