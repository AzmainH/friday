"""Integration tests for dashboard endpoints."""

import pytest
from httpx import AsyncClient

from tests.conftest import FAKE_UUID


@pytest.mark.asyncio
async def test_personal_dashboard(client: AsyncClient):
    """GET /api/v1/dashboards/personal returns personal dashboard data."""
    response = await client.get("/api/v1/dashboards/personal")
    assert response.status_code == 200
    data = response.json()
    assert "assigned_to_me" in data
    assert "overdue" in data
    assert "due_this_week" in data
    assert "recent_activity" in data
    assert "my_projects" in data


@pytest.mark.asyncio
async def test_project_dashboard(client: AsyncClient):
    """GET /projects/{id}/dashboard returns project dashboard data."""
    projects_resp = await client.get("/api/v1/projects")
    projects = projects_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        response = await client.get(f"/api/v1/projects/{project_id}/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "issue_counts_by_status" in data
        assert "issue_counts_by_priority" in data
        assert "progress_pct" in data


@pytest.mark.asyncio
async def test_project_dashboard_not_found(client: AsyncClient):
    """GET /projects/{bad_id}/dashboard returns 404."""
    response = await client.get(f"/api/v1/projects/{FAKE_UUID}/dashboard")
    assert response.status_code in (404, 422)


@pytest.mark.asyncio
async def test_portfolio_dashboard(client: AsyncClient):
    """GET /workspaces/{id}/portfolio-dashboard returns portfolio data."""
    projects_resp = await client.get("/api/v1/projects")
    projects = projects_resp.json().get("data", [])
    if projects:
        workspace_id = projects[0].get("workspace_id")
        if workspace_id:
            response = await client.get(
                f"/api/v1/workspaces/{workspace_id}/portfolio-dashboard"
            )
            assert response.status_code == 200
            data = response.json()
            assert "projects_by_status" in data
            assert "total_issues" in data


@pytest.mark.asyncio
async def test_list_custom_dashboards(client: AsyncClient):
    """GET /api/v1/dashboards returns custom dashboards."""
    response = await client.get("/api/v1/dashboards")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "pagination" in data


@pytest.mark.asyncio
async def test_create_custom_dashboard(client: AsyncClient):
    """POST /api/v1/dashboards creates a custom dashboard."""
    payload = {
        "name": "Integration Test Dashboard",
        "layout_json": {},
        "widgets_json": [],
    }
    response = await client.post("/api/v1/dashboards", json=payload)
    assert response.status_code in (200, 201)
    created = response.json()
    assert created["name"] == "Integration Test Dashboard"


@pytest.mark.asyncio
async def test_get_custom_dashboard(client: AsyncClient):
    """GET /api/v1/dashboards/{id} returns dashboard detail."""
    # Create one first
    payload = {"name": "Test Dashboard Detail", "layout_json": {}, "widgets_json": []}
    create_resp = await client.post("/api/v1/dashboards", json=payload)
    if create_resp.status_code in (200, 201):
        dashboard_id = create_resp.json()["id"]
        detail = await client.get(f"/api/v1/dashboards/{dashboard_id}")
        assert detail.status_code == 200
        assert detail.json()["id"] == dashboard_id
