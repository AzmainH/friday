"""Integration tests for notification endpoints."""

import pytest
from httpx import AsyncClient

from tests.conftest import FAKE_UUID


@pytest.mark.asyncio
async def test_list_notifications(client: AsyncClient):
    """GET /api/v1/me/notifications returns paginated notifications."""
    response = await client.get("/api/v1/me/notifications")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "pagination" in data


@pytest.mark.asyncio
async def test_list_notifications_unread_filter(client: AsyncClient):
    """GET /me/notifications?is_read=false filters unread."""
    response = await client.get(
        "/api/v1/me/notifications", params={"is_read": "false"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "data" in data


@pytest.mark.asyncio
async def test_mark_notification_read_not_found(client: AsyncClient):
    """PUT /me/notifications/{bad_id}/read returns 404."""
    response = await client.put(f"/api/v1/me/notifications/{FAKE_UUID}/read")
    assert response.status_code in (404, 422)


@pytest.mark.asyncio
async def test_mark_notification_read(client: AsyncClient):
    """PUT /me/notifications/{id}/read marks notification as read."""
    list_resp = await client.get("/api/v1/me/notifications")
    notifications = list_resp.json().get("data", [])
    if notifications:
        notification_id = notifications[0]["id"]
        response = await client.put(
            f"/api/v1/me/notifications/{notification_id}/read"
        )
        assert response.status_code == 200
        assert "read" in response.json()["message"].lower()


@pytest.mark.asyncio
async def test_mark_all_read(client: AsyncClient):
    """PUT /api/v1/me/notifications/read-all marks all as read."""
    response = await client.put("/api/v1/me/notifications/read-all")
    assert response.status_code == 200
    assert "read" in response.json()["message"].lower()
