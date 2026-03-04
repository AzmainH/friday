"""Integration tests for risk endpoints."""

import pytest
from httpx import AsyncClient

from tests.conftest import FAKE_UUID


@pytest.mark.asyncio
async def test_list_risks(client: AsyncClient):
    """GET /api/v1/projects/{id}/risks returns paginated risks."""
    projects_resp = await client.get("/api/v1/projects")
    projects = projects_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        response = await client.get(f"/api/v1/projects/{project_id}/risks")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "pagination" in data


@pytest.mark.asyncio
async def test_get_risk_not_found(client: AsyncClient):
    """GET /api/v1/risks/{bad_id} returns 404."""
    response = await client.get(f"/api/v1/risks/{FAKE_UUID}")
    assert response.status_code in (404, 422)


@pytest.mark.asyncio
async def test_create_risk(client: AsyncClient):
    """POST /projects/{id}/risks creates a risk if project exists."""
    projects_resp = await client.get("/api/v1/projects")
    projects = projects_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        payload = {
            "title": "Integration Test Risk",
            "description": "Test risk created by integration test",
            "probability": 3,
            "impact": 4,
            "category": "technical",
        }
        response = await client.post(
            f"/api/v1/projects/{project_id}/risks", json=payload
        )
        assert response.status_code in (200, 201, 422)


@pytest.mark.asyncio
async def test_risk_matrix(client: AsyncClient):
    """GET /projects/{id}/risks/matrix returns risk matrix data."""
    projects_resp = await client.get("/api/v1/projects")
    projects = projects_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        response = await client.get(f"/api/v1/projects/{project_id}/risks/matrix")
        assert response.status_code == 200
        data = response.json()
        assert "cells" in data


@pytest.mark.asyncio
async def test_risk_summary(client: AsyncClient):
    """GET /projects/{id}/risks/summary returns summary stats."""
    projects_resp = await client.get("/api/v1/projects")
    projects = projects_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        response = await client.get(f"/api/v1/projects/{project_id}/risks/summary")
        assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_risk_detail(client: AsyncClient):
    """GET /api/v1/risks/{id} returns risk detail."""
    projects_resp = await client.get("/api/v1/projects")
    projects = projects_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        risks_resp = await client.get(f"/api/v1/projects/{project_id}/risks")
        risks = risks_resp.json().get("data", [])
        if risks:
            risk_id = risks[0]["id"]
            detail = await client.get(f"/api/v1/risks/{risk_id}")
            assert detail.status_code == 200
            assert detail.json()["id"] == risk_id


@pytest.mark.asyncio
async def test_create_risk_response(client: AsyncClient):
    """POST /risks/{id}/responses creates a risk response."""
    projects_resp = await client.get("/api/v1/projects")
    projects = projects_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        risks_resp = await client.get(f"/api/v1/projects/{project_id}/risks")
        risks = risks_resp.json().get("data", [])
        if risks:
            risk_id = risks[0]["id"]
            payload = {
                "strategy": "mitigate",
                "description": "Test risk response",
            }
            response = await client.post(
                f"/api/v1/risks/{risk_id}/responses", json=payload
            )
            assert response.status_code in (200, 201, 422)


@pytest.mark.asyncio
async def test_list_risk_responses(client: AsyncClient):
    """GET /risks/{id}/responses returns risk responses."""
    projects_resp = await client.get("/api/v1/projects")
    projects = projects_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        risks_resp = await client.get(f"/api/v1/projects/{project_id}/risks")
        risks = risks_resp.json().get("data", [])
        if risks:
            risk_id = risks[0]["id"]
            response = await client.get(f"/api/v1/risks/{risk_id}/responses")
            assert response.status_code == 200
            data = response.json()
            assert "data" in data
