import structlog

from app.core.database import async_session_factory
from app.services.recurring import RecurringService

logger = structlog.get_logger()


async def process_recurring_tasks(ctx: dict) -> int:
    """Cron task: load due recurring rules, create issues, and advance next_due."""
    logger.info("process_recurring_tasks_started")

    async with async_session_factory() as session:
        try:
            service = RecurringService(session)
            created_count = await service.process_due_rules()
            await session.commit()
            logger.info(
                "process_recurring_tasks_completed",
                created_count=created_count,
            )
            return created_count
        except Exception:
            await session.rollback()
            logger.exception("process_recurring_tasks_failed")
            raise
