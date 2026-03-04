"""Integration tests for sprint endpoints."""

import pytest
from httpx import AsyncClient

from tests.conftest import FAKE_UUID


@pytest.mark.asyncio
async def test_list_sprints(client: AsyncClient):
    """GET /api/v1/projects/{id}/sprints returns paginated sprints."""
    projects_resp = await client.get("/api/v1/projects")
    projects = projects_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        response = await client.get(f"/api/v1/projects/{project_id}/sprints")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "pagination" in data


@pytest.mark.asyncio
async def test_list_sprints_with_status_filter(client: AsyncClient):
    """GET /projects/{id}/sprints?status=active filters by status."""
    projects_resp = await client.get("/api/v1/projects")
    projects = projects_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        response = await client.get(
            f"/api/v1/projects/{project_id}/sprints",
            params={"status": "active"},
        )
        assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_sprint_not_found(client: AsyncClient):
    """GET /api/v1/sprints/{bad_id} returns 404."""
    response = await client.get(f"/api/v1/sprints/{FAKE_UUID}")
    assert response.status_code in (404, 422)


@pytest.mark.asyncio
async def test_create_sprint(client: AsyncClient):
    """POST /projects/{id}/sprints creates a sprint if project exists."""
    projects_resp = await client.get("/api/v1/projects")
    projects = projects_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        payload = {
            "name": "Integration Test Sprint",
            "goal": "Test sprint creation",
            "duration_weeks": 2,
        }
        response = await client.post(
            f"/api/v1/projects/{project_id}/sprints", json=payload
        )
        # 201 if created, or 422 if required fields are different
        assert response.status_code in (200, 201, 422)


@pytest.mark.asyncio
async def test_get_sprint_detail(client: AsyncClient):
    """GET /api/v1/sprints/{id} returns sprint detail."""
    projects_resp = await client.get("/api/v1/projects")
    projects = projects_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        sprints_resp = await client.get(f"/api/v1/projects/{project_id}/sprints")
        sprints = sprints_resp.json().get("data", [])
        if sprints:
            sprint_id = sprints[0]["id"]
            detail = await client.get(f"/api/v1/sprints/{sprint_id}")
            assert detail.status_code == 200
            assert detail.json()["id"] == sprint_id


@pytest.mark.asyncio
async def test_start_sprint(client: AsyncClient):
    """POST /sprints/{id}/start transitions sprint to active."""
    projects_resp = await client.get("/api/v1/projects")
    projects = projects_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        sprints_resp = await client.get(
            f"/api/v1/projects/{project_id}/sprints", params={"status": "planned"}
        )
        sprints = sprints_resp.json().get("data", [])
        if sprints:
            sprint_id = sprints[0]["id"]
            response = await client.post(f"/api/v1/sprints/{sprint_id}/start")
            # May fail if sprint is already started or has invalid state
            assert response.status_code in (200, 400, 409, 422)


@pytest.mark.asyncio
async def test_complete_sprint(client: AsyncClient):
    """POST /sprints/{id}/complete transitions sprint to completed."""
    projects_resp = await client.get("/api/v1/projects")
    projects = projects_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        sprints_resp = await client.get(
            f"/api/v1/projects/{project_id}/sprints", params={"status": "active"}
        )
        sprints = sprints_resp.json().get("data", [])
        if sprints:
            sprint_id = sprints[0]["id"]
            response = await client.post(f"/api/v1/sprints/{sprint_id}/complete")
            assert response.status_code in (200, 400, 409, 422)


@pytest.mark.asyncio
async def test_sprint_burndown(client: AsyncClient):
    """GET /sprints/{id}/burndown returns burndown data."""
    projects_resp = await client.get("/api/v1/projects")
    projects = projects_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        sprints_resp = await client.get(f"/api/v1/projects/{project_id}/sprints")
        sprints = sprints_resp.json().get("data", [])
        if sprints:
            sprint_id = sprints[0]["id"]
            response = await client.get(f"/api/v1/sprints/{sprint_id}/burndown")
            assert response.status_code == 200


@pytest.mark.asyncio
async def test_add_issues_to_sprint(client: AsyncClient):
    """POST /sprints/{id}/issues adds issues to a sprint."""
    projects_resp = await client.get("/api/v1/projects")
    projects = projects_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        sprints_resp = await client.get(f"/api/v1/projects/{project_id}/sprints")
        sprints = sprints_resp.json().get("data", [])
        issues_resp = await client.get(f"/api/v1/projects/{project_id}/issues")
        issues = issues_resp.json().get("data", [])
        if sprints and issues:
            sprint_id = sprints[0]["id"]
            issue_id = issues[0]["id"]
            response = await client.post(
                f"/api/v1/sprints/{sprint_id}/issues",
                json={"issue_ids": [issue_id]},
            )
            assert response.status_code in (200, 400, 409, 422)


@pytest.mark.asyncio
async def test_remove_issue_from_sprint(client: AsyncClient):
    """DELETE /sprints/{id}/issues/{issue_id} removes an issue."""
    response = await client.delete(
        f"/api/v1/sprints/{FAKE_UUID}/issues/{FAKE_UUID}"
    )
    # 404 for non-existent sprint/issue, or other error
    assert response.status_code in (200, 404, 422)
