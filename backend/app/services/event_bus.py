"""Event bus for publishing real-time events via Redis pub/sub."""

from __future__ import annotations

import json
from typing import Any

import structlog
from redis.asyncio import Redis

logger = structlog.get_logger(__name__)


class EventBus:
    """Publishes events to Redis pub/sub channels for WebSocket distribution.

    Channels:
        - ws:project:{id}  — project-scoped events
        - ws:user:{id}     — user-scoped events
        - ws:global         — broadcast to all connected clients
    """

    def __init__(self, redis: Redis) -> None:
        self.redis = redis

    async def publish_event(
        self,
        channel: str,
        event_type: str,
        payload: dict[str, Any],
        *,
        project_id: str | None = None,
        user_id: str | None = None,
    ) -> None:
        """Publish an event to a Redis pub/sub channel.

        Args:
            channel: Redis channel name (e.g. "ws:project:uuid").
            event_type: Event type identifier (e.g. "issue_created").
            payload: Event data to send to clients.
            project_id: Optional project context for the event.
            user_id: Optional user context for the event.
        """
        message: dict[str, Any] = {
            "type": event_type,
            "payload": payload,
        }
        if project_id:
            message["project_id"] = project_id
        if user_id:
            message["user_id"] = user_id

        try:
            await self.redis.publish(channel, json.dumps(message, default=str))
            await logger.adebug(
                "event_published",
                channel=channel,
                event_type=event_type,
            )
        except Exception:
            await logger.awarning(
                "event_publish_failed",
                channel=channel,
                event_type=event_type,
                exc_info=True,
            )

    async def publish_project_event(
        self,
        project_id: str,
        event_type: str,
        payload: dict[str, Any],
        *,
        user_id: str | None = None,
    ) -> None:
        """Publish an event scoped to a project."""
        await self.publish_event(
            channel=f"ws:project:{project_id}",
            event_type=event_type,
            payload=payload,
            project_id=project_id,
            user_id=user_id,
        )

    async def publish_user_event(
        self,
        user_id: str,
        event_type: str,
        payload: dict[str, Any],
    ) -> None:
        """Publish an event scoped to a specific user."""
        await self.publish_event(
            channel=f"ws:user:{user_id}",
            event_type=event_type,
            payload=payload,
            user_id=user_id,
        )

    async def publish_global_event(
        self,
        event_type: str,
        payload: dict[str, Any],
    ) -> None:
        """Publish an event to all connected clients."""
        await self.publish_event(
            channel="ws:global",
            event_type=event_type,
            payload=payload,
        )


def get_event_bus(redis: Redis) -> EventBus:
    """Create an EventBus instance from a Redis connection.

    Typical usage in an endpoint::

        bus = get_event_bus(request.app.state.redis)
        await bus.publish_project_event(...)
    """
    return EventBus(redis)
