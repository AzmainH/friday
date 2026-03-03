import csv
import os
import uuid as uuid_mod
from typing import Any
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import NotFoundException, ValidationException
from app.repositories.issue_extras import TaskStatusRepository


class ImportExportService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.task_repo = TaskStatusRepository(session)

    async def start_csv_import(
        self,
        project_id: UUID,
        file: UploadFile,
        column_mapping: dict[str, str],
        user_id: UUID,
    ) -> dict:
        """Save uploaded CSV to disk, create a TaskStatus, and enqueue the import task."""
        # Validate file type
        if file.content_type not in (
            "text/csv",
            "application/csv",
            "text/plain",
            "application/vnd.ms-excel",
        ):
            raise ValidationException(
                f"Invalid file type '{file.content_type}'. Expected a CSV file."
            )

        # Save file to disk
        import_dir = os.path.join(settings.UPLOAD_DIR, "imports")
        os.makedirs(import_dir, exist_ok=True)
        file_name = f"import_{uuid_mod.uuid4()}.csv"
        file_path = os.path.join(import_dir, file_name)

        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        # Create TaskStatus record
        task_status = await self.task_repo.create(
            {
                "task_type": "csv_import",
                "entity_id": project_id,
                "user_id": user_id,
                "status": "pending",
                "progress_pct": 0,
            }
        )

        # Attach run_id to column_mapping so the task knows its tracking ID
        mapping_with_run = dict(column_mapping)
        mapping_with_run["_run_id"] = str(task_status.id)

        # Enqueue the ARQ task
        from arq.connections import ArqRedis, create_pool

        from app.worker import get_redis_settings

        redis: ArqRedis = await create_pool(get_redis_settings())
        await redis.enqueue_job(
            "import_csv",
            str(project_id),
            file_path,
            mapping_with_run,
            str(user_id),
        )
        await redis.close()

        return {
            "task_id": task_status.id,
            "status": task_status.status,
            "message": "CSV import task enqueued successfully",
        }

    async def start_export(
        self,
        project_id: UUID,
        format: str,
        filters: dict[str, Any] | None,
        user_id: UUID,
    ) -> dict:
        """Create a TaskStatus and enqueue the export task."""
        if format != "csv":
            raise ValidationException(
                f"Unsupported export format '{format}'. Only 'csv' is supported."
            )

        task_status = await self.task_repo.create(
            {
                "task_type": "csv_export",
                "entity_id": project_id,
                "user_id": user_id,
                "status": "pending",
                "progress_pct": 0,
            }
        )

        from arq.connections import ArqRedis, create_pool

        from app.worker import get_redis_settings

        redis: ArqRedis = await create_pool(get_redis_settings())
        await redis.enqueue_job(
            "export_csv",
            str(project_id),
            filters,
            str(user_id),
            str(task_status.id),
        )
        await redis.close()

        return {
            "task_id": task_status.id,
            "status": task_status.status,
            "message": "Export task enqueued successfully",
        }

    async def get_task_status(self, task_id: UUID) -> object:
        """Retrieve a TaskStatus by ID."""
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise NotFoundException("Import/export task not found")
        return task

    async def get_column_preview(self, file_path: str) -> dict:
        """Read the first 5 rows of a CSV file for column mapping UI.

        Returns column names and sample data rows.
        """
        if not os.path.exists(file_path):
            raise NotFoundException("CSV file not found")

        with open(file_path, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            columns = reader.fieldnames or []
            sample_rows: list[dict[str, Any]] = []
            for i, row in enumerate(reader):
                if i >= 5:
                    break
                sample_rows.append(dict(row))

        return {
            "columns": list(columns),
            "sample_rows": sample_rows,
        }

    async def get_export_file_path(self, task_id: UUID) -> str:
        """Retrieve the file path for a completed export task."""
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise NotFoundException("Export task not found")

        if task.status != "completed":
            raise ValidationException(
                f"Export task is not yet completed (status: {task.status})"
            )

        result = task.result_summary_json
        if not result or "file_path" not in result:
            raise NotFoundException("Export file not found in task results")

        file_path = result["file_path"]
        if not os.path.exists(file_path):
            raise NotFoundException("Export file no longer exists on disk")

        return file_path
