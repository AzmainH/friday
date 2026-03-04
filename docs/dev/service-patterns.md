# Service Layer Patterns

Documentation of the service layer patterns used across Friday's backend. Services contain all business logic; endpoints are thin wrappers that delegate to services.

---

## 1. Service Constructor Pattern

Every service follows the same constructor shape: accept `AsyncSession` (required) and optionally `Redis`, then instantiate all needed repositories and helper services.

### Canonical example: IssueService (`backend/app/services/issue.py`)

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
```

Key points:
- The `session` is stored on `self.session` for direct use when needed (e.g., passing to `log_activity()`).
- Redis is optional. When absent, `self._event_bus` is `None` and event publishing is silently skipped.
- Repositories and helper services are instantiated eagerly in the constructor, not lazily per-method.
- Services never accept repositories as constructor arguments. They always create their own from the session.

### Simpler example: WorkflowService (`backend/app/services/workflow.py`)

```python
class WorkflowService:
    def __init__(self, session: AsyncSession):
        self.repo = WorkflowRepository(session)
        self.status_repo = WorkflowStatusRepository(session)
        self.transition_repo = WorkflowTransitionRepository(session)
        self.session = session
```

Services that do not publish events omit the `redis` parameter entirely.

### Endpoint instantiation pattern

Services are instantiated per-request inside each endpoint handler:

```python
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
```

---

## 2. Event Publishing

Services publish real-time events via `EventBus` backed by Redis pub/sub. Events are fire-and-forget: failures never break the main operation.

### EventBus (`backend/app/services/event_bus.py`)

```python
class EventBus:
    def __init__(self, redis: Redis) -> None:
        self.redis = redis

    async def publish_event(
        self, channel: str, event_type: str, payload: dict[str, Any], *,
        project_id: str | None = None, user_id: str | None = None,
    ) -> None:
        message = {"type": event_type, "payload": payload}
        if project_id:
            message["project_id"] = project_id
        if user_id:
            message["user_id"] = user_id
        try:
            await self.redis.publish(channel, json.dumps(message, default=str))
        except Exception:
            await logger.awarning("event_publish_failed", channel=channel, exc_info=True)

    async def publish_project_event(self, project_id: str, event_type: str, payload: dict, *, user_id=None):
        await self.publish_event(f"ws:project:{project_id}", event_type, payload, project_id=project_id, user_id=user_id)

    async def publish_user_event(self, user_id: str, event_type: str, payload: dict):
        await self.publish_event(f"ws:user:{user_id}", event_type, payload, user_id=user_id)

    async def publish_global_event(self, event_type: str, payload: dict):
        await self.publish_event("ws:global", event_type, payload)
```

Channel naming: `ws:project:{id}`, `ws:user:{id}`, `ws:global`.

### Service-side publish helper

Services wrap event publishing in a private `_publish` method with a bare `except Exception: pass`:

```python
async def _publish(self, event_type: str, issue: Issue, *, user_id: UUID | None = None) -> None:
    if not self._event_bus:
        return
    try:
        await self._event_bus.publish_project_event(
            project_id=str(issue.project_id),
            event_type=event_type,
            payload={
                "issue_id": str(issue.id),
                "issue_key": getattr(issue, "issue_key", None),
                "summary": getattr(issue, "summary", None),
            },
            user_id=str(user_id) if user_id else None,
        )
    except Exception:
        pass  # Never let event publishing break the main flow
```

Event types used by IssueService: `issue_created`, `issue_updated`, `issue_deleted`.

---

## 3. Workflow Engine

The `WorkflowEngine` (`backend/app/services/workflow.py`) validates status transitions before they are applied.

```python
class WorkflowEngine:
    def __init__(self, session: AsyncSession):
        self.transition_repo = WorkflowTransitionRepository(session)
        self.status_repo = WorkflowStatusRepository(session)

    async def validate_transition(self, issue: Issue, to_status_id: UUID) -> WorkflowStatus:
        status = await self.status_repo.get_by_id(to_status_id)
        if not status:
            raise NotFoundException("Target status not found")

        valid = await self.transition_repo.get_valid_transitions(
            status.workflow_id, issue.status_id
        )
        allowed_ids = {t.to_status_id for t in valid}
        if to_status_id not in allowed_ids:
            raise ConflictException(
                f"Transition from current status to '{status.name}' is not allowed"
            )
        return status
```

### Usage in IssueService

```python
async def transition_issue(self, issue_id: UUID, to_status_id: UUID, *, updated_by=None) -> Issue:
    issue = await self.get_issue(issue_id)
    new_status = await self.workflow_engine.validate_transition(issue, to_status_id)

    old_status_name = issue.status.name if issue.status else str(issue.status_id)
    updated = await self.repo.update(issue_id, {"status_id": to_status_id}, updated_by=updated_by)

    await log_activity(
        self.session, issue_id=issue_id, user_id=updated_by,
        action="transitioned", field_name="status",
        old_value=old_status_name, new_value=new_status.name,
    )
    await self._publish("issue_updated", updated, user_id=updated_by)
    return updated
```

The engine only validates. The service performs the actual update and logging.

---

## 4. Activity Logging

Two standalone async functions in `backend/app/services/activity.py` handle audit trails.

### log_activity -- Issue-level field change tracking

```python
async def log_activity(
    session: AsyncSession, *,
    issue_id: UUID, user_id: UUID | None, action: str,
    field_name: str | None = None, old_value: str | None = None, new_value: str | None = None,
) -> IssueActivityLog:
    activity = IssueActivityLog(
        issue_id=issue_id, user_id=user_id, action=action,
        field_name=field_name, old_value=old_value, new_value=new_value,
    )
    session.add(activity)
    await session.flush()
    await session.refresh(activity)
    return activity
```

### log_audit -- Entity-level audit log

```python
async def log_audit(
    session: AsyncSession, *,
    entity_type: str, entity_id: UUID, user_id: UUID, action: str,
    changes: dict | None = None, request_id: str | None = None,
) -> None:
    audit = AuditLog(
        entity_type=entity_type, entity_id=entity_id,
        user_id=user_id, action=action,
        changes_json=changes, request_id=request_id,
    )
    session.add(audit)
    await session.flush()
```

### Service usage patterns

**On creation:** log a single "created" action.

```python
await log_activity(self.session, issue_id=issue.id,
                   user_id=created_by or reporter_id, action="created")
```

**On update:** iterate tracked fields, log each changed field with old and new values.

```python
tracked_fields = {"summary", "description", "priority", "assignee_id", ...}
for field in tracked_fields:
    if field in data:
        old = str(getattr(issue, field, None))
        new = str(data[field])
        if old != new:
            await log_activity(
                self.session, issue_id=issue_id, user_id=updated_by,
                action="updated", field_name=field, old_value=old, new_value=new,
            )
```

**On transition:** log "transitioned" with old and new status names.

---

## 5. Issue Key Generation

`IssueKeyService` (`backend/app/services/issue_key.py`) generates sequential, concurrent-safe issue keys like `PROJ-42`.

```python
class IssueKeyService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def generate_key(self, project_id: UUID) -> str:
        # 1. Get project key prefix
        result = await self.session.execute(
            select(Project.key_prefix).where(Project.id == project_id)
        )
        prefix = result.scalar_one_or_none()
        if not prefix:
            raise NotFoundException("Project not found")

        # 2. Lock the counter row with SELECT...FOR UPDATE
        row = await self.session.execute(
            text("SELECT counter FROM project_issue_counters WHERE project_id = :pid FOR UPDATE"),
            {"pid": project_id},
        )
        current = row.scalar_one_or_none()

        # 3. Insert or increment
        if current is None:
            await self.session.execute(
                text("INSERT INTO project_issue_counters (project_id, counter) VALUES (:pid, 1)"),
                {"pid": project_id},
            )
            counter = 1
        else:
            counter = current + 1
            await self.session.execute(
                text("UPDATE project_issue_counters SET counter = :counter WHERE project_id = :pid"),
                {"pid": project_id, "counter": counter},
            )

        await self.session.flush()
        return f"{prefix}-{counter}"
```

The `SELECT...FOR UPDATE` ensures that concurrent requests to the same project serialize their counter reads, preventing duplicate keys. The lock is held within the current transaction and released on commit.

---

## 6. Background Task Patterns

Background tasks use ARQ with Redis as the broker. Task functions live in `backend/app/tasks/`.

### Task function signature

ARQ tasks are plain async functions that receive `ctx: dict` as the first argument plus task-specific parameters:

```python
async def run_auto_schedule(ctx: dict, run_id: str, project_id: str) -> None:
```

### Database access in tasks

Tasks create their own database sessions using `async_session_factory`:

```python
from app.core.database import async_session_factory

async def run_auto_schedule(ctx: dict, run_id: str, project_id: str) -> None:
    async with async_session_factory() as session:
        try:
            await _execute_schedule(session, run_id, project_id)
        except Exception as exc:
            logger.exception("auto_schedule_failed", run_id=run_id, error=str(exc))
            await _mark_failed(session, run_id, str(exc))
```

### Error handling in tasks

Tasks handle their own errors, typically updating a status record to "failed":

```python
async def _mark_failed(session: AsyncSession, run_id: str, error_message: str) -> None:
    run = await session.get(ScheduleRun, UUID(run_id))
    if run:
        run.status = ScheduleRunStatus.failed
        run.completed_at = datetime.now(timezone.utc)
        run.error_message = error_message
        await session.commit()
```

### Enqueueing from services

Services enqueue tasks via the ARQ Redis pool, typically accessed through the request's Redis connection. The service creates a status tracking record, commits it, then enqueues the task with the record's ID.

---

## 7. Bulk Operations

The bulk update pattern from `IssueService`:

### Service layer

```python
async def bulk_update(
    self, issue_ids: list[UUID], data: dict, *, updated_by: UUID | None = None,
) -> tuple[int, list[str]]:
    errors: list[str] = []
    if not issue_ids:
        return 0, errors

    clean_data = {k: v for k, v in data.items() if v is not None}
    if not clean_data:
        return 0, errors

    if updated_by and "updated_by" not in clean_data:
        clean_data["updated_by"] = updated_by

    count = await self.repo.bulk_update(issue_ids, clean_data)
    return count, errors
```

### Repository layer

```python
async def bulk_update(self, ids: list[UUID], data: dict[str, Any]) -> int:
    stmt = update(Issue).where(Issue.id.in_(ids)).values(**data)
    result = await self.session.execute(stmt)
    await self.session.flush()
    return result.rowcount
```

### Schema

```python
class IssueBulkUpdateRequest(BaseModel):
    issue_ids: list[UUID]
    update: IssueUpdate

class IssueBulkResponse(BaseModel):
    updated_count: int
    errors: list[str] | None = None
```

### Endpoint

```python
@router.post("/projects/{project_id}/issues/bulk", response_model=IssueBulkResponse, status_code=201)
async def bulk_update_issues(
    project_id: UUID, body: IssueBulkUpdateRequest,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = IssueService(session)
    count, errors = await service.bulk_update(
        body.issue_ids, body.update.model_dump(exclude_unset=True), updated_by=user_id,
    )
    return IssueBulkResponse(updated_count=count, errors=errors or None)
```

The pattern: accept a list of IDs plus an update payload, filter out `None` values, execute a single `UPDATE...WHERE id IN (...)` statement, return the count of affected rows.

---

## 8. Permission Checking

Friday has two levels of permission checking: endpoint-level via FastAPI dependency and service-level via explicit checks.

### Endpoint-level: `require_permission` dependency (`backend/app/core/permissions.py`)

```python
def require_permission(permission: str):
    async def _check(
        request: Request,
        user_id: UUID = Depends(get_current_user_id),
        db: AsyncSession = Depends(get_db),
    ) -> UUID:
        path_params = request.path_params
        project_id = path_params.get("project_id")
        workspace_id = path_params.get("workspace_id")
        org_id = path_params.get("org_id")
        # ... resolves scope hierarchy: org -> workspace -> project ...
        # Checks RolePermission table for matching permission or wildcard "*"
        # Raises PermissionDeniedException if no match found
        return user_id

    return Depends(_check)
```

Usage in an endpoint:

```python
@router.post("/projects/{project_id}/issues", ...)
async def create_issue(
    project_id: UUID,
    body: IssueCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = require_permission("issues.create"),  # replaces Depends(get_current_user_id)
    redis: Redis = Depends(get_redis),
):
```

### Permission inheritance

The hierarchy is `org > workspace > project`. An org admin (with wildcard `"*"` permission) automatically has all permissions at every level. The check walks up the hierarchy: if the user has the permission at any higher scope, access is granted.

Results are cached in Redis for 5 minutes (key: `perm:{user_id}:{scope}:{scope_id}:{permission}`).

### When to use which

| Situation | Approach |
|-----------|----------|
| Standard CRUD gated by role | `require_permission("resource.action")` as endpoint dependency |
| Endpoints without scoped resource IDs | Authenticated users are allowed through (no scope to check) |
| Business rule checks (e.g., "only assignee can transition") | Explicit checks in the service, raise `PermissionDeniedException` |
| Cross-entity authorization (e.g., "project must belong to workspace") | Validate in the service via repository lookups |

### Current state

The Issue endpoints currently use `Depends(get_current_user_id)` directly rather than `require_permission()`. The permission system is in place and used by other endpoints. When adding new features, prefer `require_permission()` for any endpoint that operates on a scoped resource (project, workspace, or org).
