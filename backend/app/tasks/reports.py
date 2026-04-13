"""ARQ background tasks for scheduled PDF report generation."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID

import structlog

from app.core.config import settings
from app.core.database import async_session_factory

logger = structlog.get_logger(__name__)


async def generate_scheduled_report(
    ctx: dict,
    project_id: str,
    user_id: str,
    period: str = "week",
) -> dict:
    """Generate a PDF executive report, store to uploads directory, create notification.

    Called by ARQ on a schedule or triggered manually.
    Returns metadata about the generated report.
    """
    logger.info(
        "scheduled_report_started",
        project_id=project_id,
        user_id=user_id,
        period=period,
    )

    project_uuid = UUID(project_id)
    user_uuid = UUID(user_id)

    async with async_session_factory() as session:
        try:
            from app.services.pdf_export import PDFExportService

            service = PDFExportService(session)
            pdf_bytes = await service.generate_exec_report(project_uuid, period)

            # Store PDF to uploads directory
            upload_dir = Path(settings.UPLOAD_DIR) / "reports"
            upload_dir.mkdir(parents=True, exist_ok=True)

            timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
            filename = f"exec-report-{project_id}-{timestamp}.pdf"
            filepath = upload_dir / filename

            filepath.write_bytes(pdf_bytes)

            file_size = len(pdf_bytes)
            relative_path = f"reports/{filename}"

            logger.info(
                "scheduled_report_stored",
                project_id=project_id,
                filepath=relative_path,
                size_bytes=file_size,
            )

            # Create a notification for the user
            await _create_report_notification(
                session,
                user_uuid,
                project_uuid,
                filename,
                relative_path,
            )
            await session.commit()

            return {
                "status": "completed",
                "filename": filename,
                "filepath": relative_path,
                "size_bytes": file_size,
            }

        except Exception as exc:
            logger.exception(
                "scheduled_report_failed",
                project_id=project_id,
                error=str(exc),
            )
            await session.rollback()
            return {"status": "failed", "error": str(exc)}


async def _create_report_notification(
    session,
    user_id: UUID,
    project_id: UUID,
    filename: str,
    filepath: str,
) -> None:
    """Create a notification to inform the user their report is ready."""
    from app.models.notification import Notification

    notification = Notification(
        user_id=user_id,
        type="report_ready",
        title="Executive report generated",
        body=f"Your executive report is ready: {filename}",
        entity_type="report",
        project_id=project_id,
        is_read=False,
    )
    session.add(notification)
