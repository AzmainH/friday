"""Prometheus metrics and monitoring utilities."""

import re
import time

from prometheus_client import (
    CONTENT_TYPE_LATEST,
    Counter,
    Gauge,
    Histogram,
    generate_latest,
)
from starlette.requests import Request
from starlette.responses import Response

# ── Metrics definitions ─────────────────────────────────────────

REQUEST_COUNT = Counter(
    "friday_http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status_code"],
)

REQUEST_LATENCY = Histogram(
    "friday_http_request_duration_seconds",
    "HTTP request latency",
    ["method", "endpoint"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
)

ACTIVE_CONNECTIONS = Gauge(
    "friday_active_websocket_connections",
    "Active WebSocket connections",
)

DB_POOL_SIZE = Gauge(
    "friday_db_pool_size",
    "Database connection pool size",
)

ACTIVE_REQUESTS = Gauge(
    "friday_active_requests",
    "Currently processing requests",
)

_UUID_RE = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")


# ── Metrics endpoint ────────────────────────────────────────────


async def metrics_endpoint(request: Request) -> Response:
    """Prometheus metrics scraping endpoint."""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST,
    )


# ── Metrics middleware ──────────────────────────────────────────


class MetricsMiddleware:
    """ASGI middleware to collect per-request metrics."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope)
        method = request.method
        path = request.url.path

        # Skip metrics endpoint itself to avoid self-referencing noise
        if path == "/metrics":
            await self.app(scope, receive, send)
            return

        # Normalise path: replace UUIDs with {id} for cardinality control
        metric_path = _UUID_RE.sub("{id}", path)

        ACTIVE_REQUESTS.inc()
        start_time = time.monotonic()

        status_code = 500

        async def send_wrapper(message):
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            duration = time.monotonic() - start_time
            ACTIVE_REQUESTS.dec()
            REQUEST_COUNT.labels(
                method=method, endpoint=metric_path, status_code=status_code
            ).inc()
            REQUEST_LATENCY.labels(method=method, endpoint=metric_path).observe(duration)
