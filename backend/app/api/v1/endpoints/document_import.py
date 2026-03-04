from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.document_import import (
    DocumentAnalysisResponse,
    DocumentImportResponse,
    DocumentProjectCreateRequest,
    DocumentUploadResponse,
)
from app.schemas.issue_extras import TaskStatusResponse
from app.services.document_import import DocumentImportService

router = APIRouter(tags=["document-import"])


@router.post(
    "/document-import/analyze",
    response_model=DocumentUploadResponse,
    status_code=202,
)
async def analyze_documents(
    files: list[UploadFile] = File(...),
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Upload one or more project documents (.docx / .xlsx) for AI analysis.

    The analysis runs as a background task.  Poll the returned ``task_id``
    via ``GET /document-import/tasks/{task_id}`` until the status is
    ``completed``, then fetch the structured result with
    ``GET /document-import/analysis/{task_id}``.
    """
    service = DocumentImportService(session)
    result = await service.upload_and_analyze(files, user_id)
    return DocumentUploadResponse(
        task_id=result["task_id"],
        status=result["status"],
        message=result["message"],
    )


@router.get(
    "/document-import/analysis/{task_id}",
    response_model=DocumentAnalysisResponse,
)
async def get_analysis_result(
    task_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Retrieve the structured analysis result for a completed analysis task.

    Returns project metadata, task previews, resource matches, milestone
    info, and detected statuses extracted from the uploaded documents.
    """
    service = DocumentImportService(session)
    result = await service.get_analysis_result(task_id)
    return DocumentAnalysisResponse(**result)


@router.post(
    "/document-import/create",
    response_model=DocumentImportResponse,
    status_code=202,
)
async def create_project_from_analysis(
    body: DocumentProjectCreateRequest,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Start project creation from a completed document analysis.

    Accepts configuration overrides (resource mapping, status mapping,
    milestone toggle, etc.) and enqueues a background task to create the
    full project with workflow, issue types, milestones, issues, and
    dependency links.

    Poll ``GET /document-import/tasks/{task_id}`` for progress.
    """
    service = DocumentImportService(session)
    result = await service.start_project_creation(
        body.model_dump(mode="json"),
        user_id,
    )
    return DocumentImportResponse(
        task_id=result["task_id"],
        status=result["status"],
        message=result["message"],
    )


@router.get(
    "/document-import/tasks/{task_id}",
    response_model=TaskStatusResponse,
)
async def get_task_status(
    task_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Poll the status and progress of a document import background task.

    Returns the current status (``pending``, ``running``, ``completed``,
    ``failed``), progress percentage, and result/error data when available.
    """
    service = DocumentImportService(session)
    return await service.get_task_status(task_id)
