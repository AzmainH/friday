import structlog

from app.core.database import async_session_factory
from app.services.sla import SLAService

logger = structlog.get_logger()


async def check_sla_breaches(ctx: dict) -> int:
    """Cron task: check all active SLA statuses for deadline breaches."""
    logger.info("check_sla_breaches_started")

    async with async_session_factory() as session:
        try:
            service = SLAService(session)
            breach_count = await service.check_breaches()
            await session.commit()
            logger.info(
                "check_sla_breaches_completed",
                breach_count=breach_count,
            )
            return breach_count
        except Exception:
            await session.rollback()
            logger.exception("check_sla_breaches_failed")
            raise
