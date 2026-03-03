from fastapi import APIRouter

from app.api.v1.endpoints import (
    health,
    organizations,
    projects,
    roles,
    teams,
    users,
    workspaces,
)

api_v1_router = APIRouter()
api_v1_router.include_router(health.router)
api_v1_router.include_router(users.router)
api_v1_router.include_router(organizations.router)
api_v1_router.include_router(workspaces.router)
api_v1_router.include_router(teams.router)
api_v1_router.include_router(projects.router)
api_v1_router.include_router(roles.router)
