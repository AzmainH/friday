import structlog

logger = structlog.get_logger()


async def sample_task(ctx: dict, message: str) -> str:
    logger.info("sample_task_started", message=message)
    return f"Processed: {message}"
