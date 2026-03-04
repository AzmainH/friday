from urllib.parse import urlparse

from arq import cron
from arq.connections import RedisSettings

from app.core.config import settings
from app.tasks.base import sample_task
from app.tasks.ai import ai_risk_prediction, ai_smart_schedule, ai_summarize
from app.tasks.automation import evaluate_automations
from app.tasks.document_import import analyze_documents, create_project_from_documents
from app.tasks.import_export import export_csv, import_csv
from app.tasks.recurring import process_recurring_tasks
from app.tasks.scheduling import run_auto_schedule
from app.tasks.notification_tasks import send_daily_digest, send_email_notification
from app.tasks.sla import check_sla_breaches


def get_redis_settings() -> RedisSettings:
    parsed = urlparse(settings.REDIS_URL)
    return RedisSettings(
        host=parsed.hostname or "localhost",
        port=parsed.port or 6379,
        database=int(parsed.path.lstrip("/") or "0"),
    )


class WorkerSettings:
    functions = [
        sample_task,
        run_auto_schedule,
        evaluate_automations,
        ai_smart_schedule,
        ai_risk_prediction,
        ai_summarize,
        import_csv,
        export_csv,
        analyze_documents,
        create_project_from_documents,
        send_email_notification,
        send_daily_digest,
    ]
    cron_jobs = [
        cron(process_recurring_tasks, hour={0, 6, 12, 18}),
        cron(check_sla_breaches, minute={0, 15, 30, 45}),
        cron(send_daily_digest, hour={8}),
    ]
    redis_settings = get_redis_settings()
    max_jobs = 10
    job_timeout = 300
