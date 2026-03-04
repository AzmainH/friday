from __future__ import annotations

import json
import os
import re
from datetime import date, datetime, timezone
from uuid import UUID

import structlog

from app.core.database import async_session_factory
from app.models.notification import TaskStatus

logger = structlog.get_logger(__name__)

# ---------------------------------------------------------------------------
# Status-category mapping for common status texts found in project documents
# ---------------------------------------------------------------------------

_STATUS_CATEGORY_MAP: dict[str, str] = {
    "complete": "done",
    "completed": "done",
    "done": "done",
    "finished": "done",
    "closed": "done",
    "in progress": "in_progress",
    "in-progress": "in_progress",
    "active": "in_progress",
    "started": "in_progress",
    "ongoing": "in_progress",
    "wip": "in_progress",
    "planned": "to_do",
    "not started": "to_do",
    "not_started": "to_do",
    "todo": "to_do",
    "to do": "to_do",
    "open": "to_do",
    "pending": "to_do",
    "backlog": "to_do",
    "new": "to_do",
    "blocked": "blocked",
    "on hold": "blocked",
    "on_hold": "blocked",
    "waiting": "blocked",
    "in review": "in_review",
    "in_review": "in_review",
    "review": "in_review",
    "under review": "in_review",
}

# Colors for workflow status categories
_STATUS_COLORS: dict[str, str] = {
    "to_do": "#9e9e9e",
    "in_progress": "#2196f3",
    "in_review": "#ff9800",
    "done": "#4caf50",
    "blocked": "#f44336",
}

# Issue-type definitions per hierarchy level
_ISSUE_TYPE_DEFS: list[dict[str, str | int | bool]] = [
    {"name": "Phase", "icon": "layers", "is_subtask": False},
    {"name": "Work Package", "icon": "package", "is_subtask": False},
    {"name": "Task", "icon": "check-square", "is_subtask": False},
    {"name": "Sub-Task", "icon": "list", "is_subtask": True},
]

# Duration-parsing pattern: e.g. "5 days", "2.5 days", "1 day", "8 hours"
_DURATION_RE = re.compile(
    r"^\s*(?P<value>[\d.]+)\s*(?P<unit>days?|hours?|hrs?|h|d|weeks?|wks?|w)\s*$",
    re.IGNORECASE,
)

# Hours per work-day
_HOURS_PER_DAY = 8.0
_HOURS_PER_WEEK = 40.0


# ---------------------------------------------------------------------------
# Shared helpers (mirror import_export.py pattern)
# ---------------------------------------------------------------------------


async def _get_task_status(session, run_id: UUID) -> TaskStatus | None:
    from sqlalchemy import select

    result = await session.execute(
        select(TaskStatus).where(TaskStatus.id == run_id)
    )
    return result.scalar_one_or_none()


async def _update_task(session, run_id: UUID, **kwargs) -> None:
    task = await _get_task_status(session, run_id)
    if task:
        for key, value in kwargs.items():
            setattr(task, key, value)
        await session.flush()


# ---------------------------------------------------------------------------
# Pure helpers
# ---------------------------------------------------------------------------


def _get_parent_wbs(wbs: str) -> str | None:
    """Return the parent WBS code, or ``None`` for top-level items.

    Examples::

        "1.1.1" -> "1.1"
        "1.1"   -> "1"
        "1"     -> None
    """
    parts = wbs.rsplit(".", 1)
    if len(parts) < 2:
        return None
    return parts[0]


def _parse_duration_hours(duration: str | None) -> float | None:
    """Convert a human-readable duration string to hours.

    Returns ``None`` when the input is empty or cannot be parsed.

    Examples::

        "5 days"   -> 40.0
        "1 day"    -> 8.0
        "4 hours"  -> 4.0
        "2 weeks"  -> 80.0
    """
    if not duration:
        return None

    m = _DURATION_RE.match(duration)
    if not m:
        return None

    value = float(m.group("value"))
    unit = m.group("unit").lower().rstrip("s")

    if unit in ("day", "d"):
        return value * _HOURS_PER_DAY
    if unit in ("hour", "hr", "h"):
        return value
    if unit in ("week", "wk", "w"):
        return value * _HOURS_PER_WEEK

    return None


def _default_status_category(status_text: str) -> str:
    """Map a free-form status label to a workflow status category.

    Falls back to ``"to_do"`` when no match is found.
    """
    return _STATUS_CATEGORY_MAP.get(status_text.strip().lower(), "to_do")


def _serialize_date(d: date | None) -> str | None:
    """Convert a ``date`` to an ISO-format string, or ``None``."""
    if d is None:
        return None
    return d.isoformat()


async def _resolve_default_workspace(session) -> UUID:
    """Return the default workspace ID for the default organization."""
    from sqlalchemy import select

    from app.models.organization import Organization
    from app.models.workspace import Workspace

    org_result = await session.execute(
        select(Organization).where(Organization.slug == "default")
    )
    org = org_result.scalar_one_or_none()
    if not org:
        raise RuntimeError("No default organization found")

    ws_result = await session.execute(
        select(Workspace).where(
            Workspace.org_id == org.id,
            Workspace.slug == "default",
            Workspace.is_deleted == False,  # noqa: E712
        )
    )
    ws = ws_result.scalar_one_or_none()
    if not ws:
        raise RuntimeError("No default workspace found")

    return ws.id


# ---------------------------------------------------------------------------
# Task 1: analyze_documents
# ---------------------------------------------------------------------------


async def analyze_documents(
    ctx: dict,
    file_paths: str,
    file_types: str,
    user_id: str,
    run_id: str,
) -> dict:
    """Analyse uploaded project documents and extract a structured spec.

    ``file_paths`` and ``file_types`` are JSON-encoded lists of strings.
    The task stores its result in ``TaskStatus.result_summary_json``.
    """
    run_uuid = UUID(run_id)

    logger.info(
        "analyze_documents_started",
        run_id=run_id,
        user_id=user_id,
    )

    # Decode JSON-encoded lists
    paths: list[str] = json.loads(file_paths) if isinstance(file_paths, str) else file_paths
    types: list[str] = json.loads(file_types) if isinstance(file_types, str) else file_types

    async with async_session_factory() as session:
        try:
            # -- 1. Mark running (5%) -----------------------------------
            await _update_task(
                session,
                run_uuid,
                status="running",
                progress_pct=5,
                started_at=datetime.now(timezone.utc),
            )
            await session.commit()

            # -- 2. Extract raw content from each file (10-30%) ---------
            from app.services.document_parser.docx_parser import DocxParser
            from app.services.document_parser.xlsx_parser import XlsxParser

            raw_contents: list[str] = []
            total_files = len(paths)
            warnings: list[str] = []

            for idx, (path, ftype) in enumerate(zip(paths, types)):
                try:
                    if ftype in ("docx",):
                        parser = DocxParser()
                        content = parser.extract_content(path)
                    elif ftype in ("xlsx",):
                        parser_xl = XlsxParser()
                        content = parser_xl.extract_content(path)
                    else:
                        warnings.append(
                            f"Unsupported file type '{ftype}' for file: "
                            f"{os.path.basename(path)}"
                        )
                        continue

                    raw_contents.append(content)
                except Exception as parse_exc:
                    warnings.append(
                        f"Failed to parse file '{os.path.basename(path)}': "
                        f"{parse_exc}"
                    )
                    logger.warning(
                        "analyze_documents.parse_error",
                        file_path=path,
                        error=str(parse_exc),
                    )

                progress = int(10 + 20 * (idx + 1) / max(total_files, 1))
                await _update_task(session, run_uuid, progress_pct=progress)
                await session.commit()

            if not raw_contents:
                await _update_task(
                    session,
                    run_uuid,
                    status="failed",
                    error_message="No parseable content could be extracted from "
                    "the uploaded files.",
                    completed_at=datetime.now(timezone.utc),
                )
                await session.commit()
                return {"error": "No parseable content"}

            # -- 3. AI-based structured extraction (30-70%) -------------
            from app.services.document_parser.ai_parser import (
                AIDocumentParser,
            )

            ai_parser = AIDocumentParser()
            combined_text = "\n\n---\n\n".join(raw_contents)
            parsed_spec = await ai_parser.parse(combined_text)

            await _update_task(session, run_uuid, progress_pct=70)
            await session.commit()

            # -- 4. Fuzzy-match resources to users (70-90%) -------------
            from app.services.document_parser.resource_matcher import (
                ResourceMatcher,
            )

            matcher = ResourceMatcher(session)
            resource_matches = await matcher.match_resources(
                parsed_spec.resources
            )

            await _update_task(session, run_uuid, progress_pct=90)
            await session.commit()

            # -- 5. Build result dict (100%) ----------------------------
            tasks_list = [t.model_dump(mode="json") for t in parsed_spec.tasks]
            milestones_list = [
                {
                    "name": m.name,
                    "milestone_type": m.milestone_type or "custom",
                    "start_date": _serialize_date(m.start_date),
                    "due_date": _serialize_date(m.due_date),
                }
                for m in parsed_spec.milestones
            ]
            resources_list = [
                {
                    "document_name": rm.document_name,
                    "matched_user_id": (
                        str(rm.matched_user_id) if rm.matched_user_id else None
                    ),
                    "matched_display_name": rm.matched_display_name,
                    "confidence": rm.confidence,
                }
                for rm in resource_matches
            ]

            # Determine hierarchy depth
            hierarchy_levels = 0
            if parsed_spec.tasks:
                hierarchy_levels = max(
                    t.hierarchy_level for t in parsed_spec.tasks
                )

            # Collect unique statuses
            statuses_found = list(
                dict.fromkeys(
                    t.status for t in parsed_spec.tasks if t.status
                )
            )

            result_data: dict = {
                "project_name": parsed_spec.name,
                "project_description": parsed_spec.description,
                "start_date": _serialize_date(parsed_spec.start_date),
                "end_date": _serialize_date(parsed_spec.target_end_date),
                "task_count": len(parsed_spec.tasks),
                "milestone_count": len(parsed_spec.milestones),
                "resource_count": len(resource_matches),
                "statuses_found": statuses_found,
                "hierarchy_levels": hierarchy_levels,
                "resources": resources_list,
                "milestones": milestones_list,
                "tasks_preview": tasks_list[:50],
                "total_tasks": len(tasks_list),
                "warnings": warnings,
                # Internal data for the creation task
                "_parsed_spec": parsed_spec.model_dump(mode="json"),
                "_file_paths": list(paths),
            }

            await _update_task(
                session,
                run_uuid,
                status="completed",
                progress_pct=100,
                result_summary_json=result_data,
                completed_at=datetime.now(timezone.utc),
            )
            await session.commit()

            # Clean up uploaded files
            for p in paths:
                try:
                    os.remove(p)
                except OSError:
                    pass

            logger.info(
                "analyze_documents_completed",
                run_id=run_id,
                task_count=len(parsed_spec.tasks),
                milestone_count=len(parsed_spec.milestones),
            )
            return result_data

        except Exception as exc:
            logger.exception("analyze_documents_failed", run_id=run_id)
            await session.rollback()
            async with async_session_factory() as err_session:
                await _update_task(
                    err_session,
                    run_uuid,
                    status="failed",
                    error_message=str(exc),
                    completed_at=datetime.now(timezone.utc),
                )
                await err_session.commit()
            return {"error": str(exc)}


# ---------------------------------------------------------------------------
# Task 2: create_project_from_documents
# ---------------------------------------------------------------------------


async def create_project_from_documents(
    ctx: dict,
    analysis_task_id: str,
    config_json: str,
    user_id: str,
    run_id: str,
) -> dict:
    """Create a full project from a previously-completed document analysis.

    ``config_json`` is a JSON-encoded ``DocumentProjectCreateRequest``.
    """
    run_uuid = UUID(run_id)
    user_uuid = UUID(user_id)
    analysis_uuid = UUID(analysis_task_id)

    config: dict = json.loads(config_json) if isinstance(config_json, str) else config_json

    logger.info(
        "create_project_from_documents_started",
        run_id=run_id,
        analysis_task_id=analysis_task_id,
    )

    async with async_session_factory() as session:
        try:
            # -- 1. Load parsed spec from analysis task (5%) ------------
            await _update_task(
                session,
                run_uuid,
                status="running",
                progress_pct=5,
                started_at=datetime.now(timezone.utc),
            )
            await session.commit()

            analysis_task = await _get_task_status(session, analysis_uuid)
            if not analysis_task or not analysis_task.result_summary_json:
                raise ValueError(
                    f"Analysis task '{analysis_task_id}' not found or "
                    "has no result data."
                )

            raw_spec = analysis_task.result_summary_json.get("_parsed_spec")
            if not raw_spec:
                raise ValueError(
                    "Analysis task result does not contain parsed spec data."
                )

            from app.services.document_parser.models import ParsedProjectSpec

            parsed_spec = ParsedProjectSpec.model_validate(raw_spec)

            # -- 2. Create or get existing project (10%) ----------------
            await _update_task(session, run_uuid, progress_pct=10)
            await session.commit()

            from app.services.project import ProjectService

            project_service = ProjectService(session)

            mode = config.get("mode", "new")
            project_id: UUID

            if mode == "existing":
                existing_id = config.get("existing_project_id")
                if not existing_id:
                    raise ValueError(
                        "existing_project_id is required when mode is 'existing'."
                    )
                project_id = UUID(str(existing_id))
                # Verify the project exists
                await project_service.get_project(project_id)
            else:
                # Create a new project
                workspace_id = config.get("workspace_id")
                if workspace_id:
                    workspace_uuid = UUID(str(workspace_id))
                else:
                    workspace_uuid = await _resolve_default_workspace(session)

                project_name = (
                    config.get("project_name")
                    or parsed_spec.name
                    or "Imported Project"
                )
                key_prefix = (
                    config.get("key_prefix")
                    or parsed_spec.key_prefix
                    or _generate_key_prefix(project_name)
                )
                description = (
                    config.get("description")
                    or parsed_spec.description
                    or ""
                )

                project = await project_service.create_project(
                    {
                        "workspace_id": workspace_uuid,
                        "name": project_name,
                        "key_prefix": key_prefix,
                        "description": description,
                        "status": "planning",
                        "start_date": (
                            parsed_spec.start_date.isoformat()
                            if parsed_spec.start_date
                            else None
                        ),
                        "target_end_date": (
                            parsed_spec.target_end_date.isoformat()
                            if parsed_spec.target_end_date
                            else None
                        ),
                    },
                    created_by=user_uuid,
                )
                project_id = project.id

            # -- 3. Create workflow + statuses (15-20%) -----------------
            await _update_task(session, run_uuid, progress_pct=15)
            await session.commit()

            from app.models.workflow import (
                Workflow,
                WorkflowStatus,
                WorkflowTransition,
            )

            # Build status list from document statuses + config overrides
            status_mapping: dict[str, str] = config.get("status_mapping", {})

            # Collect all unique statuses from the spec
            doc_statuses: list[str] = list(
                dict.fromkeys(
                    t.status for t in parsed_spec.tasks if t.status
                )
            )

            # Build status -> category mapping
            status_to_category: dict[str, str] = {}
            for s in doc_statuses:
                if s in status_mapping:
                    status_to_category[s] = status_mapping[s]
                else:
                    status_to_category[s] = _default_status_category(s)

            # Ensure at least a "To Do" status exists
            if not status_to_category:
                status_to_category["To Do"] = "to_do"
                status_to_category["In Progress"] = "in_progress"
                status_to_category["Done"] = "done"

            # Create workflow
            workflow = Workflow(
                project_id=project_id,
                name="Imported Workflow",
                is_default=True,
            )
            workflow.created_by = user_uuid
            workflow.updated_by = user_uuid
            session.add(workflow)
            await session.flush()

            # Create statuses in a deterministic order
            # Sort by category for predictable ordering
            category_order = {
                "to_do": 0,
                "in_progress": 1,
                "in_review": 2,
                "blocked": 3,
                "done": 4,
            }
            sorted_statuses = sorted(
                status_to_category.items(),
                key=lambda item: (
                    category_order.get(item[1], 99),
                    item[0],
                ),
            )

            status_name_to_id: dict[str, UUID] = {}
            category_to_first_id: dict[str, UUID] = {}

            for sort_idx, (status_name, category) in enumerate(sorted_statuses):
                ws = WorkflowStatus(
                    workflow_id=workflow.id,
                    name=status_name,
                    category=category,
                    color=_STATUS_COLORS.get(category, "#9e9e9e"),
                    sort_order=sort_idx,
                )
                session.add(ws)
                await session.flush()
                status_name_to_id[status_name] = ws.id
                if category not in category_to_first_id:
                    category_to_first_id[category] = ws.id

            # Create transitions between all statuses (fully connected)
            all_status_ids = list(status_name_to_id.values())
            for from_id in all_status_ids:
                for to_id in all_status_ids:
                    if from_id != to_id:
                        transition = WorkflowTransition(
                            workflow_id=workflow.id,
                            from_status_id=from_id,
                            to_status_id=to_id,
                        )
                        session.add(transition)

            await session.flush()
            await _update_task(session, run_uuid, progress_pct=20)
            await session.commit()

            # Determine the initial status (first in sort order = to_do)
            initial_status_id = all_status_ids[0] if all_status_ids else None

            # -- 4. Create issue types (20-25%) -------------------------
            from app.models.issue_type import IssueType

            hierarchy_levels = 0
            if parsed_spec.tasks:
                hierarchy_levels = max(
                    t.hierarchy_level for t in parsed_spec.tasks
                )

            issue_type_by_level: dict[int, UUID] = {}
            for level in range(max(hierarchy_levels, 1) + 1):
                if level < len(_ISSUE_TYPE_DEFS):
                    type_def = _ISSUE_TYPE_DEFS[level]
                else:
                    # Level 3+ all become Sub-Tasks
                    type_def = _ISSUE_TYPE_DEFS[-1]

                it = IssueType(
                    project_id=project_id,
                    name=str(type_def["name"]),
                    icon=str(type_def["icon"]),
                    color="#1976d2",
                    hierarchy_level=level,
                    is_subtask=bool(type_def["is_subtask"]),
                    sort_order=level,
                )
                it.created_by = user_uuid
                it.updated_by = user_uuid
                session.add(it)
                await session.flush()
                issue_type_by_level[level] = it.id

            await _update_task(session, run_uuid, progress_pct=25)
            await session.commit()

            # -- 5. Create milestones (25-30%) --------------------------
            milestones_created = 0
            create_milestones = config.get("create_milestones", True)
            milestone_name_to_id: dict[str, UUID] = {}

            if create_milestones and parsed_spec.milestones:
                from app.services.milestone import MilestoneService

                milestone_service = MilestoneService(session)

                for ms_idx, ms in enumerate(parsed_spec.milestones):
                    milestone_type = ms.milestone_type or "custom"
                    # Validate milestone_type against known enum values
                    valid_types = {
                        "phase_gate", "deliverable", "payment",
                        "review", "custom",
                    }
                    if milestone_type not in valid_types:
                        milestone_type = "custom"

                    ms_data: dict = {
                        "name": ms.name,
                        "description": ms.description or "",
                        "milestone_type": milestone_type,
                        "status": "not_started",
                        "start_date": ms.start_date,
                        "due_date": ms.due_date,
                        "sort_order": ms_idx,
                    }
                    created_ms = await milestone_service.create_milestone(
                        project_id,
                        ms_data,
                        created_by=user_uuid,
                    )
                    milestone_name_to_id[ms.name] = created_ms.id
                    milestones_created += 1

                await session.commit()

            await _update_task(session, run_uuid, progress_pct=30)
            await session.commit()

            # -- 6. Create issues (30-85%) ------------------------------
            from app.services.issue import IssueService

            issue_service = IssueService(session)

            # Build resource mapping: document_name -> user_id
            resource_mapping_raw: dict[str, str | None] = config.get(
                "resource_mapping", {}
            )
            resource_mapping: dict[str, UUID | None] = {}
            for doc_name, uid in resource_mapping_raw.items():
                if uid:
                    resource_mapping[doc_name] = UUID(str(uid))
                else:
                    resource_mapping[doc_name] = None

            # Filter tasks if selected_phases specified
            selected_phases: list[str] | None = config.get("selected_phases")
            tasks_to_create = parsed_spec.tasks
            if selected_phases:
                tasks_to_create = [
                    t
                    for t in parsed_spec.tasks
                    if t.wbs
                    and any(
                        t.wbs == phase or t.wbs.startswith(phase + ".")
                        for phase in selected_phases
                    )
                ]

            wbs_to_issue_id: dict[str, UUID] = {}
            issues_created = 0
            total_tasks = len(tasks_to_create)

            for task_idx, task in enumerate(tasks_to_create):
                try:
                    # Determine issue type from hierarchy level
                    level = task.hierarchy_level
                    # Clamp level to available types
                    type_level = min(level - 1, max(issue_type_by_level.keys()))
                    type_level = max(type_level, 0)
                    issue_type_id = issue_type_by_level.get(
                        type_level, next(iter(issue_type_by_level.values()))
                    )

                    # Determine parent issue
                    parent_issue_id: UUID | None = None
                    if task.wbs:
                        parent_wbs = _get_parent_wbs(task.wbs)
                        if parent_wbs:
                            parent_issue_id = wbs_to_issue_id.get(parent_wbs)

                    # Determine assignee from resource mapping
                    assignee_id: UUID | None = None
                    if task.resource_names:
                        for rn in task.resource_names:
                            if rn in resource_mapping and resource_mapping[rn]:
                                assignee_id = resource_mapping[rn]
                                break

                    # Build description
                    desc_parts: list[str] = []
                    if task.notes:
                        desc_parts.append(task.notes)
                    if task.deliverable_ref:
                        desc_parts.append(
                            f"**Deliverable:** {task.deliverable_ref}"
                        )
                    if task.duration:
                        desc_parts.append(f"**Duration:** {task.duration}")
                    description = "\n\n".join(desc_parts) if desc_parts else None

                    # Estimated hours from duration
                    estimated_hours = _parse_duration_hours(task.duration)

                    issue_data: dict = {
                        "summary": task.name,
                        "description": description,
                        "issue_type_id": issue_type_id,
                        "parent_issue_id": parent_issue_id,
                        "assignee_id": assignee_id,
                        "planned_start": task.start_date,
                        "planned_end": task.end_date,
                        "sort_order": float(task_idx),
                        "priority": "medium",
                    }
                    if estimated_hours is not None:
                        issue_data["estimated_hours"] = estimated_hours

                    issue = await issue_service.create_issue(
                        project_id,
                        issue_data,
                        reporter_id=user_uuid,
                        created_by=user_uuid,
                    )

                    # Track WBS -> issue ID mapping
                    if task.wbs:
                        wbs_to_issue_id[task.wbs] = issue.id

                    # Update status if it differs from the initial status
                    if task.status and initial_status_id:
                        target_status_id = status_name_to_id.get(task.status)
                        if (
                            target_status_id
                            and target_status_id != initial_status_id
                        ):
                            issue.status_id = target_status_id
                            await session.flush()

                    issues_created += 1

                except Exception as issue_exc:
                    logger.warning(
                        "create_project_from_documents.issue_error",
                        wbs=task.wbs,
                        task_name=task.name,
                        error=str(issue_exc),
                    )

                # Update progress every 5% of tasks
                if total_tasks > 0:
                    pct_done = (task_idx + 1) / total_tasks
                    if (
                        int(pct_done * 100) % 5 == 0
                        or task_idx == total_tasks - 1
                    ):
                        progress = int(30 + 55 * pct_done)
                        await _update_task(
                            session, run_uuid, progress_pct=progress
                        )
                        await session.commit()

            await session.commit()

            # -- 7. Create issue links for predecessors (85-95%) --------
            await _update_task(session, run_uuid, progress_pct=85)
            await session.commit()

            from app.models.issue_relation import IssueLink, IssueLinkType

            dependencies_created = 0

            for task in tasks_to_create:
                if not task.predecessors or not task.wbs:
                    continue

                source_issue_id = wbs_to_issue_id.get(task.wbs)
                if not source_issue_id:
                    continue

                for pred_wbs in task.predecessors:
                    pred_wbs_clean = pred_wbs.strip()
                    target_issue_id = wbs_to_issue_id.get(pred_wbs_clean)
                    if not target_issue_id:
                        logger.debug(
                            "create_project.predecessor_not_found",
                            task_wbs=task.wbs,
                            predecessor_wbs=pred_wbs_clean,
                        )
                        continue

                    link = IssueLink(
                        source_issue_id=source_issue_id,
                        target_issue_id=target_issue_id,
                        link_type=IssueLinkType.DEPENDS_ON,
                        created_by=user_uuid,
                    )
                    session.add(link)
                    dependencies_created += 1

            await session.flush()
            await session.commit()

            await _update_task(session, run_uuid, progress_pct=95)
            await session.commit()

            # -- 8. Store result summary (100%) -------------------------
            result_data = {
                "project_id": str(project_id),
                "issues_created": issues_created,
                "milestones_created": milestones_created,
                "dependencies_created": dependencies_created,
            }

            await _update_task(
                session,
                run_uuid,
                status="completed",
                progress_pct=100,
                result_summary_json=result_data,
                completed_at=datetime.now(timezone.utc),
            )
            await session.commit()

            # Clean up uploaded files referenced by the analysis task
            file_paths_to_clean = (
                analysis_task.result_summary_json.get("_file_paths", [])
                if analysis_task.result_summary_json
                else []
            )
            for p in file_paths_to_clean:
                try:
                    os.remove(p)
                except OSError:
                    pass

            logger.info(
                "create_project_from_documents_completed",
                run_id=run_id,
                project_id=str(project_id),
                issues_created=issues_created,
                milestones_created=milestones_created,
                dependencies_created=dependencies_created,
            )
            return result_data

        except Exception as exc:
            logger.exception(
                "create_project_from_documents_failed", run_id=run_id
            )
            await session.rollback()
            async with async_session_factory() as err_session:
                await _update_task(
                    err_session,
                    run_uuid,
                    status="failed",
                    error_message=str(exc),
                    completed_at=datetime.now(timezone.utc),
                )
                await err_session.commit()
            return {"error": str(exc)}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _generate_key_prefix(name: str) -> str:
    """Generate a short project key prefix from a project name.

    Takes the first letter of each word (up to 4 characters) and
    uppercases the result.  Falls back to ``"IMP"`` for empty names.

    Examples::

        "My Great Project" -> "MGP"
        "Test" -> "T"
    """
    words = name.split()
    if not words:
        return "IMP"
    prefix = "".join(w[0] for w in words if w)[:4].upper()
    return prefix or "IMP"
