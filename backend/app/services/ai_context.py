"""Builds rich project context for AI prompts."""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.issue import IssueRepository
from app.repositories.project import ProjectRepository


class AIContextBuilder:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def build_project_context(self, project_id: UUID) -> str:
        """Build a structured text summary of project state for AI context."""
        project_repo = ProjectRepository(self.session)
        issue_repo = IssueRepository(self.session)

        project = await project_repo.get_by_id(project_id)
        if not project:
            return "Project not found."

        # Get issue summary
        issues_result = await issue_repo.get_by_project(
            project_id, limit=100, include_count=True
        )
        issues = issues_result.get("data", [])
        total_count = issues_result.get("total_count", 0)

        # Categorize issues
        open_issues = [i for i in issues if not getattr(i, "is_deleted", False)]
        high_priority = [
            i
            for i in open_issues
            if getattr(i, "priority", "") in ("critical", "high")
        ]

        context = f"""Project: {project.name}
Description: {project.description or 'No description'}
Status: {project.status.value if project.status else 'unknown'}
RAG Status: {project.rag_status.value if project.rag_status else 'none'}
Start Date: {project.start_date or 'Not set'}
Target End Date: {project.target_end_date or 'Not set'}
Total Issues: {total_count}
High Priority Issues: {len(high_priority)}

Recent Issues:
"""
        for issue in open_issues[:20]:
            priority = getattr(issue, "priority", "unset")
            story_points = getattr(issue, "story_points", None)
            sp_str = f", sp={story_points}" if story_points else ""
            context += f"- [{issue.issue_key}] {issue.summary} (priority={priority}{sp_str})\n"

        return context

    async def build_issue_context(self, issue_id: UUID) -> str:
        """Build context about a specific issue."""
        issue_repo = IssueRepository(self.session)
        issue = await issue_repo.get_with_relations(issue_id)
        if not issue:
            return "Issue not found."

        assignee_name = ""
        if issue.assignee:
            assignee_name = getattr(issue.assignee, "display_name", "") or getattr(
                issue.assignee, "email", "unassigned"
            )

        context = f"""Issue: {issue.issue_key} - {issue.summary}
Priority: {issue.priority or 'unset'}
Story Points: {issue.story_points or 'Not estimated'}
Assignee: {assignee_name or 'Unassigned'}
Description: {issue.description or 'No description'}
"""
        return context
