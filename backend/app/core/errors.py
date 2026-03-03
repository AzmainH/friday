from enum import StrEnum

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.core.logging_config import get_logger

logger = get_logger(__name__)


class ErrorCode(StrEnum):
    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    PERMISSION_DENIED = "PERMISSION_DENIED"
    CONFLICT = "CONFLICT"
    RATE_LIMITED = "RATE_LIMITED"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    VERSION_CONFLICT = "VERSION_CONFLICT"


class ErrorDetail(BaseModel):
    field: str | None = None
    message: str


class ErrorResponse(BaseModel):
    code: ErrorCode
    message: str
    details: list[ErrorDetail] | None = None
    request_id: str | None = None


class AppException(Exception):
    def __init__(
        self,
        status_code: int,
        error_code: ErrorCode,
        message: str,
        details: list[ErrorDetail] | None = None,
    ) -> None:
        self.status_code = status_code
        self.error_code = error_code
        self.message = message
        self.details = details
        super().__init__(message)


class NotFoundException(AppException):
    def __init__(
        self,
        message: str = "Resource not found",
        details: list[ErrorDetail] | None = None,
    ) -> None:
        super().__init__(404, ErrorCode.NOT_FOUND, message, details)


class PermissionDeniedException(AppException):
    def __init__(
        self,
        message: str = "Permission denied",
        details: list[ErrorDetail] | None = None,
    ) -> None:
        super().__init__(403, ErrorCode.PERMISSION_DENIED, message, details)


class ConflictException(AppException):
    def __init__(
        self,
        message: str = "Resource conflict",
        details: list[ErrorDetail] | None = None,
    ) -> None:
        super().__init__(409, ErrorCode.CONFLICT, message, details)


class ValidationException(AppException):
    def __init__(
        self,
        message: str = "Validation error",
        details: list[ErrorDetail] | None = None,
    ) -> None:
        super().__init__(422, ErrorCode.VALIDATION_ERROR, message, details)


class RateLimitedException(AppException):
    def __init__(
        self,
        message: str = "Rate limit exceeded",
        details: list[ErrorDetail] | None = None,
    ) -> None:
        super().__init__(429, ErrorCode.RATE_LIMITED, message, details)


class VersionConflictException(AppException):
    def __init__(
        self,
        message: str = "Version conflict — resource was modified by another request",
        details: list[ErrorDetail] | None = None,
    ) -> None:
        super().__init__(409, ErrorCode.VERSION_CONFLICT, message, details)


def _get_request_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


def _build_response(
    status_code: int,
    error_code: ErrorCode,
    message: str,
    request_id: str | None,
    details: list[ErrorDetail] | None = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    body = ErrorResponse(
        code=error_code,
        message=message,
        details=details,
        request_id=request_id,
    )
    return JSONResponse(
        status_code=status_code,
        content=jsonable_encoder(body),
        headers=headers,
    )


async def _app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    request_id = _get_request_id(request)
    logger.warning(
        "app_exception",
        error_code=exc.error_code,
        message=exc.message,
        status_code=exc.status_code,
        request_id=request_id,
    )
    return _build_response(
        status_code=exc.status_code,
        error_code=exc.error_code,
        message=exc.message,
        request_id=request_id,
        details=exc.details,
    )


async def _validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    request_id = _get_request_id(request)
    details = [
        ErrorDetail(
            field=" -> ".join(str(loc) for loc in err.get("loc", [])),
            message=err.get("msg", "Invalid value"),
        )
        for err in exc.errors()
    ]
    logger.warning(
        "validation_error",
        detail_count=len(details),
        request_id=request_id,
    )
    return _build_response(
        status_code=422,
        error_code=ErrorCode.VALIDATION_ERROR,
        message="Request validation failed",
        request_id=request_id,
        details=details,
    )


async def _unhandled_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    request_id = _get_request_id(request)
    logger.exception(
        "unhandled_exception",
        exc_type=type(exc).__name__,
        request_id=request_id,
    )
    return _build_response(
        status_code=500,
        error_code=ErrorCode.INTERNAL_ERROR,
        message="An unexpected error occurred",
        request_id=request_id,
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppException, _app_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(RequestValidationError, _validation_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, _unhandled_exception_handler)
