"""WebSocket Connection Manager with Redis pub/sub for cross-process messaging."""

from __future__ import annotations

import asyncio
import json

import structlog
from fastapi import WebSocket
from redis.asyncio import Redis

logger = structlog.get_logger(__name__)


class ConnectionManager:
    """Manages WebSocket connections and routes messages via Redis pub/sub.

    Tracks active connections keyed by user_id and subscribes to Redis
    channels to distribute real-time events to connected clients.
    """

    def __init__(self) -> None:
        self._connections: dict[str, list[WebSocket]] = {}
        self._project_subscriptions: dict[str, set[str]] = {}  # project_id -> set of user_ids
        self._subscriber_task: asyncio.Task | None = None

    async def connect(self, websocket: WebSocket, user_id: str) -> None:
        """Accept a WebSocket connection and register it for a user."""
        await websocket.accept()
        if user_id not in self._connections:
            self._connections[user_id] = []
        self._connections[user_id].append(websocket)
        await logger.ainfo("ws_connected", user_id=user_id, total=len(self._connections[user_id]))

    def disconnect(self, websocket: WebSocket, user_id: str) -> None:
        """Remove a WebSocket connection for a user."""
        if user_id in self._connections:
            self._connections[user_id] = [
                ws for ws in self._connections[user_id] if ws is not websocket
            ]
            if not self._connections[user_id]:
                del self._connections[user_id]
        logger.info("ws_disconnected", user_id=user_id)

    def subscribe_to_project(self, user_id: str, project_id: str) -> None:
        """Subscribe a user to project-level events."""
        if project_id not in self._project_subscriptions:
            self._project_subscriptions[project_id] = set()
        self._project_subscriptions[project_id].add(user_id)

    def unsubscribe_from_project(self, user_id: str, project_id: str) -> None:
        """Unsubscribe a user from project-level events."""
        if project_id in self._project_subscriptions:
            self._project_subscriptions[project_id].discard(user_id)
            if not self._project_subscriptions[project_id]:
                del self._project_subscriptions[project_id]

    async def broadcast_to_user(self, user_id: str, message: dict) -> None:
        """Send a message to all connections for a specific user."""
        connections = self._connections.get(user_id, [])
        dead: list[WebSocket] = []
        for ws in connections:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, user_id)

    async def broadcast_to_project(self, project_id: str, message: dict) -> None:
        """Send a message to all users subscribed to a project."""
        user_ids = self._project_subscriptions.get(project_id, set()).copy()
        for user_id in user_ids:
            await self.broadcast_to_user(user_id, message)

    async def broadcast_global(self, message: dict) -> None:
        """Send a message to all connected users."""
        for user_id in list(self._connections.keys()):
            await self.broadcast_to_user(user_id, message)

    async def start_redis_listener(self, redis: Redis) -> None:
        """Start background task that listens to Redis pub/sub and routes messages."""
        self._subscriber_task = asyncio.create_task(self._redis_listener(redis))
        await logger.ainfo("ws_redis_listener_started")

    async def stop_redis_listener(self) -> None:
        """Cancel the Redis listener background task."""
        if self._subscriber_task and not self._subscriber_task.done():
            self._subscriber_task.cancel()
            try:
                await self._subscriber_task
            except asyncio.CancelledError:
                pass
        await logger.ainfo("ws_redis_listener_stopped")

    async def _redis_listener(self, redis: Redis) -> None:
        """Subscribe to Redis ws:* channels and route messages to WebSocket clients."""
        pubsub = redis.pubsub()
        try:
            await pubsub.psubscribe("ws:*")
            await logger.ainfo("ws_redis_subscribed", pattern="ws:*")
            async for raw_message in pubsub.listen():
                if raw_message["type"] not in ("pmessage",):
                    continue
                try:
                    channel: str = raw_message["channel"]
                    data = json.loads(raw_message["data"])
                    await self._route_message(channel, data)
                except Exception:
                    await logger.awarning("ws_message_route_error", exc_info=True)
        except asyncio.CancelledError:
            raise
        except Exception:
            await logger.aerror("ws_redis_listener_error", exc_info=True)
        finally:
            await pubsub.punsubscribe("ws:*")
            await pubsub.aclose()

    async def _route_message(self, channel: str, data: dict) -> None:
        """Route a message from a Redis channel to the appropriate WebSocket clients."""
        parts = channel.split(":")
        # ws:project:{id}
        if len(parts) >= 3 and parts[1] == "project":
            project_id = parts[2]
            await self.broadcast_to_project(project_id, data)
        # ws:user:{id}
        elif len(parts) >= 3 and parts[1] == "user":
            user_id = parts[2]
            await self.broadcast_to_user(user_id, data)
        # ws:global
        elif len(parts) >= 2 and parts[1] == "global":
            await self.broadcast_global(data)
