"""Earned Value Management (EVM) metrics."""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.budget import CostEntry, ProjectBudget
from app.models.issue import Issue
from app.models.milestone import Milestone, MilestoneStatus
from app.models.workflow import StatusCategory, WorkflowStatus


class EVMService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def calculate_evm(self, project_id: UUID) -> dict:
        """Calculate Earned Value Management metrics for a project.

        Returns standard EVM indicators:
        - BAC  (Budget at Completion)
        - PV   (Planned Value)
        - EV   (Earned Value)
        - AC   (Actual Cost)
        - SV   (Schedule Variance)
        - CV   (Cost Variance)
        - SPI  (Schedule Performance Index)
        - CPI  (Cost Performance Index)
        - EAC  (Estimate at Completion)
        - ETC  (Estimate to Complete)
        - VAC  (Variance at Completion)
        """

        # ── Budget at Completion (BAC) ────────────────────────────
        budget_query = select(ProjectBudget).where(
            ProjectBudget.project_id == project_id
        )
        budget_result = await self.session.execute(budget_query)
        budget = budget_result.scalar_one_or_none()
        bac = float(budget.total_budget) if budget else 0

        # ── Actual Cost (AC) ──────────────────────────────────────
        ac_query = select(
            func.coalesce(func.sum(CostEntry.amount), 0)
        ).where(CostEntry.project_id == project_id)
        ac = float(await self.session.scalar(ac_query) or 0)

        # ── Issue completion metrics ──────────────────────────────
        total_issues_query = select(func.count(Issue.id)).where(
            Issue.project_id == project_id,
            Issue.is_deleted == False,  # noqa: E712
        )
        total_issues = await self.session.scalar(total_issues_query) or 0

        done_query = (
            select(func.count(Issue.id))
            .join(WorkflowStatus, Issue.status_id == WorkflowStatus.id)
            .where(
                Issue.project_id == project_id,
                Issue.is_deleted == False,  # noqa: E712
                WorkflowStatus.category == StatusCategory.DONE,
            )
        )
        done_issues = await self.session.scalar(done_query) or 0

        pct_complete = (done_issues / total_issues) if total_issues > 0 else 0

        # ── Planned Value (PV) ────────────────────────────────────
        # Use milestone-based planned % if milestones exist, else
        # fallback to a linear assumption based on total milestones.
        milestone_query = select(
            func.count(Milestone.id).label("total"),
            func.count(
                func.nullif(
                    Milestone.status != MilestoneStatus.COMPLETED, True
                )
            ).label("completed"),
        ).where(
            Milestone.project_id == project_id,
            Milestone.is_deleted == False,  # noqa: E712
        )
        ms_result = await self.session.execute(milestone_query)
        ms_row = ms_result.one()
        total_milestones = ms_row.total or 0
        completed_milestones = ms_row.completed or 0

        if total_milestones > 0:
            planned_pct = completed_milestones / total_milestones
        else:
            # No milestones: assume 50% planned progress (mid-project)
            planned_pct = 0.5

        pv = bac * planned_pct

        # ── Earned Value (EV) ─────────────────────────────────────
        ev = bac * pct_complete

        # ── Derived indicators ────────────────────────────────────
        sv = ev - pv
        cv = ev - ac
        spi = (ev / pv) if pv > 0 else 0.0
        cpi = (ev / ac) if ac > 0 else 0.0
        eac = (bac / cpi) if cpi > 0 else bac
        etc = eac - ac
        vac = bac - eac

        # TCPI (To Complete Performance Index) = (BAC - EV) / (BAC - AC)
        remaining_budget = bac - ac
        tcpi = ((bac - ev) / remaining_budget) if remaining_budget > 0 else 0.0

        return {
            "project_id": str(project_id),
            "bac": round(bac, 2),
            "pv": round(pv, 2),
            "ev": round(ev, 2),
            "ac": round(ac, 2),
            "sv": round(sv, 2),
            "cv": round(cv, 2),
            "spi": round(spi, 3),
            "cpi": round(cpi, 3),
            "eac": round(eac, 2),
            "etc": round(etc, 2),
            "vac": round(vac, 2),
            "tcpi": round(tcpi, 3),
            "percent_complete": round(pct_complete * 100, 1),
            "planned_percent": round(planned_pct * 100, 1),
            "total_issues": total_issues,
            "done_issues": done_issues,
            "total_milestones": total_milestones,
            "completed_milestones": completed_milestones,
        }
