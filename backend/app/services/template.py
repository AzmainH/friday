from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundException, ValidationException
from app.models.issue_extras import Label
from app.models.issue_type import IssueType
from app.models.organization import Organization
from app.models.project import Project
from app.models.template import ProjectTemplate
from app.models.workflow import Workflow, WorkflowStatus, WorkflowTransition
from app.models.workspace import Workspace
from app.repositories.project import ProjectRepository
from app.repositories.template import ProjectTemplateRepository


class TemplateService:
    def __init__(self, session: AsyncSession):
        self.repo = ProjectTemplateRepository(session)
        self.project_repo = ProjectRepository(session)
        self.session = session

    # ── Template CRUD ───────────────────────────────────────────

    async def list_templates(
        self,
        *,
        cursor: str | None = None,
        limit: int = 50,
        include_count: bool = False,
    ) -> dict:
        return await self.repo.list_all(
            cursor=cursor,
            limit=limit,
            include_count=include_count,
        )

    async def get_template(self, template_id: UUID) -> ProjectTemplate:
        template = await self.repo.get_by_id(template_id)
        if not template:
            raise NotFoundException("Project template not found")
        return template

    async def create_template(
        self, data: dict, *, created_by: UUID | None = None
    ) -> ProjectTemplate:
        # Custom templates are never system templates
        data["is_system"] = False
        return await self.repo.create(data, created_by=created_by)

    # ── Apply template to an existing project ───────────────────

    async def apply_template(
        self,
        project_id: UUID,
        template_id: UUID,
        *,
        created_by: UUID | None = None,
    ) -> None:
        template = await self.get_template(template_id)
        td = template.template_data

        # -- Workflow with statuses --
        workflow_cfg = td.get("workflow", {})
        workflow = Workflow(
            project_id=project_id,
            name=workflow_cfg.get("name", "Default Workflow"),
            is_default=True,
        )
        if created_by:
            workflow.created_by = created_by
            workflow.updated_by = created_by
        self.session.add(workflow)
        await self.session.flush()

        # -- Statuses --
        status_map: dict[str, UUID] = {}
        for s_cfg in workflow_cfg.get("statuses", []):
            status = WorkflowStatus(
                workflow_id=workflow.id,
                name=s_cfg["name"],
                category=s_cfg["category"],
                color=s_cfg.get("color", "#9e9e9e"),
                sort_order=s_cfg.get("sort_order", 0),
            )
            self.session.add(status)
            await self.session.flush()
            status_map[s_cfg["name"]] = status.id

        # -- Transitions --
        for t_cfg in workflow_cfg.get("transitions", []):
            from_id = status_map.get(t_cfg["from"])
            to_id = status_map.get(t_cfg["to"])
            if from_id and to_id:
                transition = WorkflowTransition(
                    workflow_id=workflow.id,
                    from_status_id=from_id,
                    to_status_id=to_id,
                    name=f"{t_cfg['from']} -> {t_cfg['to']}",
                )
                self.session.add(transition)

        # -- Issue types --
        for idx, it_cfg in enumerate(td.get("issue_types", [])):
            issue_type = IssueType(
                project_id=project_id,
                name=it_cfg["name"],
                icon=it_cfg.get("icon", "check-square"),
                color=it_cfg.get("color", "#1976d2"),
                hierarchy_level=it_cfg.get("hierarchy_level", 0),
                is_subtask=it_cfg.get("is_subtask", False),
                sort_order=idx,
            )
            if created_by:
                issue_type.created_by = created_by
                issue_type.updated_by = created_by
            self.session.add(issue_type)

        # -- Labels --
        for l_cfg in td.get("labels", []):
            label = Label(
                project_id=project_id,
                name=l_cfg["name"],
                color=l_cfg.get("color", "#1976d2"),
            )
            self.session.add(label)

        await self.session.flush()

    # ── Wizard: one-shot project creation ───────────────────────

    async def _resolve_default_workspace_id(self) -> UUID:
        """Return the default workspace id for the default organization."""
        org_result = await self.session.execute(
            select(Organization).where(Organization.slug == "default")
        )
        org = org_result.scalar_one_or_none()
        if not org:
            raise ValidationException("No default organization found")
        ws_result = await self.session.execute(
            select(Workspace).where(
                Workspace.org_id == org.id,
                Workspace.slug == "default",
                Workspace.is_deleted == False,  # noqa: E712
            )
        )
        ws = ws_result.scalar_one_or_none()
        if not ws:
            raise ValidationException("No default workspace found")
        return ws.id

    async def create_project_from_wizard(
        self,
        data: dict,
        user_id: UUID,
    ) -> Project:
        # Validate key_prefix uniqueness
        existing = await self.project_repo.get_by_key_prefix(data["key_prefix"])
        if existing:
            raise ValidationException(
                "A project with this key prefix already exists"
            )

        # Resolve workspace_id: use provided value or fall back to default
        workspace_id = data.get("workspace_id")
        if not workspace_id:
            workspace_id = await self._resolve_default_workspace_id()

        # Resolve template_id: only use valid UUIDs (ignore client-side names)
        raw_template_id = data.get("template_id")
        template_id: UUID | None = None
        if raw_template_id:
            try:
                template_id = UUID(str(raw_template_id))
            except ValueError:
                template_id = None

        # Create the project
        project_data = {
            "workspace_id": workspace_id,
            "name": data["name"],
            "key_prefix": data["key_prefix"],
            "description": data.get("description"),
            "lead_id": data.get("lead_id"),
            "status": "planning",
        }
        project = await self.project_repo.create(
            project_data, created_by=user_id
        )

        # Apply template if provided
        if template_id:
            await self.apply_template(
                project.id, template_id, created_by=user_id
            )
        else:
            # Apply a minimal blank workflow so the project is usable
            await self._apply_blank_workflow(project.id, created_by=user_id)

        return project

    async def _apply_blank_workflow(
        self,
        project_id: UUID,
        *,
        created_by: UUID | None = None,
    ) -> None:
        """Create a minimal three-status workflow when no template is chosen."""
        workflow = Workflow(
            project_id=project_id,
            name="Default Workflow",
            is_default=True,
        )
        if created_by:
            workflow.created_by = created_by
            workflow.updated_by = created_by
        self.session.add(workflow)
        await self.session.flush()

        statuses_cfg = [
            ("To Do", "to_do", "#9e9e9e", 0),
            ("In Progress", "in_progress", "#2196f3", 1),
            ("Done", "done", "#4caf50", 2),
        ]
        status_ids: dict[str, UUID] = {}
        for name, category, color, order in statuses_cfg:
            status = WorkflowStatus(
                workflow_id=workflow.id,
                name=name,
                category=category,
                color=color,
                sort_order=order,
            )
            self.session.add(status)
            await self.session.flush()
            status_ids[name] = status.id

        transitions = [
            ("To Do", "In Progress"),
            ("In Progress", "Done"),
            ("In Progress", "To Do"),
            ("Done", "In Progress"),
        ]
        for from_name, to_name in transitions:
            transition = WorkflowTransition(
                workflow_id=workflow.id,
                from_status_id=status_ids[from_name],
                to_status_id=status_ids[to_name],
                name=f"{from_name} -> {to_name}",
            )
            self.session.add(transition)

        # One default issue type
        task_type = IssueType(
            project_id=project_id,
            name="Task",
            icon="check-square",
            color="#1976d2",
            hierarchy_level=0,
            is_subtask=False,
            sort_order=0,
        )
        if created_by:
            task_type.created_by = created_by
            task_type.updated_by = created_by
        self.session.add(task_type)

        await self.session.flush()
