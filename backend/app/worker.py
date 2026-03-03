from urllib.parse import urlparse

from arq import cron  # noqa: F401
from arq.connections import RedisSettings

from app.core.config import settings
from app.tasks.base import sample_task


def get_redis_settings() -> RedisSettings:
    parsed = urlparse(settings.REDIS_URL)
    return RedisSettings(
        host=parsed.hostname or "localhost",
        port=parsed.port or 6379,
        database=int(parsed.path.lstrip("/") or "0"),
    )


class WorkerSettings:
    functions = [sample_task]
    redis_settings = get_redis_settings()
    max_jobs = 10
    job_timeout = 300
