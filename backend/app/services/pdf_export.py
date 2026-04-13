"""PDF export and executive reporting service.

Generates executive PDF reports with RAG status, EVM metrics,
AI-generated summaries, risk highlights, and milestone forecasts.
"""

from __future__ import annotations

import os
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Literal
from uuid import UUID

import structlog
from jinja2 import Environment, FileSystemLoader
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
try:
    from weasyprint import HTML as WeasyHTML

    _HAS_WEASYPRINT = True
except ImportError:
    _HAS_WEASYPRINT = False

from app.core.errors import NotFoundException
from app.models.issue import Issue
from app.models.milestone import Milestone, MilestoneStatus
from app.models.project import Project
from app.models.risk import Risk, RiskStatus
from app.models.workflow import StatusCategory, WorkflowStatus
from app.models.workspace import Workspace
from app.services.ai import AIService
from app.services.evm import EVMService

logger = structlog.get_logger(__name__)

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"


def _get_jinja_env() -> Environment:
    """Create a Jinja2 environment pointing at the templates directory."""
    return Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=True,
    )


class PDFExportService:
    """Generates executive and portfolio PDF reports."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.jinja_env = _get_jinja_env()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def generate_exec_report(
        self,
        project_id: UUID,
        period: str = "week",
    ) -> bytes:
        """Generate an executive PDF report and return raw bytes."""
        html = await self.get_report_html(project_id, period)
        if _HAS_WEASYPRINT:
            pdf_bytes: bytes = WeasyHTML(string=html).write_pdf()
            logger.info("exec_report_generated", project_id=str(project_id), period=period)
            return pdf_bytes
        logger.info("exec_report_generated_html_fallback", project_id=str(project_id))
        return html.encode("utf-8")

    async def get_report_html(
        self,
        project_id: UUID,
        period: str = "week",
    ) -> str:
        """Render the executive report as HTML (useful for previews)."""
        project = await self._get_project(project_id)

        # Gather data in parallel-friendly fashion
        evm_data = await EVMService(self.session).calculate_evm(project_id)
        issues = await self._get_project_issues(project_id)
        risks = await self._get_active_risks(project_id)
        milestones = await self._get_milestones(project_id)
        blockers = self._get_blockers(issues)

        # Compute RAG
        rag = self.compute_rag_status(evm_data, issues, risks, milestones)

        # AI summary bullets
        ai_bullets = await self._get_ai_summary(project_id)

        # Upcoming milestones (not completed, sorted by due date)
        upcoming = [
            m
            for m in milestones
            if m.status != MilestoneStatus.COMPLETED
        ]
        upcoming.sort(key=lambda m: m.due_date or date.max)

        # Top risks (highest risk_score first)
        top_risks = sorted(risks, key=lambda r: r.risk_score, reverse=True)[:3]

        # Forecast end date (simple: if SPI > 0 and target_end_date set)
        forecast_end = self._forecast_end_date(project, evm_data)

        template = self.jinja_env.get_template("exec_report.html")
        return template.render(
            project=project,
            generated_at=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
            period=period,
            rag=rag,
            evm=evm_data,
            pct_complete=evm_data.get("percent_complete", 0),
            forecast_end=forecast_end,
            ai_bullets=ai_bullets,
            top_risks=top_risks,
            upcoming_milestones=upcoming[:5],
            blockers=blockers,
            blocker_count=len(blockers),
        )

    async def generate_portfolio_report(
        self,
        workspace_id: UUID,
    ) -> bytes:
        """Generate a multi-project portfolio PDF for a workspace."""
        workspace = await self._get_workspace(workspace_id)
        projects = await self._get_workspace_projects(workspace_id)

        project_cards: list[dict[str, Any]] = []
        for proj in projects:
            evm_data = await EVMService(self.session).calculate_evm(proj.id)
            issues = await self._get_project_issues(proj.id)
            risks = await self._get_active_risks(proj.id)
            milestones = await self._get_milestones(proj.id)
            rag = self.compute_rag_status(evm_data, issues, risks, milestones)
            top_risk = sorted(risks, key=lambda r: r.risk_score, reverse=True)[:1]
            forecast_end = self._forecast_end_date(proj, evm_data)

            project_cards.append({
                "name": proj.name,
                "rag": rag,
                "pct_complete": evm_data.get("percent_complete", 0),
                "forecast_end": forecast_end,
                "top_risk": top_risk[0].title if top_risk else "None identified",
            })

        template = self.jinja_env.get_template("portfolio_report.html")
        html = template.render(
            workspace=workspace,
            generated_at=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
            project_cards=project_cards,
        )
        if _HAS_WEASYPRINT:
            pdf_bytes: bytes = WeasyHTML(string=html).write_pdf()
            logger.info(
                "portfolio_report_generated",
                workspace_id=str(workspace_id),
                project_count=len(project_cards),
            )
            return pdf_bytes
        logger.info(
            "portfolio_report_generated_html_fallback",
            workspace_id=str(workspace_id),
        )
        return html.encode("utf-8")

    # ------------------------------------------------------------------
    # RAG computation
    # ------------------------------------------------------------------

    def compute_rag_status(
        self,
        evm_data: dict,
        issues: list,
        risks: list,
        milestones: list | None = None,
    ) -> dict:
        """Compute RAG status automatically from project metrics.

        GREEN: SPI >= 0.9, no critical blockers, no overdue milestones
        AMBER: SPI 0.7-0.9 OR 1-2 blockers OR milestone at risk
        RED:   SPI < 0.7 OR 3+ blockers OR missed milestone

        Returns: {"status": "green"|"amber"|"red", "rationale": str, "metrics": dict}
        """
        spi = evm_data.get("spi", 0.0)
        blockers = self._get_blockers(issues)
        blocker_count = len(blockers)

        # Check overdue milestones
        overdue_milestones = 0
        at_risk_milestones = 0
        today = date.today()
        for ms in (milestones or []):
            if ms.status == MilestoneStatus.COMPLETED:
                continue
            if ms.due_date and ms.due_date < today:
                overdue_milestones += 1
            elif ms.due_date and (ms.due_date - today).days <= 7:
                at_risk_milestones += 1

        # Determine status
        status: Literal["green", "amber", "red"]
        reasons: list[str] = []

        # RED conditions
        if spi < 0.7:
            reasons.append(f"SPI critically low at {spi:.2f}")
        if blocker_count >= 3:
            reasons.append(f"{blocker_count} critical blockers")
        if overdue_milestones > 0:
            reasons.append(f"{overdue_milestones} overdue milestone(s)")

        if reasons:
            status = "red"
            rationale = "RED: " + "; ".join(reasons)
        else:
            # AMBER conditions
            amber_reasons: list[str] = []
            if 0.7 <= spi < 0.9:
                amber_reasons.append(f"SPI below target at {spi:.2f}")
            if 1 <= blocker_count <= 2:
                amber_reasons.append(f"{blocker_count} blocker(s)")
            if at_risk_milestones > 0:
                amber_reasons.append(
                    f"{at_risk_milestones} milestone(s) due within 7 days"
                )

            if amber_reasons:
                status = "amber"
                rationale = "AMBER: " + "; ".join(amber_reasons)
            else:
                status = "green"
                rationale = (
                    f"On track: SPI {spi:.2f}, "
                    f"no blockers, milestones on schedule"
                )

        return {
            "status": status,
            "rationale": rationale,
            "metrics": {
                "spi": spi,
                "blocker_count": blocker_count,
                "overdue_milestones": overdue_milestones,
                "at_risk_milestones": at_risk_milestones,
            },
        }

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    async def _get_project(self, project_id: UUID) -> Project:
        result = await self.session.execute(
            select(Project).where(
                Project.id == project_id,
                Project.is_deleted == False,  # noqa: E712
            )
        )
        project = result.scalar_one_or_none()
        if not project:
            raise NotFoundException(f"Project {project_id} not found")
        return project

    async def _get_workspace(self, workspace_id: UUID) -> Workspace:
        result = await self.session.execute(
            select(Workspace).where(
                Workspace.id == workspace_id,
                Workspace.is_deleted == False,  # noqa: E712
            )
        )
        workspace = result.scalar_one_or_none()
        if not workspace:
            raise NotFoundException(f"Workspace {workspace_id} not found")
        return workspace

    async def _get_workspace_projects(self, workspace_id: UUID) -> list[Project]:
        result = await self.session.execute(
            select(Project).where(
                Project.workspace_id == workspace_id,
                Project.is_deleted == False,  # noqa: E712
            )
        )
        return list(result.scalars().all())

    async def _get_project_issues(self, project_id: UUID) -> list[Issue]:
        result = await self.session.execute(
            select(Issue)
            .join(WorkflowStatus, Issue.status_id == WorkflowStatus.id)
            .where(
                Issue.project_id == project_id,
                Issue.is_deleted == False,  # noqa: E712
            )
            .options()
        )
        return list(result.scalars().all())

    async def _get_active_risks(self, project_id: UUID) -> list[Risk]:
        result = await self.session.execute(
            select(Risk).where(
                Risk.project_id == project_id,
                Risk.is_deleted == False,  # noqa: E712
                Risk.status.notin_([RiskStatus.RESOLVED, RiskStatus.CLOSED]),
            )
        )
        return list(result.scalars().all())

    async def _get_milestones(self, project_id: UUID) -> list[Milestone]:
        result = await self.session.execute(
            select(Milestone).where(
                Milestone.project_id == project_id,
                Milestone.is_deleted == False,  # noqa: E712
            )
        )
        return list(result.scalars().all())

    def _get_blockers(self, issues: list[Issue]) -> list[Issue]:
        """Return issues with priority 'critical' or 'blocker'."""
        return [
            i
            for i in issues
            if getattr(i, "priority", "") in ("critical", "blocker")
        ]

    async def _get_ai_summary(self, project_id: UUID) -> list[str]:
        """Get AI-generated summary bullets for the period.

        Falls back to a simple heuristic summary when AI is unavailable.
        """
        try:
            ai_service = AIService(self.session)
            response = await ai_service.generate_status_report(project_id)
            # Parse bullet points from AI response
            bullets: list[str] = []
            for line in response.split("\n"):
                line = line.strip()
                if line.startswith(("- ", "* ", "-- ")):
                    bullets.append(line.lstrip("-* ").strip())
                elif line and len(bullets) < 5 and not line.startswith("#"):
                    bullets.append(line)
            return bullets[:5] if bullets else self._fallback_bullets()
        except Exception:
            logger.warning("ai_summary_failed", project_id=str(project_id))
            return self._fallback_bullets()

    def _fallback_bullets(self) -> list[str]:
        return [
            "AI summary unavailable. Review project metrics above for current status.",
        ]

    def _forecast_end_date(self, project: Project, evm_data: dict) -> str:
        """Estimate forecast completion date based on SPI."""
        if not project.start_date or not project.target_end_date:
            return "N/A"
        spi = evm_data.get("spi", 0.0)
        if spi <= 0:
            return "At risk"
        total_days = (project.target_end_date - project.start_date).days
        if total_days <= 0:
            return str(project.target_end_date)
        forecast_days = int(total_days / spi)
        forecast = project.start_date + timedelta(days=forecast_days)
        return str(forecast)
