# Feature Implementation Guide

Step-by-step guide for adding new features to Friday. Every feature follows the 5-layer backend pattern (Model, Repository, Service, Schema, Endpoint) plus frontend integration.

This guide uses the **Issue** feature as the canonical reference.

---

## Step 1: Model

Define the SQLAlchemy model in `backend/app/models/`.

### Pattern

- Inherit from `BaseModel` (provides UUID primary key via `id` column).
- Mix in `AuditMixin` (adds `created_at`, `updated_at`, `created_by`, `updated_by`).
- Mix in `SoftDeleteMixin` (adds `is_deleted`, `deleted_at`, `deleted_by`).
- Set `__tablename__` to the plural snake_case table name.
- Define indexes in `__table_args__` as a tuple.
- Use `Mapped[T]` with `mapped_column()` for all columns.
- Use `relationship()` for ORM relationships.

### Base classes (`backend/app/models/base.py`)

```python
class BaseModel(Base):
    __abstract__ = True

    id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )

class AuditMixin(TimestampMixin):
    created_by: Mapped[UUID | None] = mapped_column(pg.UUID(as_uuid=True), nullable=True)
    updated_by: Mapped[UUID | None] = mapped_column(pg.UUID(as_uuid=True), nullable=True)

class SoftDeleteMixin:
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_by: Mapped[UUID | None] = mapped_column(pg.UUID(as_uuid=True), nullable=True)
```

### Example: Issue model (`backend/app/models/issue.py`)

```python
class Issue(BaseModel, AuditMixin, SoftDeleteMixin):
    __tablename__ = "issues"
    __table_args__ = (
        CheckConstraint(
            "percent_complete >= 0 AND percent_complete <= 100",
            name="ck_issues_percent_complete_range",
        ),
        Index("ix_issues_project_deleted", "project_id", "is_deleted"),
        Index("ix_issues_assignee", "assignee_id"),
        Index("ix_issues_status", "status_id"),
    )

    project_id: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False,
    )
    summary: Mapped[str] = mapped_column(String(500), nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)
    assignee_id: Mapped[UUID | None] = mapped_column(
        pg.UUID(as_uuid=True), ForeignKey("users.id"), nullable=True,
    )
    # ... additional columns ...

    project = relationship("Project")
    assignee = relationship("User", foreign_keys=[assignee_id])
```

### Registration

Import the model in `backend/app/models/__init__.py` and add it to `__all__`:

```python
from app.models.issue import Issue

__all__ = [
    # ...existing models...
    "Issue",
]
```

### Migration

Generate and apply the Alembic migration:

```bash
make makemigration   # generates migration file in backend/alembic/versions/
make migrate         # applies migration to PostgreSQL
```

---

## Step 2: Repository

Create the data access layer in `backend/app/repositories/`.

### Pattern

- Inherit from `BaseRepository[T]`.
- Constructor takes `AsyncSession` and passes the model class to `super().__init__()`.
- `BaseRepository` provides: `get_by_id`, `get_multi` (cursor-paginated), `create`, `update`, `soft_delete`, `hard_delete`.
- Add custom query methods as needed. Always call `self._apply_soft_delete_filter(query)` on custom queries.
- Use `selectinload()` for eager loading relationships.

### BaseRepository essentials (`backend/app/repositories/base.py`)

```python
class BaseRepository(Generic[ModelType]):
    def __init__(self, session: AsyncSession, model_class: type[ModelType]):
        self.session = session
        self.model_class = model_class

    async def get_multi(
        self, *, cursor=None, limit=50, filters=None,
        sort_by="created_at", sort_order="desc",
        include_count=False, eager_loads=None,
    ) -> dict[str, Any]:
        # Returns {"data": [...], "next_cursor": str|None, "has_more": bool, "total_count": int|None}

    async def create(self, obj_in: dict[str, Any], *, created_by=None) -> ModelType:
    async def update(self, id: UUID, obj_in: dict[str, Any], *, updated_by=None) -> ModelType | None:
    async def soft_delete(self, id: UUID, *, deleted_by=None) -> bool:
```

### Example: IssueRepository (`backend/app/repositories/issue.py`)

```python
class IssueRepository(BaseRepository[Issue]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Issue)

    async def get_by_project(
        self, project_id: UUID, *,
        status_id: UUID | None = None,
        assignee_id: UUID | None = None,
        **kwargs,
    ) -> dict[str, Any]:
        filters: dict[str, Any] = {"project_id": project_id}
        if status_id:
            filters["status_id"] = status_id
        if assignee_id:
            filters["assignee_id"] = assignee_id
        return await self.get_multi(
            filters=filters,
            eager_loads=[
                selectinload(Issue.status),
                selectinload(Issue.issue_type),
                selectinload(Issue.assignee),
            ],
            **kwargs,
        )

    async def get_by_key(self, issue_key: str) -> Issue | None:
        query = select(Issue).where(Issue.issue_key == issue_key)
        query = self._apply_soft_delete_filter(query)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def bulk_update(self, ids: list[UUID], data: dict[str, Any]) -> int:
        stmt = update(Issue).where(Issue.id.in_(ids)).values(**data)
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount
```

### Registration

Import in `backend/app/repositories/__init__.py` and add to `__all__`:

```python
from app.repositories.issue import IssueRepository

__all__ = [
    # ...existing repos...
    "IssueRepository",
]
```

---

## Step 3: Service

Create the business logic layer in `backend/app/services/`.

### Pattern

- Constructor takes `AsyncSession` and optionally `Redis`. Instantiate all needed repositories and helper services in `__init__`.
- All business logic lives here. Endpoints are thin wrappers.
- Raise `AppException` subclasses for errors: `NotFoundException`, `ConflictException`, `PermissionDeniedException`, `ValidationException`.
- Use `log_activity()` for issue field change tracking.
- Use `EventBus` for real-time event publishing (fire-and-forget, wrapped in try/except).

### Error hierarchy (`backend/app/core/errors.py`)

```python
class AppException(Exception):         # Base: status_code, error_code, message
class NotFoundException(AppException):  # 404
class ConflictException(AppException):  # 409
class PermissionDeniedException(AppException):  # 403
class ValidationException(AppException):  # 422
class VersionConflictException(AppException):  # 409
```

### Example: IssueService (`backend/app/services/issue.py`)

```python
class IssueService:
    def __init__(self, session: AsyncSession, redis: Redis | None = None):
        self.repo = IssueRepository(session)
        self.workflow_repo = WorkflowRepository(session)
        self.status_repo = WorkflowStatusRepository(session)
        self.key_service = IssueKeyService(session)
        self.workflow_engine = WorkflowEngine(session)
        self.session = session
        self._event_bus = EventBus(redis) if redis else None

    async def get_issue(self, issue_id: UUID) -> Issue:
        issue = await self.repo.get_with_relations(issue_id)
        if not issue:
            raise NotFoundException("Issue not found")
        return issue

    async def create_issue(
        self, project_id: UUID, data: dict, *,
        reporter_id: UUID | None = None,
        created_by: UUID | None = None,
    ) -> Issue:
        issue_key = await self.key_service.generate_key(project_id)

        workflow = await self.workflow_repo.get_default_for_project(project_id)
        if not workflow or not workflow.statuses:
            raise ConflictException("Project has no default workflow with statuses configured")

        initial_status = sorted(workflow.statuses, key=lambda s: s.sort_order)[0]

        data["project_id"] = project_id
        data["issue_key"] = issue_key
        data["status_id"] = initial_status.id

        issue = await self.repo.create(data, created_by=created_by)

        await log_activity(self.session, issue_id=issue.id,
                           user_id=created_by or reporter_id, action="created")

        await self._publish("issue_created", issue, user_id=created_by or reporter_id)
        return issue
```

### Registration

Import in `backend/app/services/__init__.py` and add to `__all__`:

```python
from app.services.issue import IssueService

__all__ = [
    # ...existing services...
    "IssueService",
]
```

---

## Step 4: Schema

Define Pydantic v2 request/response models in `backend/app/schemas/`.

### Pattern

- Create a `Base` schema with shared fields.
- `Create` schema extends `Base` with required creation fields.
- `Update` schema has all fields optional (all `None` default).
- `Response` schema extends `Base`, adds `id`, timestamps, nested relations. Must include `model_config = ConfigDict(from_attributes=True)`.
- Optionally create a `Brief` schema for lightweight list responses.

### Example: Issue schemas (`backend/app/schemas/issue.py`)

```python
class IssueBase(BaseModel):
    summary: str
    description: str | None = None
    priority: str = "medium"
    rag_status: str = "none"

class IssueCreate(IssueBase):
    issue_type_id: UUID
    assignee_id: UUID | None = None
    parent_issue_id: UUID | None = None
    estimated_hours: float | None = None
    story_points: int | None = None
    planned_start: date | None = None
    planned_end: date | None = None
    label_ids: list[UUID] = []

class IssueUpdate(BaseModel):
    summary: str | None = None
    description: str | None = None
    priority: str | None = None
    assignee_id: UUID | None = None
    status_id: UUID | None = None
    # ... all fields optional ...

class IssueResponse(IssueBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    issue_key: str
    issue_type_id: UUID
    status_id: UUID
    assignee_id: UUID | None
    percent_complete: int
    created_at: datetime
    updated_at: datetime

    status: WorkflowStatusResponse | None = None
    issue_type: IssueTypeResponse | None = None
    assignee: UserBrief | None = None

class IssueBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    issue_key: str
    summary: str
    priority: str
    status: WorkflowStatusResponse | None = None
    assignee: UserBrief | None = None
```

### Registration

Import in `backend/app/schemas/__init__.py` and add to `__all__`:

```python
from app.schemas.issue import (
    IssueBase, IssueBrief, IssueBulkResponse,
    IssueBulkUpdateRequest, IssueCreate, IssueResponse, IssueUpdate,
)
```

---

## Step 5: Endpoint

Create FastAPI route handlers in `backend/app/api/v1/endpoints/`.

### Pattern

- Endpoints are thin wrappers. All logic lives in the service.
- Use `Depends(get_db)` for database sessions, `Depends(get_current_user_id)` for auth, `Depends(get_redis)` for Redis.
- Use `require_permission("permission.name")` for authorization (returns user_id as a dependency).
- Instantiate the service inside each handler.
- Use `CursorPage[ResponseSchema]` for paginated list endpoints.
- Use `model_dump(exclude_unset=True)` on update bodies to only send changed fields.
- Define a helper `_build_page()` to wrap repository pagination output into `CursorPage`.

### Example: Issue endpoints (`backend/app/api/v1/endpoints/issues.py`)

```python
router = APIRouter(tags=["issues"])

def _build_page(result: dict) -> CursorPage:
    return CursorPage(
        data=result["data"],
        pagination=PaginationMeta(
            next_cursor=result["next_cursor"],
            has_more=result["has_more"],
            total_count=result["total_count"],
        ),
    )

@router.get("/projects/{project_id}/issues", response_model=CursorPage[IssueResponse])
async def list_issues(
    project_id: UUID,
    status_id: UUID | None = Query(None),
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=500),
    session: AsyncSession = Depends(get_db),
):
    service = IssueService(session)
    result = await service.list_issues(project_id, status_id=status_id, cursor=cursor, limit=limit)
    return _build_page(result)

@router.post("/projects/{project_id}/issues", response_model=IssueResponse, status_code=201)
async def create_issue(
    project_id: UUID,
    body: IssueCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
    redis: Redis = Depends(get_redis),
):
    service = IssueService(session, redis=redis)
    data = body.model_dump()
    return await service.create_issue(project_id, data, reporter_id=user_id, created_by=user_id)

@router.put("/issues/{issue_id}", response_model=IssueResponse)
async def update_issue(
    issue_id: UUID,
    body: IssueUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
    redis: Redis = Depends(get_redis),
):
    service = IssueService(session, redis=redis)
    return await service.update_issue(issue_id, body.model_dump(exclude_unset=True), updated_by=user_id)

@router.delete("/issues/{issue_id}", response_model=MessageResponse)
async def delete_issue(
    issue_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
    redis: Redis = Depends(get_redis),
):
    service = IssueService(session, redis=redis)
    await service.delete_issue(issue_id, deleted_by=user_id)
    return MessageResponse(message="Issue deleted")
```

### Router registration

Add the router to `backend/app/api/v1/router.py`:

```python
from app.api.v1.endpoints import your_feature

api_v1_router.include_router(your_feature.router)
```

---

## Step 6: Frontend

### Generate API hooks

After the backend endpoints are deployed and the OpenAPI spec is accessible:

```bash
make generate-api
```

This runs Orval against `localhost:8000/docs` and generates typed hooks in `frontend/src/api/`.

### Create page and components

1. Create a page component in `frontend/src/pages/` (e.g., `IssuesPage.tsx`).
2. Create feature components in `frontend/src/components/` organized by feature directory.
3. Use the Orval-generated TanStack Query hooks for data fetching and mutations.
4. Use `react-hook-form` + `zod` for form validation.
5. Use `lucide-react` for icons.
6. Use Tailwind CSS with dark mode as default.

### Add route

Register the page in the router configuration so it is accessible via navigation.

---

## Step 7: Tests

### Backend (pytest, async)

Tests live in `backend/tests/`. Use `httpx.AsyncClient` with ASGI transport against the real app.

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_list_issues(client: AsyncClient):
    projects_resp = await client.get("/api/v1/projects")
    projects = projects_resp.json().get("data", [])
    if projects:
        project_id = projects[0]["id"]
        response = await client.get(f"/api/v1/projects/{project_id}/issues")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "pagination" in data

@pytest.mark.asyncio
async def test_get_issue_not_found(client: AsyncClient):
    response = await client.get(f"/api/v1/issues/{FAKE_UUID}")
    assert response.status_code in (404, 422)
```

Run backend tests:

```bash
make test-backend
```

### Frontend (vitest)

Run frontend tests:

```bash
make test-frontend
```

---

## Worked Example: Issue Feature File Map

Tracing the Issue feature through every layer:

| Layer | File | Key Content |
|-------|------|-------------|
| **Model** | `backend/app/models/issue.py` | `Issue(BaseModel, AuditMixin, SoftDeleteMixin)` with columns, indexes, relationships |
| **Model init** | `backend/app/models/__init__.py` | `from app.models.issue import Issue` |
| **Repository** | `backend/app/repositories/issue.py` | `IssueRepository(BaseRepository[Issue])` with `get_by_project`, `get_by_key`, `search`, `bulk_update` |
| **Repo init** | `backend/app/repositories/__init__.py` | `from app.repositories.issue import IssueRepository` |
| **Service** | `backend/app/services/issue.py` | `IssueService` with CRUD, transitions, bulk updates, event publishing, activity logging |
| **Service init** | `backend/app/services/__init__.py` | `from app.services.issue import IssueService` |
| **Schema** | `backend/app/schemas/issue.py` | `IssueBase`, `IssueCreate`, `IssueUpdate`, `IssueResponse`, `IssueBrief`, `IssueBulkUpdateRequest`, `IssueBulkResponse` |
| **Schema init** | `backend/app/schemas/__init__.py` | All issue schema imports |
| **Endpoint** | `backend/app/api/v1/endpoints/issues.py` | `list_issues`, `create_issue`, `bulk_update_issues`, `search_issues`, `get_issue`, `update_issue`, `delete_issue` |
| **Router** | `backend/app/api/v1/router.py` | `api_v1_router.include_router(issues.router)` |
| **Helper services** | `backend/app/services/issue_key.py` | `IssueKeyService.generate_key()` for concurrent-safe key generation |
| | `backend/app/services/workflow.py` | `WorkflowEngine.validate_transition()` for status transitions |
| | `backend/app/services/activity.py` | `log_activity()` for field change audit trail |
| | `backend/app/services/event_bus.py` | `EventBus.publish_project_event()` for real-time WebSocket events |
| **Tests** | `backend/tests/test_issues.py` | Async integration tests using `httpx.AsyncClient` |

### Request flow for `POST /api/v1/projects/{id}/issues`

1. FastAPI deserializes request body into `IssueCreate` schema.
2. `Depends(get_db)` provides an `AsyncSession`. `Depends(get_current_user_id)` extracts user from `X-User-ID` header.
3. Endpoint instantiates `IssueService(session, redis=redis)`.
4. `IssueService.create_issue()`:
   - Calls `IssueKeyService.generate_key()` (uses `SELECT...FOR UPDATE` for concurrent-safe counter increment).
   - Fetches the project's default workflow, picks the initial status.
   - Calls `IssueRepository.create()` (flushes to DB, refreshes the object).
   - Calls `log_activity()` to record the "created" action.
   - Calls `EventBus.publish_project_event()` to notify WebSocket subscribers.
5. FastAPI serializes the returned `Issue` ORM object using `IssueResponse` (enabled by `ConfigDict(from_attributes=True)`).

---

## Checklist for Adding a New Feature

1. [ ] Create model file in `backend/app/models/`, inherit `BaseModel` + mixins
2. [ ] Register model in `backend/app/models/__init__.py`
3. [ ] Run `make makemigration` and `make migrate`
4. [ ] Create repository in `backend/app/repositories/`, inherit `BaseRepository[T]`
5. [ ] Register repository in `backend/app/repositories/__init__.py`
6. [ ] Create service in `backend/app/services/` with business logic
7. [ ] Register service in `backend/app/services/__init__.py`
8. [ ] Create schemas in `backend/app/schemas/` (Create, Update, Response variants)
9. [ ] Register schemas in `backend/app/schemas/__init__.py`
10. [ ] Create endpoint file in `backend/app/api/v1/endpoints/`
11. [ ] Register router in `backend/app/api/v1/router.py`
12. [ ] Write backend tests in `backend/tests/`
13. [ ] Run `make test-backend`
14. [ ] Run `make generate-api` to create frontend hooks
15. [ ] Create frontend page and components
16. [ ] Run `make test-frontend`
