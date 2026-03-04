"""Integration tests for report endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_run_velocity_report(client: AsyncClient):
    """POST /api/v1/reports/run with velocity type returns report data."""
    payload = {
        "report_type": "velocity",
        "config": {},
    }
    response = await client.post("/api/v1/reports/run", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["report_type"] == "velocity"
    assert "data" in data
    assert "generated_at" in data


@pytest.mark.asyncio
async def test_run_burndown_report(client: AsyncClient):
    """POST /api/v1/reports/run with burndown type returns report data."""
    payload = {
        "report_type": "burndown",
        "config": {},
    }
    response = await client.post("/api/v1/reports/run", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["report_type"] == "burndown"
    assert "data" in data


@pytest.mark.asyncio
async def test_run_report_with_project_config(client: AsyncClient):
    """POST /api/v1/reports/run with project_id in config."""
    projects_resp = await client.get("/api/v1/projects")
    projects = projects_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        payload = {
            "report_type": "velocity",
            "config": {"project_id": project_id},
        }
        response = await client.post("/api/v1/reports/run", json=payload)
        assert response.status_code == 200


@pytest.mark.asyncio
async def test_save_report(client: AsyncClient):
    """POST /api/v1/reports saves a report configuration."""
    payload = {
        "name": "Integration Test Report",
        "report_type": "velocity",
        "config_json": {"sprint_count": 5},
    }
    response = await client.post("/api/v1/reports", json=payload)
    assert response.status_code in (200, 201)
    created = response.json()
    assert created["name"] == "Integration Test Report"
    assert created["report_type"] == "velocity"


@pytest.mark.asyncio
async def test_list_saved_reports(client: AsyncClient):
    """GET /api/v1/reports returns saved reports."""
    response = await client.get("/api/v1/reports")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "pagination" in data


@pytest.mark.asyncio
async def test_run_saved_report(client: AsyncClient):
    """GET /api/v1/reports/{id}/run executes a saved report."""
    # Create a report first
    create_payload = {
        "name": "Run Test Report",
        "report_type": "velocity",
        "config_json": {},
    }
    create_resp = await client.post("/api/v1/reports", json=create_payload)
    if create_resp.status_code in (200, 201):
        report_id = create_resp.json()["id"]
        response = await client.get(f"/api/v1/reports/{report_id}/run")
        assert response.status_code == 200
        data = response.json()
        assert "report_type" in data
        assert "data" in data
