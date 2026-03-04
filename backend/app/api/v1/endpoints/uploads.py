from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.core.storage import get_storage
from app.schemas.issue_extras import UploadResponse
from app.services.issue_extras import UploadService

router = APIRouter(tags=["uploads"])

IMAGE_MIMES = {"image/png", "image/jpeg", "image/gif", "image/webp"}
DOCUMENT_MIMES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "text/plain",
    "application/zip",
}
ALLOWED_MIMES = IMAGE_MIMES | DOCUMENT_MIMES

MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_DOCUMENT_SIZE = 25 * 1024 * 1024  # 25 MB


@router.post("/uploads/images", response_model=UploadResponse, status_code=201)
async def upload_image(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    content_type = file.content_type or "application/octet-stream"

    # Validate MIME type
    if content_type not in ALLOWED_MIMES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"File type '{content_type}' not allowed. "
                f"Allowed: {', '.join(sorted(ALLOWED_MIMES))}"
            ),
        )

    # Read and validate size
    content = await file.read()
    is_image = content_type in IMAGE_MIMES
    max_size = MAX_IMAGE_SIZE if is_image else MAX_DOCUMENT_SIZE

    if len(content) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File size {len(content)} exceeds maximum of {max_size} bytes",
        )

    # Upload via storage backend
    storage = get_storage()
    filename = file.filename or ("image" if is_image else "document")
    storage_path = await storage.upload(content, filename, content_type)

    # Save metadata to DB
    service = UploadService(session)
    upload = await service.create_upload({
        "filename": file.filename or storage_path.split("/")[-1],
        "content_type": content_type,
        "size_bytes": len(content),
        "storage_path": storage_path,
        "uploaded_by": user_id,
    })
    return upload
