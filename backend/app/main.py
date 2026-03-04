from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from redis.asyncio import from_url as redis_from_url

from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.core.database import async_session_factory
from app.core.errors import register_exception_handlers
from app.core.logging_config import setup_logging
from app.core.middleware import (
    RateLimitMiddleware,
    RequestIDMiddleware,
    RequestLoggingMiddleware,
)
from app.core.monitoring import MetricsMiddleware, metrics_endpoint
from app.core.websocket import ConnectionManager
from app.seed_demo import seed_demo_project

logger = structlog.get_logger(__name__)

ws_manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    app.state.redis = redis_from_url(
        settings.REDIS_URL, decode_responses=True
    )
    app.state.ws_manager = ws_manager
    # Seed demo project data (idempotent)
    try:
        async with async_session_factory() as session:
            await seed_demo_project(session)
    except Exception:
        logger.warning("demo_seed_skipped", reason="seed_demo failed (DB may not be ready)")

    # Start Redis pub/sub listener for WebSocket message routing
    await ws_manager.start_redis_listener(app.state.redis)

    logger.info("friday_backend_started", version=settings.VERSION)
    yield
    await ws_manager.stop_redis_listener()
    await app.state.redis.aclose()
    logger.info("friday_backend_stopped")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

register_exception_handlers(app)

app.add_middleware(MetricsMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)
app.add_route("/metrics", metrics_endpoint)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, user_id: str | None = None):
    """WebSocket endpoint for real-time updates.

    Connect with: ws://localhost:8000/ws?user_id=<uuid>

    Clients can send JSON messages to subscribe to project channels::

        {"action": "subscribe", "project_id": "<uuid>"}
        {"action": "unsubscribe", "project_id": "<uuid>"}
    """
    if not user_id:
        await websocket.close(code=4001, reason="user_id query parameter required")
        return

    await ws_manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            if action == "subscribe" and "project_id" in data:
                ws_manager.subscribe_to_project(user_id, data["project_id"])
            elif action == "unsubscribe" and "project_id" in data:
                ws_manager.unsubscribe_from_project(user_id, data["project_id"])
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id)
    except Exception:
        ws_manager.disconnect(websocket, user_id)
        await logger.awarning("ws_error", user_id=user_id, exc_info=True)
