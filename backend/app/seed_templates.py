"""
Seed script for system project templates.

Run as:  python -m app.seed_templates
"""

import asyncio
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory
from app.models.template import ProjectTemplate

logger = logging.getLogger(__name__)

# ── Template definitions ────────────────────────────────────────

SYSTEM_TEMPLATES: list[dict] = [
    # ── 1. Blank ────────────────────────────────────────────────
    {
        "name": "Blank",
        "description": "A minimal project with just three statuses. Good for small tasks or when you want to build your own workflow.",
        "icon": "file",
        "color": "#9e9e9e",
        "is_system": True,
        "template_data": {
            "workflow": {
                "name": "Simple Workflow",
                "statuses": [
                    {"name": "To Do", "category": "to_do", "color": "#9e9e9e", "sort_order": 0},
                    {"name": "In Progress", "category": "in_progress", "color": "#2196f3", "sort_order": 1},
                    {"name": "Done", "category": "done", "color": "#4caf50", "sort_order": 2},
                ],
                "transitions": [
                    {"from": "To Do", "to": "In Progress"},
                    {"from": "In Progress", "to": "Done"},
                    {"from": "In Progress", "to": "To Do"},
                    {"from": "Done", "to": "In Progress"},
                ],
            },
            "issue_types": [
                {"name": "Task", "icon": "check-square", "color": "#1976d2", "hierarchy_level": 0, "is_subtask": False},
            ],
            "labels": [],
            "custom_fields": [],
            "default_settings": {},
        },
    },
    # ── 2. Standard PM ──────────────────────────────────────────
    {
        "name": "Standard PM",
        "description": "Full project management template with epics, stories, bugs, and a seven-status workflow. Suitable for most software teams.",
        "icon": "layout",
        "color": "#1976d2",
        "is_system": True,
        "template_data": {
            "workflow": {
                "name": "Standard Workflow",
                "statuses": [
                    {"name": "Backlog", "category": "to_do", "color": "#9e9e9e", "sort_order": 0},
                    {"name": "To Do", "category": "to_do", "color": "#b0bec5", "sort_order": 1},
                    {"name": "In Progress", "category": "in_progress", "color": "#2196f3", "sort_order": 2},
                    {"name": "In Review", "category": "in_review", "color": "#ff9800", "sort_order": 3},
                    {"name": "QA", "category": "in_review", "color": "#9c27b0", "sort_order": 4},
                    {"name": "Done", "category": "done", "color": "#4caf50", "sort_order": 5},
                    {"name": "Cancelled", "category": "done", "color": "#f44336", "sort_order": 6},
                ],
                "transitions": [
                    {"from": "Backlog", "to": "To Do"},
                    {"from": "To Do", "to": "In Progress"},
                    {"from": "In Progress", "to": "In Review"},
                    {"from": "In Progress", "to": "To Do"},
                    {"from": "In Review", "to": "QA"},
                    {"from": "In Review", "to": "In Progress"},
                    {"from": "QA", "to": "Done"},
                    {"from": "QA", "to": "In Progress"},
                    {"from": "Done", "to": "To Do"},
                    {"from": "Backlog", "to": "Cancelled"},
                    {"from": "To Do", "to": "Cancelled"},
                    {"from": "In Progress", "to": "Cancelled"},
                ],
            },
            "issue_types": [
                {"name": "Epic", "icon": "zap", "color": "#9c27b0", "hierarchy_level": 2, "is_subtask": False},
                {"name": "Story", "icon": "book-open", "color": "#4caf50", "hierarchy_level": 1, "is_subtask": False},
                {"name": "Task", "icon": "check-square", "color": "#1976d2", "hierarchy_level": 0, "is_subtask": False},
                {"name": "Bug", "icon": "alert-circle", "color": "#f44336", "hierarchy_level": 0, "is_subtask": False},
                {"name": "Subtask", "icon": "minus-square", "color": "#607d8b", "hierarchy_level": -1, "is_subtask": True},
            ],
            "labels": [
                {"name": "bug", "color": "#f44336"},
                {"name": "enhancement", "color": "#4caf50"},
                {"name": "documentation", "color": "#2196f3"},
                {"name": "high-priority", "color": "#ff5722"},
                {"name": "low-priority", "color": "#9e9e9e"},
                {"name": "blocked", "color": "#ff9800"},
                {"name": "tech-debt", "color": "#795548"},
                {"name": "design", "color": "#e91e63"},
            ],
            "custom_fields": [],
            "default_settings": {},
        },
    },
    # ── 3. Waterfall ────────────────────────────────────────────
    {
        "name": "Waterfall",
        "description": "Phase-based workflow following the traditional waterfall methodology. Ideal for projects with clearly defined sequential stages.",
        "icon": "layers",
        "color": "#00897b",
        "is_system": True,
        "template_data": {
            "workflow": {
                "name": "Waterfall Workflow",
                "statuses": [
                    {"name": "Requirements", "category": "to_do", "color": "#9e9e9e", "sort_order": 0},
                    {"name": "Design", "category": "in_progress", "color": "#2196f3", "sort_order": 1},
                    {"name": "Development", "category": "in_progress", "color": "#ff9800", "sort_order": 2},
                    {"name": "Testing", "category": "in_review", "color": "#9c27b0", "sort_order": 3},
                    {"name": "Deployment", "category": "done", "color": "#4caf50", "sort_order": 4},
                ],
                "transitions": [
                    {"from": "Requirements", "to": "Design"},
                    {"from": "Design", "to": "Development"},
                    {"from": "Design", "to": "Requirements"},
                    {"from": "Development", "to": "Testing"},
                    {"from": "Development", "to": "Design"},
                    {"from": "Testing", "to": "Deployment"},
                    {"from": "Testing", "to": "Development"},
                ],
            },
            "issue_types": [
                {"name": "Requirement", "icon": "file-text", "color": "#1976d2", "hierarchy_level": 1, "is_subtask": False},
                {"name": "Task", "icon": "check-square", "color": "#4caf50", "hierarchy_level": 0, "is_subtask": False},
                {"name": "Defect", "icon": "alert-circle", "color": "#f44336", "hierarchy_level": 0, "is_subtask": False},
                {"name": "Milestone", "icon": "flag", "color": "#ff9800", "hierarchy_level": 2, "is_subtask": False},
            ],
            "labels": [
                {"name": "critical-path", "color": "#f44336"},
                {"name": "dependency", "color": "#ff9800"},
                {"name": "sign-off-required", "color": "#9c27b0"},
                {"name": "change-request", "color": "#2196f3"},
                {"name": "risk", "color": "#ff5722"},
            ],
            "custom_fields": [],
            "default_settings": {},
        },
    },
    # ── 4. Consulting ───────────────────────────────────────────
    {
        "name": "Consulting",
        "description": "Client-facing engagement workflow with stages from intake through implementation. Built for consulting and professional services teams.",
        "icon": "briefcase",
        "color": "#5e35b1",
        "is_system": True,
        "template_data": {
            "workflow": {
                "name": "Consulting Workflow",
                "statuses": [
                    {"name": "Intake", "category": "to_do", "color": "#9e9e9e", "sort_order": 0},
                    {"name": "Discovery", "category": "in_progress", "color": "#2196f3", "sort_order": 1},
                    {"name": "Analysis", "category": "in_progress", "color": "#ff9800", "sort_order": 2},
                    {"name": "Recommendation", "category": "in_review", "color": "#9c27b0", "sort_order": 3},
                    {"name": "Implementation", "category": "in_progress", "color": "#00897b", "sort_order": 4},
                    {"name": "Review", "category": "done", "color": "#4caf50", "sort_order": 5},
                ],
                "transitions": [
                    {"from": "Intake", "to": "Discovery"},
                    {"from": "Discovery", "to": "Analysis"},
                    {"from": "Discovery", "to": "Intake"},
                    {"from": "Analysis", "to": "Recommendation"},
                    {"from": "Analysis", "to": "Discovery"},
                    {"from": "Recommendation", "to": "Implementation"},
                    {"from": "Recommendation", "to": "Analysis"},
                    {"from": "Implementation", "to": "Review"},
                    {"from": "Implementation", "to": "Recommendation"},
                    {"from": "Review", "to": "Implementation"},
                ],
            },
            "issue_types": [
                {"name": "Engagement", "icon": "briefcase", "color": "#5e35b1", "hierarchy_level": 2, "is_subtask": False},
                {"name": "Deliverable", "icon": "package", "color": "#1976d2", "hierarchy_level": 1, "is_subtask": False},
                {"name": "Task", "icon": "check-square", "color": "#4caf50", "hierarchy_level": 0, "is_subtask": False},
                {"name": "Finding", "icon": "search", "color": "#ff9800", "hierarchy_level": 0, "is_subtask": False},
                {"name": "Action Item", "icon": "arrow-right", "color": "#f44336", "hierarchy_level": 0, "is_subtask": False},
            ],
            "labels": [
                {"name": "client-facing", "color": "#5e35b1"},
                {"name": "internal", "color": "#607d8b"},
                {"name": "urgent", "color": "#f44336"},
                {"name": "billable", "color": "#4caf50"},
                {"name": "non-billable", "color": "#9e9e9e"},
                {"name": "follow-up", "color": "#ff9800"},
            ],
            "custom_fields": [],
            "default_settings": {},
        },
    },
    # ── 5. Product Development ──────────────────────────────────
    {
        "name": "Product Development",
        "description": "End-to-end product development pipeline from backlog to release. Designed for product teams shipping software continuously.",
        "icon": "box",
        "color": "#e65100",
        "is_system": True,
        "template_data": {
            "workflow": {
                "name": "Product Development Workflow",
                "statuses": [
                    {"name": "Backlog", "category": "to_do", "color": "#9e9e9e", "sort_order": 0},
                    {"name": "Sprint Planning", "category": "to_do", "color": "#b0bec5", "sort_order": 1},
                    {"name": "In Development", "category": "in_progress", "color": "#2196f3", "sort_order": 2},
                    {"name": "Code Review", "category": "in_review", "color": "#ff9800", "sort_order": 3},
                    {"name": "QA", "category": "in_review", "color": "#9c27b0", "sort_order": 4},
                    {"name": "Staging", "category": "in_review", "color": "#00897b", "sort_order": 5},
                    {"name": "Released", "category": "done", "color": "#4caf50", "sort_order": 6},
                ],
                "transitions": [
                    {"from": "Backlog", "to": "Sprint Planning"},
                    {"from": "Sprint Planning", "to": "In Development"},
                    {"from": "Sprint Planning", "to": "Backlog"},
                    {"from": "In Development", "to": "Code Review"},
                    {"from": "In Development", "to": "Sprint Planning"},
                    {"from": "Code Review", "to": "QA"},
                    {"from": "Code Review", "to": "In Development"},
                    {"from": "QA", "to": "Staging"},
                    {"from": "QA", "to": "In Development"},
                    {"from": "Staging", "to": "Released"},
                    {"from": "Staging", "to": "QA"},
                    {"from": "Released", "to": "Backlog"},
                ],
            },
            "issue_types": [
                {"name": "Epic", "icon": "zap", "color": "#9c27b0", "hierarchy_level": 2, "is_subtask": False},
                {"name": "Feature", "icon": "star", "color": "#ff9800", "hierarchy_level": 1, "is_subtask": False},
                {"name": "Story", "icon": "book-open", "color": "#4caf50", "hierarchy_level": 1, "is_subtask": False},
                {"name": "Task", "icon": "check-square", "color": "#1976d2", "hierarchy_level": 0, "is_subtask": False},
                {"name": "Bug", "icon": "alert-circle", "color": "#f44336", "hierarchy_level": 0, "is_subtask": False},
                {"name": "Subtask", "icon": "minus-square", "color": "#607d8b", "hierarchy_level": -1, "is_subtask": True},
            ],
            "labels": [
                {"name": "frontend", "color": "#2196f3"},
                {"name": "backend", "color": "#4caf50"},
                {"name": "infrastructure", "color": "#ff9800"},
                {"name": "ux", "color": "#e91e63"},
                {"name": "performance", "color": "#9c27b0"},
                {"name": "security", "color": "#f44336"},
                {"name": "tech-debt", "color": "#795548"},
                {"name": "hotfix", "color": "#ff5722"},
            ],
            "custom_fields": [],
            "default_settings": {},
        },
    },
]


async def seed_templates(session: AsyncSession) -> None:
    """Insert system templates if they do not already exist (idempotent)."""
    for tpl_data in SYSTEM_TEMPLATES:
        name = tpl_data["name"]
        query = select(ProjectTemplate).where(ProjectTemplate.name == name)
        result = await session.execute(query)
        existing = result.scalar_one_or_none()

        if existing is not None:
            logger.info("Template '%s' already exists — skipping", name)
            continue

        template = ProjectTemplate(**tpl_data)
        session.add(template)
        logger.info("Created system template '%s'", name)

    await session.flush()


async def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    logger.info("Seeding project templates...")

    async with async_session_factory() as session:
        try:
            await seed_templates(session)
            await session.commit()
            logger.info("Template seeding complete.")
        except Exception:
            await session.rollback()
            logger.exception("Template seeding failed")
            raise


if __name__ == "__main__":
    asyncio.run(main())
