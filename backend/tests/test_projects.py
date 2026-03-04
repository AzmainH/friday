"""Integration tests for project endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_projects(client: AsyncClient):
    """GET /api/v1/projects returns paginated data."""
    response = await client.get("/api/v1/projects")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "pagination" in data
    assert isinstance(data["data"], list)


@pytest.mark.asyncio
async def test_list_projects_with_workspace(client: AsyncClient):
    """GET /api/v1/projects?workspace_id=default returns projects."""
    response = await client.get("/api/v1/projects", params={"workspace_id": "default"})
    assert response.status_code == 200
    data = response.json()
    assert "data" in data


@pytest.mark.asyncio
async def test_get_project_not_found(client: AsyncClient):
    """GET /api/v1/projects/{bad_id} returns 404."""
    fake_id = "00000000-0000-0000-0000-000000000099"
    response = await client.get(f"/api/v1/projects/{fake_id}")
    assert response.status_code in (404, 422)


@pytest.mark.asyncio
async def test_get_project_detail(client: AsyncClient):
    """GET /api/v1/projects/{id} returns project detail if data exists."""
    list_resp = await client.get("/api/v1/projects")
    projects = list_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        detail = await client.get(f"/api/v1/projects/{project_id}")
        assert detail.status_code == 200
        assert detail.json()["id"] == project_id


@pytest.mark.asyncio
async def test_create_project(client: AsyncClient):
    """POST /workspaces/{id}/projects creates a project if workspace exists."""
    # First find a workspace
    list_resp = await client.get("/api/v1/projects")
    projects = list_resp.json().get("data", [])
    if projects:
        workspace_id = projects[0].get("workspace_id")
        if workspace_id:
            payload = {
                "name": "Integration Test Project",
                "key_prefix": "ITP",
                "description": "Created by integration test",
            }
            response = await client.post(
                f"/api/v1/workspaces/{workspace_id}/projects", json=payload
            )
            assert response.status_code in (200, 201)
            created = response.json()
            assert created["name"] == "Integration Test Project"


@pytest.mark.asyncio
async def test_update_project(client: AsyncClient):
    """PUT /api/v1/projects/{id} updates project fields."""
    list_resp = await client.get("/api/v1/projects")
    projects = list_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        response = await client.put(
            f"/api/v1/projects/{project_id}",
            json={"description": "Updated by integration test"},
        )
        assert response.status_code == 200


@pytest.mark.asyncio
async def test_list_project_members(client: AsyncClient):
    """GET /api/v1/projects/{id}/members returns member list."""
    list_resp = await client.get("/api/v1/projects")
    projects = list_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        response = await client.get(f"/api/v1/projects/{project_id}/members")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
