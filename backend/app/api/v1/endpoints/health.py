import time

import structlog
from fastapi import APIRouter, Depends, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import engine
from app.core.deps import get_db
from app.schemas.base import DetailedHealthResponse, HealthResponse

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/health", tags=["health"])

_start_time = time.monotonic()


@router.get("", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="healthy", version=settings.VERSION)


@router.get("/db", response_model=DetailedHealthResponse)
async def health_db(session: AsyncSession = Depends(get_db)):
    db_status = "connected"
    redis_status = "unknown"
    try:
        await session.execute(text("SELECT 1"))
    except Exception:
        logger.warning("database_health_check_failed", exc_info=True)
        db_status = "error"

    overall = "healthy" if db_status == "connected" else "unhealthy"
    return DetailedHealthResponse(
        status=overall,
        version=settings.VERSION,
        database=db_status,
        redis=redis_status,
    )


@router.get("/redis", response_model=DetailedHealthResponse)
async def health_redis(request: Request):
    db_status = "unknown"
    redis_status = "connected"
    try:
        redis = request.app.state.redis
        await redis.ping()
    except Exception:
        logger.warning("redis_health_check_failed", exc_info=True)
        redis_status = "error"

    overall = "healthy" if redis_status == "connected" else "unhealthy"
    return DetailedHealthResponse(
        status=overall,
        version=settings.VERSION,
        database=db_status,
        redis=redis_status,
    )


@router.get("/detailed")
async def health_detailed(
    request: Request,
    session: AsyncSession = Depends(get_db),
):
    """Comprehensive health check with database pool stats, Redis latency, and uptime."""
    uptime = time.monotonic() - _start_time
    result: dict = {
        "status": "healthy",
        "version": settings.VERSION,
        "uptime_seconds": round(uptime, 2),
    }

    # -- Database ---------------------------------------------------------
    db_info: dict = {"status": "connected"}
    try:
        await session.execute(text("SELECT 1"))
        # Expose pool statistics from the sync-side pool (asyncpg wraps it)
        pool = engine.pool
        pool_status = pool.status()  # type: ignore[union-attr]
        db_info["pool"] = {
            "size": pool.size(),
            "checked_in": pool.checkedin(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow(),
            "pool_status": pool_status,
        }
    except Exception:
        logger.warning("detailed_health_db_failed", exc_info=True)
        db_info["status"] = "error"
        result["status"] = "degraded"
    result["database"] = db_info

    # -- Redis ------------------------------------------------------------
    redis_info: dict = {"status": "connected"}
    try:
        redis = request.app.state.redis
        t0 = time.monotonic()
        await redis.ping()
        redis_info["ping_ms"] = round((time.monotonic() - t0) * 1000, 2)
    except Exception:
        logger.warning("detailed_health_redis_failed", exc_info=True)
        redis_info["status"] = "error"
        result["status"] = "degraded"
    result["redis"] = redis_info

    # -- Worker queue depth (best-effort) ---------------------------------
    try:
        redis = request.app.state.redis
        queue_len = await redis.llen("arq:queue")
        result["worker"] = {"queue_depth": queue_len}
    except Exception:
        result["worker"] = {"queue_depth": None}

    return result
