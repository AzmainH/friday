from uuid import UUID

from arq.connections import ArqRedis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundException
from app.models.schedule import ScheduleRun, ScheduleRunStatus


class SchedulingService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def trigger_schedule(
        self,
        project_id: UUID,
        user_id: UUID,
        arq_pool: ArqRedis,
    ) -> UUID:
        """Create a new ScheduleRun and enqueue the ARQ task.

        Returns the run_id of the newly created ScheduleRun.
        """
        run = ScheduleRun(
            project_id=project_id,
            triggered_by=user_id,
            status=ScheduleRunStatus.pending,
        )
        self.session.add(run)
        await self.session.flush()

        run_id = run.id

        await arq_pool.enqueue_job(
            "run_auto_schedule",
            str(run_id),
            str(project_id),
        )

        return run_id

    async def get_run(self, run_id: UUID) -> ScheduleRun:
        """Retrieve a single schedule run by ID."""
        run = await self.session.get(ScheduleRun, run_id)
        if not run:
            raise NotFoundException("Schedule run not found")
        return run

    async def list_runs(self, project_id: UUID) -> list[ScheduleRun]:
        """List all schedule runs for a project, most recent first."""
        result = await self.session.execute(
            select(ScheduleRun)
            .where(ScheduleRun.project_id == project_id)
            .order_by(ScheduleRun.created_at.desc())
        )
        return list(result.scalars().all())
