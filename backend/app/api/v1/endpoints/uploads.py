import os
import uuid as uuid_mod
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.issue_extras import UploadResponse
from app.services.issue_extras import UploadService

router = APIRouter(tags=["uploads"])

ALLOWED_MIMES = {"image/png", "image/jpeg", "image/gif", "image/webp"}
MAX_SIZE = 5 * 1024 * 1024  # 5MB
UPLOAD_DIR = Path("/app/uploads/images")


@router.post("/uploads/images", response_model=UploadResponse, status_code=201)
async def upload_image(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    # Validate MIME type
    if file.content_type not in ALLOWED_MIMES:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' not allowed. Allowed: {', '.join(ALLOWED_MIMES)}",
        )

    # Read and validate size
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size {len(content)} exceeds maximum of {MAX_SIZE} bytes",
        )

    # Generate unique filename
    ext = os.path.splitext(file.filename or "image")[1] or ".png"
    unique_name = f"{uuid_mod.uuid4()}{ext}"
    storage_path = f"uploads/images/{unique_name}"

    # Ensure directory exists and write file
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    file_path = UPLOAD_DIR / unique_name
    file_path.write_bytes(content)

    # Save metadata to DB
    service = UploadService(session)
    upload = await service.create_upload({
        "filename": file.filename or unique_name,
        "content_type": file.content_type,
        "size_bytes": len(content),
        "storage_path": storage_path,
        "uploaded_by": user_id,
    })
    return upload
