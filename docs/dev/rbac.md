# RBAC System

Reference for the Friday role-based access control system. Covers the three-level hierarchy, system roles, permission checking, and caching.

## Three-Level Hierarchy

```
Organization (top level)
  └── Workspace
        └── Project
```

Permission inheritance flows downward:
- **org_admin** has full access to everything in every workspace and project
- **workspace_admin** has full access to all projects in their workspace
- **project_admin** has full access within their assigned project

## System Roles

Defined in `backend/app/seed.py`. Created by `make seed`.

### Organization Roles

| Role | Permissions | Description |
|------|------------|-------------|
| `org_admin` | `*` (wildcard) | Full access to everything |
| `org_member` | `org.view` | Can view workspaces they belong to |

### Workspace Roles

| Role | Permissions | Description |
|------|------------|-------------|
| `workspace_admin` | `*` (wildcard) | Full access to all projects in workspace |
| `workspace_member` | `workspace.view`, `projects.view`, `projects.join` | Can view and join projects |

### Project Roles

| Role | Key Permissions | Description |
|------|----------------|-------------|
| `project_admin` | `project.settings.manage`, `project.members.manage`, `project.delete`, `project.archive`, all issue/comment/milestone/budget/wiki/roadmap/automation/report permissions | Full project control |
| `project_manager` | Same as admin minus `project.settings.manage`, `project.members.manage`, `project.delete`, `project.archive`, `wiki.delete` | Day-to-day project management |
| `project_member` | `issues.create/edit/assign/transition`, `comments.create/edit_own`, `budget.view`, `wiki.create/edit`, `roadmap.view` | Standard contributor |
| `project_viewer` | `issues.view`, `comments.view`, `budget.view`, `wiki.view`, `roadmap.view` | Read-only access |
| `project_guest` | `issues.view`, `comments.view` | Minimal read-only for external stakeholders |

## Permission Checking

File: `backend/app/core/permissions.py`

### Usage in Endpoints

```python
from app.core.permissions import require_permission

@router.post("/projects/{project_id}/issues")
async def create_issue(
    project_id: UUID,
    body: IssueCreate,
    user_id: UUID = require_permission("issues.create"),  # <-- dependency
    db: AsyncSession = Depends(get_db),
):
    ...
```

### How It Works

`require_permission(permission)` returns a FastAPI `Depends()` that:

1. **Extracts scope** from path parameters automatically:
   - `project_id` → looks up project to find workspace_id and org_id
   - `workspace_id` → looks up workspace to find org_id
   - `org_id` → uses directly

2. **Checks permissions in order** (org → workspace → project):
   - If user is org member with matching permission → allowed
   - If user is workspace member with matching permission → allowed
   - If user is project member with matching permission → allowed
   - Otherwise → raises `PermissionDeniedException`

3. **Wildcard support**: A role with permission `"*"` satisfies any permission check (used by admin roles)

4. **No-scope fallback**: Endpoints without a scoped resource ID (e.g., `/me/notifications`) allow any authenticated user

### Scope Resolution Chain

```
project_id given:
  → SELECT Project WHERE id = project_id → get workspace_id
  → SELECT Workspace WHERE id = workspace_id → get org_id
  → Check org → workspace → project (in order)

workspace_id given:
  → SELECT Workspace WHERE id = workspace_id → get org_id
  → Check org → workspace (in order)

org_id given:
  → Check org only
```

## Caching

Permission results are cached in Redis for 300 seconds (5 minutes).

- **Cache key**: `perm:{user_id}:{scope}:{scope_id}:{permission}`
- **Cache service**: `backend/app/core/cache.py` → `CacheService`
- **Graceful degradation**: If Redis is unavailable, permissions are checked directly against the database every time

## Member Models

File: `backend/app/models/members.py`

| Model | Unique Constraint | Extra Fields |
|-------|-------------------|--------------|
| `OrgMember` | `(org_id, user_id)` | `role_id` |
| `WorkspaceMember` | `(workspace_id, user_id)` | `role_id` |
| `ProjectMember` | `(project_id, user_id)` | `role_id`, `capacity_pct`, `hours_per_week` |

## Common Permission Strings

| Permission | Used For |
|-----------|----------|
| `issues.create` | Creating new issues |
| `issues.edit` | Editing issue fields |
| `issues.delete` | Deleting issues |
| `issues.assign` | Assigning issues to users |
| `issues.transition` | Changing issue status |
| `issues.bulk_edit` | Bulk operations |
| `comments.create` | Adding comments |
| `comments.edit_own` | Editing own comments |
| `comments.delete_any` | Deleting any comment |
| `milestones.manage` | CRUD milestones |
| `gates.approve` | Approving gate checkpoints |
| `budget.view` | Viewing budgets |
| `budget.manage` | Managing budgets and cost entries |
| `decisions.manage` | Managing decision log |
| `stakeholders.manage` | Managing stakeholders |
| `wiki.create/edit/delete` | Wiki page operations |
| `roadmap.view/manage` | Roadmap operations |
| `automations.manage` | Managing automation rules |
| `reports.export` | Exporting reports |
| `project.settings.manage` | Project configuration |
| `project.members.manage` | Managing project members |
| `project.delete` | Deleting projects |
| `project.archive` | Archiving projects |
