import time
import uuid
from typing import Any

import structlog
from fastapi import Request
from fastapi.encoders import jsonable_encoder
from redis.asyncio import Redis
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

from app.core.config import settings
from app.core.errors import ErrorCode, ErrorResponse


class RequestIDMiddleware:
    """ASGI middleware that assigns a unique request ID to every request."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] not in ("http", "websocket"):
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))
        request_id = headers.get(b"x-request-id", b"").decode() or str(uuid.uuid4())

        scope.setdefault("state", {})
        scope["state"]["request_id"] = request_id

        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)

        async def send_with_request_id(message: dict[str, Any]) -> None:
            if message["type"] == "http.response.start":
                response_headers: list[tuple[bytes, bytes]] = list(
                    message.get("headers", [])
                )
                response_headers.append(
                    (b"x-request-id", request_id.encode())
                )
                message["headers"] = response_headers
            await send(message)

        await self.app(scope, receive, send_with_request_id)


class RequestLoggingMiddleware:
    """ASGI middleware that logs request start/end with duration."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app
        self.logger = structlog.get_logger(__name__)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope)
        request_id = scope.get("state", {}).get("request_id", "unknown")
        method = request.method
        path = request.url.path

        await self.logger.ainfo(
            "request_started",
            method=method,
            path=path,
            request_id=request_id,
        )

        start = time.perf_counter()
        status_code = 500

        async def capture_status(message: dict[str, Any]) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message.get("status", 500)
            await send(message)

        try:
            await self.app(scope, receive, capture_status)
        finally:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            await self.logger.ainfo(
                "request_finished",
                method=method,
                path=path,
                status_code=status_code,
                duration_ms=duration_ms,
                request_id=request_id,
            )


class RateLimitMiddleware:
    """ASGI middleware implementing Redis-based token-bucket rate limiting.

    Pulls the Redis connection from ``scope["app"].state.redis`` so the
    connection can be initialised in the application lifespan handler.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app
        self.logger = structlog.get_logger(__name__)
        self.default_limit = settings.RATE_LIMIT_PER_MINUTE

    def _get_redis(self, scope: Scope) -> Redis | None:
        app = scope.get("app")
        if app is None:
            return None
        return getattr(getattr(app, "state", None), "redis", None)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope)

        identifier = (
            request.headers.get("x-user-id")
            or (request.client.host if request.client else "unknown")
        )

        route = scope.get("route")
        limit = self.default_limit
        if route and hasattr(route, "tags"):
            for tag in getattr(route, "tags", []):
                if isinstance(tag, str) and tag.startswith("rate_limit:"):
                    try:
                        limit = int(tag.split(":")[1])
                    except (ValueError, IndexError):
                        pass

        redis = self._get_redis(scope)
        if redis is None:
            await self.app(scope, receive, send)
            return

        redis_key = f"rate_limit:{identifier}"

        try:
            current = await redis.incr(redis_key)
            if current == 1:
                await redis.expire(redis_key, 60)

            if current > limit:
                ttl = await redis.ttl(redis_key)
                retry_after = max(ttl, 1)
                request_id = scope.get("state", {}).get("request_id", "unknown")
                await self.logger.awarning(
                    "rate_limit_exceeded",
                    identifier=identifier,
                    current=current,
                    limit=limit,
                    request_id=request_id,
                )
                body = ErrorResponse(
                    code=ErrorCode.RATE_LIMITED,
                    message="Rate limit exceeded. Try again later.",
                    request_id=request_id,
                )
                response = JSONResponse(
                    status_code=429,
                    content=jsonable_encoder(body),
                    headers={"Retry-After": str(retry_after)},
                )
                await response(scope, receive, send)
                return

        except Exception:
            await self.logger.awarning(
                "rate_limit_redis_error",
                identifier=identifier,
                exc_info=True,
            )

        await self.app(scope, receive, send)
