"""Natural-language status update parser.

Accepts free-text project status updates, uses AI to match mentions
to actual tasks, and applies confirmed updates to the database.
"""

from __future__ import annotations

import json
from uuid import UUID

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundException, ValidationException
from app.core.mcp_client import get_mcp_client
from app.repositories.issue import IssueRepository

logger = structlog.get_logger(__name__)

NL_STATUS_SYSTEM_PROMPT = (
    "You are Friday, an AI project management assistant. "
    "You are given a list of tasks from a project and a free-text status update "
    "from a team member. Your job is to match each mention in the free text to "
    "the most relevant task using SEMANTIC understanding — do NOT rely on exact "
    "string matching. Return your answer as a JSON array of objects, each with:\n"
    '  "task_id": "<UUID of the matched task>",\n'
    '  "task_summary": "<summary of the matched task>",\n'
    '  "matched_text": "<the portion of free text that references this task>",\n'
    '  "percent_complete": <integer 0-100 or null if not mentioned>,\n'
    '  "status": "<new status string or null if not mentioned>",\n'
    '  "revised_eta": "<YYYY-MM-DD or null if not mentioned>",\n'
    '  "blockers": [<list of blocker strings, empty if none>],\n'
    '  "confidence_score": <float 0.0-1.0 indicating match confidence>\n'
    "Only return valid JSON. Do not include any other text."
)


class NLStatusParserService:
    """Parse natural-language status updates and apply them to project tasks."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.issue_repo = IssueRepository(session)

    async def get_project_task_context(self, project_id: UUID) -> str:
        """Build a concise task list with IDs, summaries, current status,
        and percent_complete for AI context.
        """
        issues_result = await self.issue_repo.get_by_project(
            project_id, limit=200, include_count=False
        )
        issues = issues_result.get("data", [])

        if not issues:
            raise NotFoundException(f"No tasks found for project {project_id}")

        lines: list[str] = ["Tasks in this project:"]
        for issue in issues:
            status_name = (
                issue.status.name if hasattr(issue, "status") and issue.status else "unknown"
            )
            lines.append(
                f"- ID={issue.id} | Key={issue.issue_key} | "
                f"Summary={issue.summary} | Status={status_name} | "
                f"Complete={issue.percent_complete}%"
            )

        return "\n".join(lines)

    async def parse_update(self, project_id: UUID, free_text: str) -> dict:
        """Parse a free-text status update against project tasks.

        Calls the MCP chat endpoint with project task context and the free
        text. Falls back to mock data when MCP is unavailable.
        """
        task_context = await self.get_project_task_context(project_id)

        mcp = get_mcp_client()
        if mcp is None:
            logger.info("nl_status_parse_mock", project_id=str(project_id))
            return self._mock_parse_result(project_id, free_text)

        try:
            prompt = (
                f"{task_context}\n\n"
                f"Status update from team member:\n{free_text}\n\n"
                "Match each mention to the relevant task and return JSON."
            )

            response = await mcp.chat(
                messages=[{"role": "user", "content": prompt}],
                model="sonnet",
                system=NL_STATUS_SYSTEM_PROMPT,
                max_tokens=2048,
            )

            if not response:
                logger.warning("nl_status_parse_empty_response", project_id=str(project_id))
                return self._mock_parse_result(project_id, free_text)

            matches = json.loads(response)
            if not isinstance(matches, list):
                raise ValueError("Expected a JSON array from AI response")

            return {
                "matches": matches,
                "raw_text": free_text,
                "project_id": str(project_id),
            }

        except Exception as exc:
            logger.warning(
                "nl_status_parse_failed",
                project_id=str(project_id),
                error=str(exc),
            )
            return self._mock_parse_result(project_id, free_text)

    async def apply_update(
        self, project_id: UUID, confirmed_updates: list[dict], user_id: UUID
    ) -> dict:
        """Write confirmed status updates to the database.

        Updates percent_complete and planned_end (revised ETA) on each
        matched issue. Returns the count of updated tasks and any
        variance changes detected.
        """
        updated_count = 0
        variance_changes: list[dict] = []

        for update in confirmed_updates:
            task_id = UUID(str(update["task_id"]))
            issue = await self.issue_repo.get_by_id(task_id)
            if not issue:
                logger.warning("nl_status_apply_skip_missing", task_id=str(task_id))
                continue

            if issue.project_id != project_id:
                logger.warning(
                    "nl_status_apply_skip_wrong_project",
                    task_id=str(task_id),
                    expected_project=str(project_id),
                )
                continue

            patch: dict = {}
            old_percent = issue.percent_complete

            if update.get("percent_complete") is not None:
                new_percent = int(update["percent_complete"])
                if 0 <= new_percent <= 100:
                    patch["percent_complete"] = new_percent

            if update.get("revised_eta") is not None:
                patch["planned_end"] = update["revised_eta"]

            if not patch:
                continue

            await self.issue_repo.update(task_id, patch, updated_by=user_id)
            updated_count += 1

            if "percent_complete" in patch and old_percent != patch["percent_complete"]:
                variance_changes.append(
                    {
                        "task_id": str(task_id),
                        "task_summary": update.get("task_summary", issue.summary),
                        "field": "percent_complete",
                        "old_value": old_percent,
                        "new_value": patch["percent_complete"],
                    }
                )

        await self.session.commit()

        return {
            "updated_count": updated_count,
            "variance_changes": variance_changes,
        }

    @staticmethod
    def _mock_parse_result(project_id: UUID, free_text: str) -> dict:
        """Return realistic mock matches when MCP is unavailable."""
        mock_matches = [
            {
                "task_id": "00000000-0000-0000-0000-000000000101",
                "task_summary": "Design mockups for dashboard",
                "matched_text": "Design mockups are 80% done",
                "percent_complete": 80,
                "status": None,
                "revised_eta": None,
                "blockers": ["Waiting on client feedback"],
                "confidence_score": 0.92,
            },
            {
                "task_id": "00000000-0000-0000-0000-000000000102",
                "task_summary": "Backend API implementation",
                "matched_text": "Backend API is complete",
                "percent_complete": 100,
                "status": "done",
                "revised_eta": None,
                "blockers": [],
                "confidence_score": 0.88,
            },
            {
                "task_id": "00000000-0000-0000-0000-000000000103",
                "task_summary": "QA testing and bug fixes",
                "matched_text": "QA will start next week",
                "percent_complete": 0,
                "status": None,
                "revised_eta": None,
                "blockers": [],
                "confidence_score": 0.65,
            },
        ]

        return {
            "matches": mock_matches,
            "raw_text": free_text,
            "project_id": str(project_id),
        }
