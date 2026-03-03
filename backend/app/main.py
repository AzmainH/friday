from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
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
from app.seed_demo import seed_demo_project

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    app.state.redis = redis_from_url(
        settings.REDIS_URL, decode_responses=True
    )
    # Seed demo project data (idempotent)
    try:
        async with async_session_factory() as session:
            await seed_demo_project(session)
    except Exception:
        logger.warning("demo_seed_skipped", reason="seed_demo failed (DB may not be ready)")

    logger.info("friday_backend_started", version=settings.VERSION)
    yield
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
