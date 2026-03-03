from fastapi import APIRouter

from app.api.v1.endpoints import (
    comments,
    components,
    custom_fields,
    favorites,
    health,
    issue_links,
    issue_types,
    issues,
    labels,
    notifications,
    organizations,
    projects,
    recent_items,
    roles,
    saved_views,
    task_status_ep,
    teams,
    time_entries,
    uploads,
    users,
    versions,
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
