from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class PaginationMeta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    next_cursor: str | None = None
    has_more: bool
    total_count: int | None = None


class CursorPage(BaseModel, Generic[T]):
    model_config = ConfigDict(from_attributes=True)

    data: list[T]
    pagination: PaginationMeta


class ErrorDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    field: str | None = None
    message: str


class ErrorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    message: str
    details: list[ErrorDetail] | None = None
    request_id: str | None = None


class HealthResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: str
    version: str


class DetailedHealthResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: str
    version: str
    database: str
    redis: str


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    message: str
