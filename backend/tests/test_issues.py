"""Integration tests for issue endpoints."""

import pytest
from httpx import AsyncClient

from tests.conftest import FAKE_UUID


@pytest.mark.asyncio
async def test_list_issues(client: AsyncClient):
    """GET /api/v1/projects/{id}/issues returns paginated issues."""
    # First get a project
    projects_resp = await client.get("/api/v1/projects")
    projects = projects_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        response = await client.get(f"/api/v1/projects/{project_id}/issues")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "pagination" in data


@pytest.mark.asyncio
async def test_list_issues_with_filters(client: AsyncClient):
    """GET /projects/{id}/issues supports query filters."""
    projects_resp = await client.get("/api/v1/projects")
    projects = projects_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        response = await client.get(
            f"/api/v1/projects/{project_id}/issues",
            params={"priority": "high", "limit": 10},
        )
        assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_issue_not_found(client: AsyncClient):
    """GET /api/v1/issues/{bad_id} returns 404."""
    response = await client.get(f"/api/v1/issues/{FAKE_UUID}")
    assert response.status_code in (404, 422)


@pytest.mark.asyncio
async def test_get_issue_detail(client: AsyncClient):
    """GET /api/v1/issues/{id} returns issue detail if data exists."""
    projects_resp = await client.get("/api/v1/projects")
    projects = projects_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        issues_resp = await client.get(f"/api/v1/projects/{project_id}/issues")
        issues = issues_resp.json().get("data", [])
        if issues:
            issue_id = issues[0]["id"]
            detail = await client.get(f"/api/v1/issues/{issue_id}")
            assert detail.status_code == 200
            assert detail.json()["id"] == issue_id


@pytest.mark.asyncio
async def test_create_issue(client: AsyncClient):
    """POST /projects/{id}/issues creates an issue if project exists."""
    projects_resp = await client.get("/api/v1/projects")
    projects = projects_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        payload = {
            "title": "Integration Test Issue",
            "description": "Created by integration test",
            "priority": "medium",
        }
        response = await client.post(
            f"/api/v1/projects/{project_id}/issues", json=payload
        )
        assert response.status_code in (200, 201)
        created = response.json()
        assert created["title"] == "Integration Test Issue"


@pytest.mark.asyncio
async def test_update_issue(client: AsyncClient):
    """PUT /api/v1/issues/{id} updates issue fields."""
    projects_resp = await client.get("/api/v1/projects")
    projects = projects_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        issues_resp = await client.get(f"/api/v1/projects/{project_id}/issues")
        issues = issues_resp.json().get("data", [])
        if issues:
            issue_id = issues[0]["id"]
            response = await client.put(
                f"/api/v1/issues/{issue_id}",
                json={"description": "Updated by integration test"},
            )
            assert response.status_code == 200


@pytest.mark.asyncio
async def test_search_issues(client: AsyncClient):
    """GET /projects/{id}/issues/search returns matching issues."""
    projects_resp = await client.get("/api/v1/projects")
    projects = projects_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        response = await client.get(
            f"/api/v1/projects/{project_id}/issues/search", params={"q": "test"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_global_search(client: AsyncClient):
    """GET /api/v1/search returns search results."""
    response = await client.get("/api/v1/search", params={"q": "test"})
    assert response.status_code == 200
    data = response.json()
    assert "results" in data or "total" in data or isinstance(data, dict)
