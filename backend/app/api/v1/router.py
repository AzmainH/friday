from fastapi import APIRouter

from app.api.v1.endpoints import (
    ai,
    approvals,
    automations,
    baselines,
    budgets,
    comments,
    components,
    custom_fields,
    dashboards,
    decisions,
    document_import,
    favorites,
    health,
    import_export,
    intake,
    issue_links,
    issue_types,
    issues,
    labels,
    milestones,
    notifications,
    organizations,
    portfolio,
    projects,
    raci,
    recent_items,
    recurring,
    roadmaps,
    roles,
    saved_views,
    scheduling,
    search,
    sla,
    stakeholders,
    task_status_ep,
    teams,
    templates,
    time_entries,
    uploads,
    users,
    versions,
    wiki,
    workflows,
    workspaces,
)

api_v1_router = APIRouter()

# Phase 1 endpoints
api_v1_router.include_router(health.router)
api_v1_router.include_router(users.router)
api_v1_router.include_router(organizations.router)
api_v1_router.include_router(workspaces.router)
api_v1_router.include_router(teams.router)
api_v1_router.include_router(projects.router)
api_v1_router.include_router(roles.router)

# Phase 2 endpoints
api_v1_router.include_router(issues.router)
api_v1_router.include_router(issue_types.router)
api_v1_router.include_router(workflows.router)
api_v1_router.include_router(comments.router)
api_v1_router.include_router(issue_links.router)
api_v1_router.include_router(custom_fields.router)
api_v1_router.include_router(time_entries.router)
api_v1_router.include_router(labels.router)
api_v1_router.include_router(components.router)
api_v1_router.include_router(versions.router)
api_v1_router.include_router(saved_views.router)
api_v1_router.include_router(notifications.router)
api_v1_router.include_router(favorites.router)
api_v1_router.include_router(recent_items.router)
api_v1_router.include_router(task_status_ep.router)
api_v1_router.include_router(uploads.router)

# Phase 4-10 endpoints
api_v1_router.include_router(milestones.router)
api_v1_router.include_router(baselines.router)
api_v1_router.include_router(raci.router)
api_v1_router.include_router(budgets.router)
api_v1_router.include_router(decisions.router)
api_v1_router.include_router(stakeholders.router)
api_v1_router.include_router(roadmaps.router)
api_v1_router.include_router(scheduling.router)
api_v1_router.include_router(portfolio.router)
api_v1_router.include_router(search.router)
api_v1_router.include_router(recurring.router)
api_v1_router.include_router(sla.router)
api_v1_router.include_router(intake.router)
api_v1_router.include_router(approvals.router)
api_v1_router.include_router(wiki.router)
api_v1_router.include_router(dashboards.router)
api_v1_router.include_router(automations.router)
api_v1_router.include_router(ai.router)
api_v1_router.include_router(import_export.router)
api_v1_router.include_router(document_import.router)
api_v1_router.include_router(templates.router)
