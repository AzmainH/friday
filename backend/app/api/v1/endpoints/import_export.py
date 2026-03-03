import os
import uuid as uuid_mod
from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_current_user_id, get_db
from app.schemas.import_export import (
    ExportRequest,
    ImportExportTaskResponse,
    ImportPreviewResponse,
    ImportRequest,
)
from app.schemas.issue_extras import TaskStatusResponse
from app.services.import_export import ImportExportService

router = APIRouter(tags=["import-export"])


@router.post(
    "/projects/{project_id}/import/preview",
    response_model=ImportPreviewResponse,
)
async def import_preview(
    project_id: UUID,
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Upload a CSV file and get a preview of columns and sample rows
    for the column mapping UI."""
    # Save file temporarily
    import_dir = os.path.join(settings.UPLOAD_DIR, "imports")
    os.makedirs(import_dir, exist_ok=True)
    file_name = f"preview_{uuid_mod.uuid4()}.csv"
    file_path = os.path.join(import_dir, file_name)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    service = ImportExportService(session)
    preview = await service.get_column_preview(file_path)

    # Clean up the preview file
    try:
        os.remove(file_path)
    except OSError:
        pass

    return ImportPreviewResponse(
        columns=preview["columns"],
        sample_rows=preview["sample_rows"],
    )


@router.post(
    "/projects/{project_id}/import",
    response_model=ImportExportTaskResponse,
    status_code=202,
)
async def start_import(
    project_id: UUID,
    column_mapping: ImportRequest = Depends(),
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Start a CSV import with the provided column mapping.

    The import runs as a background task. Poll the returned task_id for status.
    """
    service = ImportExportService(session)
    result = await service.start_csv_import(
        project_id, file, column_mapping.column_mapping, user_id
    )
    return ImportExportTaskResponse(
        task_id=result["task_id"],
        status=result["status"],
        message=result["message"],
    )


@router.post(
    "/projects/{project_id}/export",
    response_model=ImportExportTaskResponse,
    status_code=202,
)
async def start_export(
    project_id: UUID,
    body: ExportRequest,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Start a CSV export of project issues.

    The export runs as a background task. Poll the returned task_id for status,
    then download the file when complete.
    """
    service = ImportExportService(session)
    result = await service.start_export(
        project_id, body.format, body.filters, user_id
    )
    return ImportExportTaskResponse(
        task_id=result["task_id"],
        status=result["status"],
        message=result["message"],
    )


@router.get(
    "/import-export/tasks/{task_id}",
    response_model=TaskStatusResponse,
)
async def get_import_export_task_status(
    task_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    """Poll the status of an import or export background task."""
    service = ImportExportService(session)
    return await service.get_task_status(task_id)


@router.get("/import-export/download/{task_id}")
async def download_export(
    task_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Download a completed export file."""
    service = ImportExportService(session)
    file_path = await service.get_export_file_path(task_id)

    file_name = os.path.basename(file_path)
    return FileResponse(
        path=file_path,
        filename=file_name,
        media_type="text/csv",
    )
