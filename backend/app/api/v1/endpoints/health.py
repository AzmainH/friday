import structlog
from fastapi import APIRouter, Depends, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_db
from app.schemas.base import DetailedHealthResponse, HealthResponse

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/health", tags=["health"])


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
