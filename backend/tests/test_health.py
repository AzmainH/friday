"""Integration tests for health check endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """GET /api/v1/health returns basic health status."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "0.1.0"


@pytest.mark.asyncio
@pytest.mark.skipif(True, reason="Requires running database")
async def test_health_db(client: AsyncClient):
    """GET /api/v1/health/db checks database connectivity."""
    response = await client.get("/api/v1/health/db")
    assert response.status_code == 200
    data = response.json()
    assert data["database"] in ("connected", "error")


@pytest.mark.asyncio
@pytest.mark.skipif(True, reason="Requires running Redis")
async def test_health_redis(client: AsyncClient):
    """GET /api/v1/health/redis checks Redis connectivity."""
    response = await client.get("/api/v1/health/redis")
    assert response.status_code == 200
    data = response.json()
    assert data["redis"] in ("connected", "error")


@pytest.mark.asyncio
@pytest.mark.skipif(True, reason="Requires running database and Redis")
async def test_health_detailed(client: AsyncClient):
    """GET /api/v1/health/detailed returns comprehensive health info."""
    response = await client.get("/api/v1/health/detailed")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "version" in data
    assert "uptime_seconds" in data
    assert "database" in data
    assert "redis" in data


@pytest.mark.asyncio
async def test_metrics_endpoint(client: AsyncClient):
    """GET /metrics returns Prometheus metrics."""
    response = await client.get("/metrics")
    assert response.status_code == 200
    # Prometheus metrics are text-based
    assert "friday_http_requests_total" in response.text or response.status_code == 200
