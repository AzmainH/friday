"""Pluggable file storage backend (local filesystem or S3)."""
import uuid
from abc import ABC, abstractmethod
from pathlib import Path

from app.core.config import settings


class StorageBackend(ABC):
    @abstractmethod
    async def upload(self, file_data: bytes, filename: str, content_type: str) -> str:
        """Upload file, return storage path."""
        ...

    @abstractmethod
    async def download(self, path: str) -> bytes:
        """Download file by path."""
        ...

    @abstractmethod
    async def delete(self, path: str) -> bool:
        """Delete file by path."""
        ...

    @abstractmethod
    def get_url(self, path: str) -> str:
        """Get public/internal URL for file."""
        ...


class LocalStorage(StorageBackend):
    def __init__(self, base_dir: str | None = None):
        self.base_dir = Path(base_dir or settings.UPLOAD_DIR)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    async def upload(self, file_data: bytes, filename: str, content_type: str) -> str:
        ext = Path(filename).suffix
        unique_name = f"{uuid.uuid4()}{ext}"
        # Organize by content type
        subdir = "images" if content_type.startswith("image/") else "documents"
        target_dir = self.base_dir / subdir
        target_dir.mkdir(parents=True, exist_ok=True)
        target_path = target_dir / unique_name
        target_path.write_bytes(file_data)
        return f"{subdir}/{unique_name}"

    async def download(self, path: str) -> bytes:
        full_path = self.base_dir / path
        return full_path.read_bytes()

    async def delete(self, path: str) -> bool:
        full_path = self.base_dir / path
        if full_path.exists():
            full_path.unlink()
            return True
        return False

    def get_url(self, path: str) -> str:
        return f"/uploads/{path}"


class S3Storage(StorageBackend):
    def __init__(self):
        self.bucket = settings.S3_BUCKET
        self.region = settings.S3_REGION
        self.endpoint = settings.S3_ENDPOINT

    async def upload(self, file_data: bytes, filename: str, content_type: str) -> str:
        import aioboto3

        ext = Path(filename).suffix
        unique_name = f"{uuid.uuid4()}{ext}"
        subdir = "images" if content_type.startswith("image/") else "documents"
        key = f"{subdir}/{unique_name}"

        session = aioboto3.Session()
        async with session.client(
            "s3",
            region_name=self.region,
            endpoint_url=self.endpoint or None,
        ) as s3:
            await s3.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=file_data,
                ContentType=content_type,
            )
        return key

    async def download(self, path: str) -> bytes:
        import aioboto3

        session = aioboto3.Session()
        async with session.client(
            "s3",
            region_name=self.region,
            endpoint_url=self.endpoint or None,
        ) as s3:
            response = await s3.get_object(Bucket=self.bucket, Key=path)
            return await response["Body"].read()

    async def delete(self, path: str) -> bool:
        import aioboto3

        session = aioboto3.Session()
        async with session.client(
            "s3",
            region_name=self.region,
            endpoint_url=self.endpoint or None,
        ) as s3:
            await s3.delete_object(Bucket=self.bucket, Key=path)
            return True

    def get_url(self, path: str) -> str:
        if self.endpoint:
            return f"{self.endpoint}/{self.bucket}/{path}"
        return f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{path}"


def get_storage() -> StorageBackend:
    """Factory function to get configured storage backend."""
    backend = getattr(settings, "STORAGE_BACKEND", "local")
    if backend == "s3":
        return S3Storage()
    return LocalStorage()
