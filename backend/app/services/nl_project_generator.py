"""Natural Language Project Generator service.

Generates structured project plans from natural language descriptions
using MCP (Claude via AWS Bedrock). Falls back to mock responses
when MCP is not configured.
"""

import json
from uuid import UUID

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundException, ValidationException
from app.core.mcp_client import get_mcp_client
from app.models.baseline import Baseline, BaselineSnapshot
from app.models.issue import Issue
from app.repositories.issue import IssueRepository
from app.repositories.project import ProjectRepository
from app.services.ai_context import AIContextBuilder

logger = structlog.get_logger()

PLAN_GENERATION_SYSTEM_PROMPT = (
    "You are Friday, an AI project management assistant. "
    "Generate a structured project plan from the user's description. "
    "You MUST respond with valid JSON only, no markdown or extra text. "
    "The JSON must follow this exact schema:\n"
    "{\n"
    '  "summary": "Brief project summary",\n'
    '  "deliverables": [\n'
    '    {"name": "...", "description": "...", "acceptance_criteria": ["..."]}\n'
    "  ],\n"
    '  "workflows": [\n'
    '    {"name": "...", "category": "todo|in_progress|done", "order": 1}\n'
    "  ],\n"
    '  "tasks": [\n'
    "    {\n"
    '      "summary": "...",\n'
    '      "description": "...",\n'
    '      "priority": "critical|high|medium|low",\n'
    '      "estimated_hours": 8,\n'
    '      "planned_start": "YYYY-MM-DD",\n'
    '      "planned_end": "YYYY-MM-DD",\n'
    '      "deliverable": "deliverable name this task belongs to"\n'
    "    }\n"
    "  ],\n"
    '  "roles": [\n'
    '    {"title": "...", "responsibilities": ["..."], "count": 1}\n'
    "  ],\n"
    '  "timeline": {\n'
    '    "start_date": "YYYY-MM-DD",\n'
    '    "end_date": "YYYY-MM-DD",\n'
    '    "milestones": [\n'
    '      {"name": "...", "target_date": "YYYY-MM-DD", "deliverables": ["..."]}\n'
    "    ]\n"
    "  }\n"
    "}\n"
    "Ensure tasks cover all deliverables, priorities are realistic, "
    "and the timeline accounts for dependencies."
)

PLAN_REFINEMENT_SYSTEM_PROMPT = (
    "You are Friday, an AI project management assistant. "
    "You are given an existing project plan as JSON and user corrections. "
    "Apply the corrections and return the updated plan as valid JSON only, "
    "following the exact same schema as the original plan. "
    "Do not include markdown, explanations, or extra text."
)


class NLProjectGeneratorService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.context_builder = AIContextBuilder(session)

    async def generate_plan(self, description: str, workspace_id: UUID) -> dict:
        """Generate a structured project plan from a natural language description.

        Calls MCP chat with a system prompt enforcing JSON schema output.
        Falls back to a mock response when MCP is unavailable.
        """
        constraints_context = ""
        # Optionally build workspace context
        project_repo = ProjectRepository(self.session)
        existing = await project_repo.get_by_workspace(workspace_id, limit=5)
        if existing.get("data"):
            project_names = [p.name for p in existing["data"]]
            constraints_context = (
                f"\n\nExisting projects in workspace: {', '.join(project_names)}. "
                "Avoid name conflicts and consider integration points."
            )

        user_prompt = (
            f"Create a detailed project plan for:\n\n{description}"
            f"{constraints_context}"
        )

        mcp = get_mcp_client()
        if mcp is None:
            logger.info("mcp_unavailable_using_mock", action="generate_plan")
            return self._mock_plan(description)

        try:
            response = await mcp.chat(
                messages=[{"role": "user", "content": user_prompt}],
                model="sonnet",
                system=PLAN_GENERATION_SYSTEM_PROMPT,
                max_tokens=4096,
            )
            if not response:
                logger.warning("mcp_empty_response", action="generate_plan")
                return self._mock_plan(description)

            plan = json.loads(response)
            self._validate_plan_structure(plan)
            return plan

        except json.JSONDecodeError as exc:
            logger.warning("mcp_invalid_json", error=str(exc), action="generate_plan")
            return self._mock_plan(description)
        except Exception as exc:
            logger.warning("mcp_plan_generation_failed", error=str(exc))
            return self._mock_plan(description)

    async def refine_plan(self, plan: dict, corrections: str) -> dict:
        """Take an existing plan and NL corrections, re-generate via MCP.

        Falls back to returning the original plan if MCP is unavailable.
        """
        user_prompt = (
            f"Current plan:\n```json\n{json.dumps(plan, indent=2)}\n```\n\n"
            f"User corrections:\n{corrections}\n\n"
            "Apply these corrections and return the updated plan as JSON."
        )

        mcp = get_mcp_client()
        if mcp is None:
            logger.info("mcp_unavailable_using_original", action="refine_plan")
            return plan

        try:
            response = await mcp.chat(
                messages=[{"role": "user", "content": user_prompt}],
                model="sonnet",
                system=PLAN_REFINEMENT_SYSTEM_PROMPT,
                max_tokens=4096,
            )
            if not response:
                logger.warning("mcp_empty_response", action="refine_plan")
                return plan

            refined = json.loads(response)
            self._validate_plan_structure(refined)
            return refined

        except json.JSONDecodeError as exc:
            logger.warning("mcp_invalid_json", error=str(exc), action="refine_plan")
            return plan
        except Exception as exc:
            logger.warning("mcp_refine_failed", error=str(exc))
            return plan

    async def lock_baseline(
        self, project_id: UUID, name: str, user_id: UUID
    ) -> dict:
        """Create a Baseline + BaselineSnapshot records from current project issues."""
        # Verify project exists
        project_repo = ProjectRepository(self.session)
        project = await project_repo.get_by_id(project_id)
        if not project:
            raise NotFoundException("Project not found")

        # Create baseline record
        baseline = Baseline(
            project_id=project_id,
            name=name,
            description=f"AI-generated baseline: {name}",
        )
        self.session.add(baseline)
        await self.session.flush()

        # Snapshot all issues in the project
        query = select(Issue).where(Issue.project_id == project_id)
        if hasattr(Issue, "is_deleted"):
            query = query.where(Issue.is_deleted == False)  # noqa: E712
        result = await self.session.execute(query)
        issues = list(result.scalars().all())

        snapshot_count = 0
        for issue in issues:
            snapshot = BaselineSnapshot(
                baseline_id=baseline.id,
                issue_id=issue.id,
                planned_start=issue.planned_start,
                planned_end=issue.planned_end,
                estimated_hours=issue.estimated_hours,
                story_points=issue.story_points,
                status_id=issue.status_id,
            )
            self.session.add(snapshot)
            snapshot_count += 1

        await self.session.commit()

        logger.info(
            "baseline_locked",
            baseline_id=str(baseline.id),
            project_id=str(project_id),
            snapshot_count=snapshot_count,
        )

        return {
            "baseline_id": baseline.id,
            "snapshot_count": snapshot_count,
        }

    async def apply_plan(
        self,
        plan: dict,
        workspace_id: UUID,
        project_name: str,
        user_id: UUID,
    ) -> dict:
        """Materialize a plan into real Project + Issues.

        Creates the project and issues from the plan structure.
        """
        self._validate_plan_structure(plan)

        project_repo = ProjectRepository(self.session)
        issue_repo = IssueRepository(self.session)

        # Generate a key prefix from the project name
        key_prefix = (
            "".join(w[0] for w in project_name.split() if w)
            .upper()[:5]
            .ljust(2, "X")
        )

        # Ensure key prefix is unique
        existing = await project_repo.get_by_key_prefix(key_prefix)
        if existing:
            key_prefix = key_prefix[:3] + "AI"

        # Create the project
        project = await project_repo.create(
            {
                "workspace_id": workspace_id,
                "name": project_name,
                "key_prefix": key_prefix,
                "description": plan.get("summary", ""),
            },
            created_by=user_id,
        )

        # Create issues from tasks
        created_issues = []
        tasks = plan.get("tasks", [])
        for idx, task in enumerate(tasks):
            issue_data = {
                "project_id": project.id,
                "summary": task.get("summary", f"Task {idx + 1}"),
                "description": task.get("description", ""),
                "priority": task.get("priority", "medium"),
                "estimated_hours": task.get("estimated_hours"),
                "planned_start": task.get("planned_start"),
                "planned_end": task.get("planned_end"),
            }
            try:
                issue = await issue_repo.create(issue_data, created_by=user_id)
                created_issues.append(issue)
            except Exception as exc:
                logger.warning(
                    "issue_creation_failed",
                    task_summary=task.get("summary"),
                    error=str(exc),
                )

        await self.session.commit()

        logger.info(
            "plan_applied",
            project_id=str(project.id),
            project_name=project_name,
            issues_created=len(created_issues),
            total_tasks=len(tasks),
        )

        return {
            "project_id": project.id,
            "project_name": project_name,
            "issues_created": len(created_issues),
            "total_tasks": len(tasks),
        }

    @staticmethod
    def _validate_plan_structure(plan: dict) -> None:
        """Validate that a plan dict has the expected top-level keys."""
        required_keys = {"summary", "deliverables", "tasks", "roles", "timeline"}
        missing = required_keys - set(plan.keys())
        if missing:
            raise ValidationException(
                f"Plan is missing required fields: {', '.join(sorted(missing))}"
            )

    @staticmethod
    def _mock_plan(description: str) -> dict:
        """Return a realistic sample plan when MCP is unavailable."""
        summary = description[:200] if len(description) > 200 else description
        return {
            "summary": f"Project plan for: {summary}",
            "deliverables": [
                {
                    "name": "Core Feature Implementation",
                    "description": "Implement the primary features described in the project scope.",
                    "acceptance_criteria": [
                        "All core features are functional",
                        "Unit tests cover critical paths",
                        "Code review completed",
                    ],
                },
                {
                    "name": "Testing & QA",
                    "description": "Comprehensive testing including integration and user acceptance.",
                    "acceptance_criteria": [
                        "All tests pass",
                        "No critical bugs remain",
                        "Performance benchmarks met",
                    ],
                },
                {
                    "name": "Documentation & Deployment",
                    "description": "Technical documentation and production deployment.",
                    "acceptance_criteria": [
                        "API documentation complete",
                        "Deployment runbook created",
                        "Monitoring configured",
                    ],
                },
            ],
            "workflows": [
                {"name": "Backlog", "category": "todo", "order": 1},
                {"name": "To Do", "category": "todo", "order": 2},
                {"name": "In Progress", "category": "in_progress", "order": 3},
                {"name": "In Review", "category": "in_progress", "order": 4},
                {"name": "Done", "category": "done", "order": 5},
            ],
            "tasks": [
                {
                    "summary": "Requirements analysis and technical design",
                    "description": "Analyze requirements and create technical design document.",
                    "priority": "high",
                    "estimated_hours": 16,
                    "planned_start": "2025-01-06",
                    "planned_end": "2025-01-08",
                    "deliverable": "Core Feature Implementation",
                },
                {
                    "summary": "Backend API implementation",
                    "description": "Implement REST API endpoints with proper validation.",
                    "priority": "high",
                    "estimated_hours": 40,
                    "planned_start": "2025-01-09",
                    "planned_end": "2025-01-17",
                    "deliverable": "Core Feature Implementation",
                },
                {
                    "summary": "Frontend UI development",
                    "description": "Build React components and integrate with API.",
                    "priority": "high",
                    "estimated_hours": 32,
                    "planned_start": "2025-01-13",
                    "planned_end": "2025-01-20",
                    "deliverable": "Core Feature Implementation",
                },
                {
                    "summary": "Integration testing",
                    "description": "Write and run integration tests across all components.",
                    "priority": "medium",
                    "estimated_hours": 16,
                    "planned_start": "2025-01-20",
                    "planned_end": "2025-01-22",
                    "deliverable": "Testing & QA",
                },
                {
                    "summary": "User acceptance testing",
                    "description": "Coordinate UAT with stakeholders and address feedback.",
                    "priority": "medium",
                    "estimated_hours": 8,
                    "planned_start": "2025-01-22",
                    "planned_end": "2025-01-23",
                    "deliverable": "Testing & QA",
                },
                {
                    "summary": "Documentation and deployment",
                    "description": "Write technical docs and deploy to production.",
                    "priority": "medium",
                    "estimated_hours": 12,
                    "planned_start": "2025-01-23",
                    "planned_end": "2025-01-27",
                    "deliverable": "Documentation & Deployment",
                },
            ],
            "roles": [
                {
                    "title": "Project Manager",
                    "responsibilities": [
                        "Coordinate team activities",
                        "Track progress and risks",
                        "Stakeholder communication",
                    ],
                    "count": 1,
                },
                {
                    "title": "Backend Developer",
                    "responsibilities": [
                        "API development",
                        "Database design",
                        "Unit testing",
                    ],
                    "count": 1,
                },
                {
                    "title": "Frontend Developer",
                    "responsibilities": [
                        "UI component development",
                        "API integration",
                        "Accessibility compliance",
                    ],
                    "count": 1,
                },
                {
                    "title": "QA Engineer",
                    "responsibilities": [
                        "Test plan creation",
                        "Integration testing",
                        "Bug reporting",
                    ],
                    "count": 1,
                },
            ],
            "timeline": {
                "start_date": "2025-01-06",
                "end_date": "2025-01-27",
                "milestones": [
                    {
                        "name": "Design Complete",
                        "target_date": "2025-01-08",
                        "deliverables": ["Core Feature Implementation"],
                    },
                    {
                        "name": "Development Complete",
                        "target_date": "2025-01-20",
                        "deliverables": [
                            "Core Feature Implementation",
                            "Testing & QA",
                        ],
                    },
                    {
                        "name": "Production Release",
                        "target_date": "2025-01-27",
                        "deliverables": ["Documentation & Deployment"],
                    },
                ],
            },
        }
