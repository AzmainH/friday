# Architecture Deep Dive

Reference for Claude AI agents working on the Friday codebase. This document explains the layered architecture, request flow, error handling, and core conventions.

## Request Flow

```
HTTP Request
  → CORS Middleware
  → RequestIDMiddleware       (backend/app/core/middleware.py)
      assigns UUID to every request, binds to structlog context
  → RequestLoggingMiddleware  (backend/app/core/middleware.py)
      logs request_started / request_finished with duration_ms
  → RateLimitMiddleware       (backend/app/core/middleware.py)
      Redis token-bucket, 200/min default, per-route overrides via tags
  → FastAPI Router            (backend/app/api/v1/router.py)
  → Permission Guard          (backend/app/core/permissions.py)
      require_permission("issues.create") dependency
  → Endpoint                  (backend/app/api/v1/endpoints/*.py)
      thin wrapper, creates service, calls method
  → Service                   (backend/app/services/*.py)
      business logic, raises AppException subclasses
  → Repository                (backend/app/repositories/*.py)
      data access, cursor pagination, soft-delete filter
  → SQLAlchemy 2 (async)      (backend/app/core/database.py)
  → PostgreSQL 16
```

## The 5-Layer Pattern

Every feature follows: **Model → Repository → Service → Schema → Endpoint**

### Layer 1: Model (`backend/app/models/`)

All models inherit from `BaseModel` which provides a UUID primary key:

```python
class BaseModel(Base):
    __abstract__ = True
    id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
```

**Mixins** (from `backend/app/models/base.py`):

| Mixin | Columns | Purpose |
|-------|---------|---------|
| `TimestampMixin` | `created_at`, `updated_at` (auto-set) | Automatic timestamps |
| `AuditMixin` | Extends `TimestampMixin` + `created_by`, `updated_by` (UUID) | Track who made changes |
| `SoftDeleteMixin` | `is_deleted` (indexed bool), `deleted_at`, `deleted_by` | Soft delete support |

**Convention**: Most domain models use `BaseModel` + `AuditMixin` + `SoftDeleteMixin`. Register new models in `backend/app/models/__init__.py`.

### Layer 2: Repository (`backend/app/repositories/`)

All repositories inherit `BaseRepository[T]` from `backend/app/repositories/base.py`:

```python
class BaseRepository(Generic[ModelType]):
    def __init__(self, session: AsyncSession, model_class: type[ModelType]):
        self.session = session
        self.model_class = model_class
```

**Built-in methods**:
- `get_by_id(id)` — Single lookup with soft-delete filter
- `get_multi(cursor, limit, filters, sort_by, sort_order, include_count, eager_loads)` — Paginated list
- `create(obj_in, created_by)` — Insert with audit tracking
- `update(id, obj_in, updated_by)` — Partial update with audit tracking
- `soft_delete(id, deleted_by)` — Set `is_deleted=True`
- `hard_delete(id)` — Physical delete

**Cursor pagination**: Cursors encode `{v: sort_value, id: item_id}` as base64 JSON. The `get_multi` method fetches `limit + 1` rows to detect `has_more`, then uses a composite `(sort_column, id)` tie-breaker for deterministic ordering.

**Soft-delete auto-filter**: `_apply_soft_delete_filter` is called on every query. Deleted records are invisible unless explicitly queried.

### Layer 3: Service (`backend/app/services/`)

Services contain all business logic. Endpoints never contain logic — they are thin wrappers.

```python
class IssueService:
    def __init__(self, session: AsyncSession, redis: Redis | None = None):
        self.repo = IssueRepository(session, Issue)
        self.session = session
        self.redis = redis
```

**Conventions**:
- Services instantiate their own repositories in `__init__`
- Services raise `AppException` subclasses for error conditions
- Services may accept `redis` for EventBus or caching
- Services may enqueue ARQ tasks for heavy background work
- Register in `backend/app/services/__init__.py`

### Layer 4: Schema (`backend/app/schemas/`)

Pydantic v2 models for request/response serialization. From `backend/app/schemas/base.py`:

```python
class CursorPage(BaseModel, Generic[T]):
    model_config = ConfigDict(from_attributes=True)
    data: list[T]
    pagination: PaginationMeta

class PaginationMeta(BaseModel):
    next_cursor: str | None = None
    has_more: bool
    total_count: int | None = None
```

**Convention**: Each feature has `Create`, `Update`, and `Response` schema variants. All use `ConfigDict(from_attributes=True)` for ORM compatibility.

**Error envelope**:
```python
class ErrorResponse(BaseModel):
    code: str       # ErrorCode enum value
    message: str
    details: list[ErrorDetail] | None = None
    request_id: str | None = None
```

### Layer 5: Endpoint (`backend/app/api/v1/endpoints/`)

Thin wrappers that create service instances and call methods:

```python
router = APIRouter(prefix="/projects/{project_id}/issues", tags=["Issues"])

@router.get("")
async def list_issues(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = require_permission("issues.read"),
    cursor: str | None = None,
    limit: int = Query(50, ge=1, le=100),
):
    svc = IssueService(db)
    result = await svc.list_issues(project_id, cursor=cursor, limit=limit)
    return _build_page(result, IssueResponse)
```

**Convention**: Register routers in `backend/app/api/v1/router.py`.

## Dependency Injection

From `backend/app/core/deps.py`:

| Dependency | What it provides |
|-----------|-----------------|
| `get_db()` | `AsyncSession` from SQLAlchemy async session pool |
| `get_current_user_id(request)` | `UUID` from `X-User-ID` header (falls back to dev user) |
| `get_redis(request)` | `Redis` client from `app.state.redis` |
| `get_request_id(request)` | Request ID string from middleware |
| `require_permission(perm)` | Returns `user_id` after checking RBAC (see `rbac.md`) |

## Error Handling

From `backend/app/core/errors.py`:

| Exception | HTTP | ErrorCode | When to use |
|-----------|------|-----------|-------------|
| `NotFoundException` | 404 | `NOT_FOUND` | Resource doesn't exist |
| `PermissionDeniedException` | 403 | `PERMISSION_DENIED` | User lacks required permission |
| `ConflictException` | 409 | `CONFLICT` | Duplicate key, business rule violation |
| `ValidationException` | 422 | `VALIDATION_ERROR` | Invalid input beyond Pydantic validation |
| `RateLimitedException` | 429 | `RATE_LIMITED` | Too many requests |
| `VersionConflictException` | 409 | `VERSION_CONFLICT` | Optimistic concurrency failure (wiki pages) |

All exceptions produce a standard JSON envelope:
```json
{
  "code": "NOT_FOUND",
  "message": "Issue not found",
  "details": null,
  "request_id": "abc-123"
}
```

FastAPI's `RequestValidationError` is also caught and reformatted into the same envelope with field-level details.

## Side Effects & Background Work

**In-process (FastAPI BackgroundTasks)**: Used for lightweight fire-and-forget work like activity logs and search index updates. Runs in the same process after the response is sent.

**Out-of-process (ARQ worker)**: Used for heavy or time-sensitive work:
- Notification delivery
- Automation rule evaluation
- AI API calls (OpenAI)
- Import/export processing
- Recurring task generation
- SLA breach checking
- Auto-scheduling

ARQ tasks live in `backend/app/tasks/`. The worker is configured in `backend/app/worker.py` (max_jobs=10, timeout=300s).

## Rate Limiting

Redis token-bucket via `RateLimitMiddleware`. Default: 200/min per user.

Per-route overrides use FastAPI tags:
```python
@router.post("/ai/summarize", tags=["rate_limit:10"])  # 10/min
```

| Route category | Limit |
|---------------|-------|
| General | 200/min |
| AI endpoints | 10/min |
| Bulk operations | 20/min |
| Intake form submissions | 30/min |

If Redis is unavailable, rate limiting degrades gracefully (allows all requests).

## Key Conventions Summary

1. **Never put business logic in endpoints** — endpoints are thin wrappers
2. **Always use `AppException` subclasses** — never raise raw HTTP exceptions
3. **Always add soft-delete support** to domain models
4. **Always use cursor pagination** — never offset-based
5. **Always register new modules** in `__init__.py` and `router.py`
6. **Use `require_permission()`** for authorization, never manual checks
7. **Ruff formatting**: line-length 100, target Python 3.12
