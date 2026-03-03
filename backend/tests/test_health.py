import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "0.1.0"


@pytest.mark.asyncio
@pytest.mark.skipif(True, reason="Requires running database")
async def test_health_db(client: AsyncClient):
    response = await client.get("/api/v1/health/db")
    assert response.status_code == 200
    data = response.json()
    assert data["database"] in ("connected", "error")


@pytest.mark.asyncio
@pytest.mark.skipif(True, reason="Requires running Redis")
async def test_health_redis(client: AsyncClient):
    response = await client.get("/api/v1/health/redis")
    assert response.status_code == 200
    data = response.json()
    assert data["redis"] in ("connected", "error")
