from __future__ import annotations

import os
import uuid as uuid_mod
from typing import Any
from uuid import UUID

import structlog
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import NotFoundException, ValidationException
from app.repositories.issue_extras import TaskStatusRepository

logger = structlog.get_logger(__name__)

ALLOWED_MIME_TYPES: set[str] = {
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",
}

ALLOWED_EXTENSIONS: set[str] = {".docx", ".xlsx"}


def _validate_file(file: UploadFile) -> str:
    """Validate uploaded file type and return the normalized extension.

    Accepts .docx and .xlsx files by MIME type or extension.
    Raises ValidationException for unsupported file types.
    """
    filename = file.filename or ""
    _, ext = os.path.splitext(filename.lower())

    content_type = file.content_type or ""

    if content_type in ALLOWED_MIME_TYPES:
        # For application/octet-stream, fall back to extension check
        if content_type == "application/octet-stream":
            if ext not in ALLOWED_EXTENSIONS:
                raise ValidationException(
                    f"Invalid file '{filename}'. Only .docx and .xlsx files are accepted."
                )
        return ext if ext in ALLOWED_EXTENSIONS else _ext_from_mime(content_type)

    # MIME type not in allow-list -- reject
    raise ValidationException(
        f"Invalid file type '{content_type}' for '{filename}'. "
        "Only .docx and .xlsx files are accepted."
    )


def _ext_from_mime(content_type: str) -> str:
    """Map a known MIME type to a file extension."""
    mapping = {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    }
    return mapping.get(content_type, ".bin")


class DocumentImportService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.task_repo = TaskStatusRepository(session)

    async def upload_and_analyze(
        self,
        files: list[UploadFile],
        user_id: UUID,
    ) -> dict[str, Any]:
        """Validate and save uploaded documents, then enqueue analysis.

        Accepts .docx and .xlsx files.  Saves each file to
        ``UPLOAD_DIR/document_imports/`` with a UUID filename, creates a
        ``TaskStatus`` record, and enqueues the ``analyze_documents`` ARQ job.

        Returns a dict with ``task_id``, ``status``, and ``message``.
        """
        if not files:
            raise ValidationException("At least one file must be uploaded.")

        # Validate all files before writing any to disk
        file_extensions: list[str] = []
        for f in files:
            ext = _validate_file(f)
            file_extensions.append(ext)

        # Persist files to disk
        import_dir = os.path.join(settings.UPLOAD_DIR, "document_imports")
        os.makedirs(import_dir, exist_ok=True)

        saved_paths: list[str] = []
        saved_types: list[str] = []
        for file, ext in zip(files, file_extensions):
            file_name = f"{uuid_mod.uuid4()}{ext}"
            file_path = os.path.join(import_dir, file_name)

            content = await file.read()
            with open(file_path, "wb") as fh:
                fh.write(content)

            saved_paths.append(file_path)
            saved_types.append(ext.lstrip("."))

            logger.info(
                "document_import.file_saved",
                file_path=file_path,
                original_name=file.filename,
                size_bytes=len(content),
            )

        # Create TaskStatus record
        task_status = await self.task_repo.create(
            {
                "task_type": "document_analysis",
                "entity_id": None,
                "user_id": user_id,
                "status": "pending",
                "progress_pct": 0,
            }
        )

        # Enqueue the ARQ job
        from arq.connections import ArqRedis, create_pool

        from app.worker import get_redis_settings

        redis: ArqRedis = await create_pool(get_redis_settings())
        await redis.enqueue_job(
            "analyze_documents",
            saved_paths,
            saved_types,
            str(user_id),
            str(task_status.id),
        )
        await redis.close()

        logger.info(
            "document_import.analysis_enqueued",
            task_id=str(task_status.id),
            file_count=len(saved_paths),
        )

        return {
            "task_id": task_status.id,
            "status": task_status.status,
            "message": "Document analysis task enqueued successfully",
        }

    async def get_analysis_result(self, task_id: UUID) -> dict[str, Any]:
        """Retrieve the analysis result for a completed document analysis task.

        Raises ``NotFoundException`` if the task does not exist, or
        ``ValidationException`` if the task is not a completed analysis.
        """
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise NotFoundException("Document analysis task not found")

        if task.task_type != "document_analysis":
            raise ValidationException(
                f"Task '{task_id}' is not a document analysis task "
                f"(type: {task.task_type})."
            )

        if task.status != "completed":
            raise ValidationException(
                f"Document analysis task is not yet completed "
                f"(status: {task.status})."
            )

        return task.result_summary_json or {}

    async def start_project_creation(
        self,
        request_data: dict[str, Any],
        user_id: UUID,
    ) -> dict[str, Any]:
        """Validate the analysis reference and enqueue project creation.

        ``request_data`` should contain the fields from
        ``DocumentProjectCreateRequest``.  The referenced
        ``analysis_task_id`` must point to a completed document analysis
        task.

        Returns a dict with ``task_id``, ``status``, and ``message``.
        """
        analysis_task_id = request_data.get("analysis_task_id")
        if not analysis_task_id:
            raise ValidationException("analysis_task_id is required.")

        # Validate the referenced analysis task
        analysis_task = await self.task_repo.get_by_id(analysis_task_id)
        if not analysis_task:
            raise NotFoundException(
                f"Analysis task '{analysis_task_id}' not found."
            )

        if analysis_task.task_type != "document_analysis":
            raise ValidationException(
                f"Task '{analysis_task_id}' is not a document analysis task."
            )

        if analysis_task.status != "completed":
            raise ValidationException(
                f"Analysis task '{analysis_task_id}' is not completed "
                f"(status: {analysis_task.status})."
            )

        # Create TaskStatus record for project creation
        task_status = await self.task_repo.create(
            {
                "task_type": "document_project_creation",
                "entity_id": None,
                "user_id": user_id,
                "status": "pending",
                "progress_pct": 0,
            }
        )

        # Enqueue the ARQ job
        from arq.connections import ArqRedis, create_pool

        from app.worker import get_redis_settings

        redis: ArqRedis = await create_pool(get_redis_settings())
        await redis.enqueue_job(
            "create_project_from_documents",
            request_data,
            str(user_id),
            str(task_status.id),
        )
        await redis.close()

        logger.info(
            "document_import.project_creation_enqueued",
            task_id=str(task_status.id),
            analysis_task_id=str(analysis_task_id),
        )

        return {
            "task_id": task_status.id,
            "status": task_status.status,
            "message": "Document project creation task enqueued successfully",
        }

    async def get_task_status(self, task_id: UUID) -> Any:
        """Retrieve a TaskStatus record by ID.

        Raises ``NotFoundException`` if the task does not exist.
        """
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise NotFoundException("Document import task not found")
        return task
