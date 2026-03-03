# FRIDAY -- Enterprise Project Management Application -- Build Plan

**Last updated:** March 3, 2026
**Status:** Phase 2 in progress (models + schemas + repos + services done, API endpoints next)

---

## Quick Reference

- **App UI:** `localhost:3000` | **API docs:** `localhost:8000/docs` | **DB:** `localhost:5432` | **Redis:** `localhost:6379`
- **Start:** `make up` | **Rebuild:** `make rebuild` | **Reset:** `make reset` | **Logs:** `make logs`
- **Generate API types:** `make generate-api` | **Run tests:** `make test-backend`

---

## User Preferences (confirmed before build started)

- **No demo/seed data** -- app starts empty. Only system roles/permissions are seeded
- **Orval** for auto-generated React Query hooks + TypeScript types from OpenAPI spec
- **DHTMLX Gantt GPL** -- confirmed acceptable
- **Tests alongside code** -- write tests as each phase is built
- **Auth is stub** -- X-User-ID header, no real auth. Architected for Azure AD SSO later
- **Dark theme is default** in the frontend

---

## Current Build State (~122 files)

### Phase 1A: Docker & Backend Scaffolding -- COMPLETE

All infrastructure files exist and are production-quality:

**Docker & config (root):**
- `docker-compose.yml` -- 6 services (db, redis, backend, worker, frontend, pgadmin behind `debug` profile)
- `backend/Dockerfile` -- Python 3.12-slim, WeasyPrint system deps, postgresql-client, redis-tools
- `backend/entrypoint.sh` -- wait-for-DB, wait-for-Redis, `alembic upgrade head`, uvicorn --reload
- `frontend/Dockerfile` -- Node 20-alpine, Vite dev server on port 3000
- `.env`, `.env.example`, `.gitignore`, `.dockerignore`, `Makefile` (14 targets)
- `backend/scripts/init-extensions.sql` -- pg_trgm + uuid-ossp

**Backend core (`backend/app/core/`):**
- `config.py` -- Pydantic Settings singleton (DATABASE_URL, REDIS_URL, pool sizes, rate limits, etc.)
- `database.py` -- async engine (pool_size=5, max_overflow=10, pool_pre_ping), session factory, `Base(DeclarativeBase)`
- `middleware.py` -- RequestIDMiddleware, RequestLoggingMiddleware, RateLimitMiddleware (all pure ASGI, Redis token bucket)
- `errors.py` -- ErrorCode enum (7 codes), AppException hierarchy (6 subclasses), exception handlers returning error envelope with request_id
- `logging_config.py` -- structlog (JSON prod, colored console dev), stdlib integration
- `deps.py` -- get_db (AsyncSession), get_current_user_id (X-User-ID or dev default), get_redis, get_request_id
- `permissions.py` -- Full three-level RBAC: org > workspace > project inheritance, wildcard "*" permission support, auto-extracts scope from path params

**Backend foundation (`backend/app/`):**
- `main.py` -- FastAPI app with lifespan (Redis init/close), CORS, 3 middleware layers, exception handlers, v1 router
- `models/base.py` -- BaseModel (UUID pk via gen_random_uuid), TimestampMixin, AuditMixin, SoftDeleteMixin
- `repositories/base.py` -- BaseRepository[T]: cursor-based pagination (base64+JSON cursor with sort+id tie-breaking), soft delete auto-filter, CRUD, optional total_count
- `schemas/base.py` -- CursorPage[T], PaginationMeta, ErrorDetail, ErrorResponse, HealthResponse, DetailedHealthResponse, MessageResponse
- `worker.py` -- ARQ WorkerSettings (parses REDIS_URL, max_jobs=10, timeout=300)
- `tasks/base.py` -- sample_task placeholder
- `seed.py` -- Seeds 9 system roles with permissions (idempotent)

**Backend config:**
- `pyproject.toml` -- Ruff (target py312, line-length 100) + pytest (asyncio_mode auto)
- `alembic.ini` -- date-prefixed file template
- `alembic/env.py` -- imports Base.metadata, overrides URL from settings
- `alembic/script.py.mako` -- standard migration template

**Backend tests:**
- `tests/conftest.py` -- async httpx client (ASGI transport), DB session fixture with rollback
- `tests/test_health.py` -- health endpoint test (db/redis tests skip-marked for CI without services)

### Phase 1B: Core Models, RBAC & CRUD -- COMPLETE

**Models (`backend/app/models/`):**
- `user.py` -- User (email unique+indexed, display_name, avatar_url, timezone, is_active) + preferences relationship
- `user_preferences.py` -- UserPreferences (user_id unique FK, JSONB: sidebar_state, column_layouts, notification_settings)
- `organization.py` -- Organization (name, slug unique+indexed, JSONB settings) + workspaces/members relationships
- `workspace.py` -- Workspace (org_id FK, composite unique on org_id+slug) + relationships
- `team.py` -- Team + TeamMember (unique team_id+user_id)
- `project.py` -- Project (key_prefix unique, ProjectStatus/RAGStatus enums, lead_id FK, archived_at/archived_by) + relationships
- `role.py` -- Role (unique name+scope_type) + RolePermission (unique role_id+permission, cascade delete)
- `members.py` -- OrgMember, WorkspaceMember, ProjectMember (all with unique user+entity constraints, role FK; ProjectMember adds capacity_pct, hours_per_week)

**Schemas (`backend/app/schemas/`):**
- user.py (UserBase/Create/Update/Response/Brief), user_preferences.py, organization.py, workspace.py, team.py, project.py, role.py (read-only), member.py (Org/Workspace/ProjectMember Create/Response + ProjectMemberUpdate)

**Repositories (`backend/app/repositories/`):**
- user.py (get_by_email), organization.py (get_by_slug), workspace.py (get_by_slug, get_by_org), team.py (get_by_workspace), project.py (get_by_workspace with archive filter, get_by_key_prefix), role.py (get_all, get_with_permissions), member.py (Org/Workspace/ProjectMember repos with compound-key lookups)

**Services (`backend/app/services/`):**
- user.py (CRUD + email uniqueness + preferences upsert), organization.py (CRUD + slug uniqueness), workspace.py, team.py (CRUD + member add/remove), project.py (CRUD + archive/unarchive + _check_not_archived guard), role.py (read-only), member.py (MemberService: org/workspace/project membership with conflict detection)

**API Endpoints (`backend/app/api/v1/endpoints/`):**
- `health.py` -- GET /health, /health/db (SELECT 1), /health/redis (PING from app pool)
- `users.py` -- CRUD + GET /users/me + PUT /users/me/preferences
- `organizations.py` -- CRUD + /{org_id}/members management
- `workspaces.py` -- /organizations/{org_id}/workspaces + /workspaces/{workspace_id} CRUD + members
- `teams.py` -- /workspaces/{workspace_id}/teams + /teams/{team_id} CRUD + members
- `projects.py` -- /workspaces/{workspace_id}/projects + /projects/{project_id} CRUD + archive/unarchive + members (with capacity_pct, role)
- `roles.py` -- GET /roles + /{role_id} with permissions

**Router:** `api/v1/router.py` includes all 7 endpoint routers.

### Phase 1C: Frontend Shell -- COMPLETE

**Core (`frontend/src/`):**
- `App.tsx` -- ErrorBoundary > QueryClientProvider > ThemeProvider > RouterProvider
- `router.tsx` -- createBrowserRouter, lazy-loaded pages with CircularProgress fallback, AppShell layout
- `main.tsx` -- React 18 createRoot with StrictMode

**Theme:** `theme/theme.ts` -- `getTheme(mode)` returning MUI createTheme. Dark default (bg #121212, primary #90caf9). Light option. Inter/system-ui font stack. Rounded cards, dense table padding.

**Stores (Zustand):**
- `stores/authStore.ts` -- currentUserId, permissions, setCurrentUser/clearUser
- `stores/uiStore.ts` -- sidebarCollapsed, themeMode (localStorage persist), toggle functions
- `stores/orgStore.ts` -- currentOrgId, currentWorkspaceId, setters

**API:** `api/client.ts` -- Axios instance, X-User-ID from authStore, X-Request-ID via crypto.randomUUID(), error interceptor for error envelope

**Layouts:**
- `layouts/AppShell.tsx` -- Flex layout: Sidebar + (TopBar + Outlet), mobile-aware
- `layouts/Sidebar.tsx` -- FRIDAY gradient branding, 6 nav items with MUI icons, collapsible (240px/64px), mobile temporary drawer. Exports EXPANDED_WIDTH/COLLAPSED_WIDTH
- `layouts/TopBar.tsx` -- Hamburger menu, theme toggle (sun/moon), notification badge, "Dev User" avatar

**Pages (all placeholders):** HomePage, ProjectsPage, RoadmapsPage, DashboardsPage, WikiPage, SettingsPage, NotFoundPage

**Components:**
- `components/common/ConfirmDialog.tsx` -- info/warning/danger severity, type-to-confirm for warning/danger
- `components/common/UndoToast.tsx` -- Snackbar with LinearProgress countdown (10s default), Undo button
- `components/common/SkeletonLoaders.tsx` -- SkeletonCard, SkeletonTable, SkeletonList, SkeletonDetail
- `components/common/ErrorBoundary.tsx` -- Class component boundary with friendly MUI error page, "Go Home"/"Try Again"
- `components/common/index.ts` -- barrel exports

**Config:** `orval.config.ts`, `.prettierrc`, `tsconfig.json` (strict, @/ alias), `vite.config.ts` (/api proxy to backend:8000)

### Phase 2: Issue Engine -- PARTIALLY COMPLETE

**Models -- DONE (`backend/app/models/`):**
- `issue_type.py` -- IssueType (project_id, name, icon, color, hierarchy_level, is_subtask, sort_order)
- `workflow.py` -- Workflow, WorkflowStatus (StatusCategory enum: to_do/in_progress/in_review/done/blocked), WorkflowTransition
- `issue.py` -- Issue (28+ columns including TSVector search_vector with GIN index, 6 composite indexes, CheckConstraint on percent_complete 0-100)
- `custom_field.py` -- CustomFieldDefinition (CustomFieldType enum, validation_json JSONB), CustomFieldValue (polymorphic: value_text/number/date/json)
- `issue_relation.py` -- IssueLink (IssueLinkType enum), IssueComment, IssueActivityLog
- `issue_extras.py` -- Label, Component, Version, TimeEntry, ProjectIssueCounter (project_id PK), issue_labels/issue_watchers junction tables
- `notification.py` -- AuditLog, Notification, SavedView, Favorite, RecentItem, TaskStatus, Upload
- All registered in `models/__init__.py` for Alembic discovery

**Schemas -- DONE (`backend/app/schemas/`):**
- issue_type.py, workflow.py (+ WorkflowDetailResponse with nested statuses/transitions), issue.py (IssueCreate/Update/Response/Brief + IssueBulkUpdateRequest/Response), custom_field.py, issue_relation.py (IssueLink/Comment/Activity schemas), issue_extras.py (Label/Component/Version/TimeEntry/SavedView/Favorite/Notification/TaskStatus/Upload schemas), search.py (SearchRequest/Result/Response)

**Repositories -- DONE (`backend/app/repositories/`):**
- issue_type.py, workflow.py (+ WorkflowStatusRepo, WorkflowTransitionRepo with get_valid_transitions), issue.py (get_by_project with filters, get_by_key, search with to_tsquery, bulk_update), issue_relation.py (IssueLink/Comment/Activity repos), issue_extras.py (Label/Component/Version/TimeEntry/SavedView/Notification/Favorite/RecentItem/TaskStatus/Upload repos)

**Services -- DONE (`backend/app/services/`):**
- issue_type.py, workflow.py (+ WorkflowEngine.validate_transition), issue.py (create with key generation + activity logging, update, transition, bulk_update, search), issue_key.py (SELECT ... FOR UPDATE on project_issue_counters), issue_extras.py (all supporting entity services), activity.py (log_activity + log_audit helpers)

---

## IMMEDIATE NEXT STEP: Phase 2 API Endpoints

### What to build

Create these API endpoint files in `backend/app/api/v1/endpoints/`:

1. **`issues.py`** -- Issues CRUD:
   - `GET /projects/{project_id}/issues` -- list with filters (status_id, issue_type_id, assignee_id, priority, milestone_id, label_id), cursor paginated
   - `POST /projects/{project_id}/issues` -- create (calls IssueService which generates issue_key via IssueKeyService)
   - `GET /issues/{issue_id}` -- get single issue with relationships
   - `PUT /issues/{issue_id}` -- update (logs field changes via activity service)
   - `DELETE /issues/{issue_id}` -- soft delete
   - `POST /projects/{project_id}/issues/bulk` -- bulk update (permission-guarded, rate-limited)
   - `GET /projects/{project_id}/issues/search?q=...` -- full-text search via search_vector

2. **`issue_types.py`** -- `GET/POST /projects/{project_id}/issue-types`, `GET/PUT/DELETE /issue-types/{id}`

3. **`workflows.py`** -- `GET/POST /projects/{project_id}/workflows`, `GET/PUT/DELETE /workflows/{id}`, `POST /workflows/{id}/statuses`, `POST /workflows/{id}/transitions`, `GET /workflows/{id}/transitions?from_status_id=...`

4. **`comments.py`** -- `GET/POST /issues/{issue_id}/comments`, `PUT/DELETE /comments/{id}`

5. **`issue_links.py`** -- `GET /issues/{issue_id}/links`, `POST /issues/{issue_id}/links`, `DELETE /issue-links/{id}`

6. **`custom_fields.py`** -- `GET/POST /projects/{project_id}/custom-fields`, `PUT/DELETE /custom-fields/{id}`, `GET/PUT /issues/{issue_id}/custom-field-values`

7. **`time_entries.py`** -- `GET/POST /issues/{issue_id}/time-entries`, `PUT/DELETE /time-entries/{id}`

8. **`labels.py`** -- `GET/POST /projects/{project_id}/labels`, `PUT/DELETE /labels/{id}`

9. **`components.py`** -- `GET/POST /projects/{project_id}/components`, `PUT/DELETE /components/{id}`

10. **`versions.py`** -- `GET/POST /projects/{project_id}/versions`, `PUT/DELETE /versions/{id}`

11. **`saved_views.py`** -- `GET/POST /projects/{project_id}/saved-views`, `PUT/DELETE /saved-views/{id}`

12. **`notifications.py`** -- `GET /me/notifications`, `PUT /me/notifications/{id}/read`, `PUT /me/notifications/read-all`

13. **`favorites.py`** -- `GET /me/favorites`, `POST /me/favorites`, `DELETE /me/favorites/{id}`

14. **`recent_items.py`** -- `GET /me/recent`

15. **`task_status_ep.py`** -- `GET /me/tasks`, `GET /tasks/{id}`

16. **`uploads.py`** -- `POST /uploads/images` (multipart, max 5MB, MIME whitelist: image/png, jpeg, gif, webp)

After creating endpoints, update `backend/app/api/v1/router.py` to include all new routers.

### Consistency checks (do these before or alongside the endpoints)

1. Update `backend/app/schemas/__init__.py` -- add all Phase 2 schema imports
2. Update `backend/app/repositories/__init__.py` -- add all Phase 2 repo imports
3. Update `backend/app/services/__init__.py` -- add all Phase 2 service imports
4. Verify cross-file imports are correct (Phase 2 files were created by different agents)
5. Generate first Alembic migration: `make makemigration` (inside Docker)
6. Run `make generate-api` (Orval) after all endpoints are finalized
7. **Docker hasn't been tested yet** -- run `docker compose up` and verify all 6 services start

### Phase 2 Tests (write after endpoints)

- API tests: full CRUD lifecycle (create issue, update, transition, comment, link, search, favorite)
- Service tests: workflow transition validation (valid/invalid), issue key uniqueness under concurrent calls, custom field validation
- Permission tests: member can create issues, viewer cannot, bulk ops require edit permission

---

## Tech Stack

- **Backend**: Python 3.12+, FastAPI, SQLAlchemy 2.0 (async), Alembic, Pydantic v2
- **Frontend**: React 18+ (TypeScript), Vite, MUI v6, React Query (TanStack Query), React Router v6, Zustand
- **Forms**: React Hook Form + Zod (dynamic custom fields via buildCustomFieldZodSchema)
- **API Type Generation**: Orval (generates React Query hooks + TypeScript types + Zod schemas from FastAPI OpenAPI spec)
- **Database**: PostgreSQL 16 (pg_trgm + tsvector full-text search)
- **Cache / Queue**: Redis 7 (caching, ARQ broker, rate limiting)
- **Background Tasks**: ARQ (async Redis-based) + watchfiles (worker hot-reload)
- **Rich Text**: TipTap (ProseMirror-based, @mentions, image upload)
- **Tables**: TanStack Table v8
- **Drag & Drop**: @dnd-kit/core + @dnd-kit/sortable
- **Gantt Chart**: DHTMLX Gantt (GPL, React wrapper)
- **Workflow Editor**: React Flow (@xyflow/react)
- **Charts**: Recharts
- **Dates**: date-fns + date-fns-tz
- **AI**: OpenAI GPT-4 (Phase 10)
- **PDF Export**: WeasyPrint
- **Auth**: Stub (X-User-ID header), architected for Azure AD SSO
- **Deployment**: Docker + docker-compose (6 services)
- **Logging**: structlog (JSON + request ID)

---

## Architecture

### Backend Layered Architecture

```
HTTP Request -> CORS -> RequestID Middleware -> RequestLogging Middleware -> RateLimit Middleware
  -> FastAPI Router -> Permission Guard (require_permission) -> Service Layer
  -> Repository Layer -> SQLAlchemy Models -> PostgreSQL
```

### Side Effects

- **FastAPI BackgroundTasks** (light, in-process): activity log writes, search index updates, audit log writes
- **ARQ task queue** (heavy, out-of-process): notifications, automation evaluation, AI API calls, imports/exports, auto-scheduling

### Three-Level RBAC

Org > Workspace > Project scope hierarchy. Permission inheritance: org_admin gets full access everywhere, workspace_admin to all projects in workspace. 9 system roles, granular permission strings. Enforced via `require_permission("issues.create")` FastAPI dependency that auto-extracts scope from path params.

### API Standards

- **Pagination**: Cursor-based. `?include_count=true` for optional total_count
- **Errors**: `{ error: { code, message, details, request_id } }`. Codes: VALIDATION_ERROR, NOT_FOUND, PERMISSION_DENIED, CONFLICT, RATE_LIMITED, INTERNAL_ERROR, VERSION_CONFLICT
- **Rate limits**: 200/min general, 10/min AI, 20/min bulk, 30/min intake forms (per IP)
- **Request ID**: UUID per request via X-Request-ID header, in all logs and error responses
- **Dates**: UTC timestamps (timestamptz), ISO-8601 in API, date-fns-tz conversion on frontend

---

## Remaining Phases -- Full Specifications

### Phase 3A: Issue Views (parallel with 3B, 3C)

**Goal**: Board, Table, and Timeline views with bulk actions and URL state.

- **Board View (Kanban)**: Columns per workflow status, drag-and-drop via `@dnd-kit/core` + `@dnd-kit/sortable`, swimlanes (by assignee/type/priority/milestone), WIP limits (configurable per column), RAG status badges, quick-create card at top of column, card shows: key, summary, assignee avatar, priority icon, RAG dot. Optimistic update on drag (React Query `onMutate`)
- **Table View**: TanStack Table v8 with MUI styling, virtualized rows via `@tanstack/react-virtual` (handles 1000+ issues), sortable/filterable columns, inline editing (click cell to edit, save on blur/Enter), column show/hide (including custom fields), column resize/reorder (persisted to `UserPreferences.column_layouts`), row selection checkboxes for bulk ops, % complete progress bars, RAG color indicators. **Bulk action toolbar**: appears when rows selected -- change status, assign, set priority, move to milestone, add label, delete (ConfirmDialog with danger severity for delete)
- **Timeline View (Gantt)**: DHTMLX Gantt wrapped in React component (`IssueTimeline`). Task data mapped from issues API, link data from issue_links. Columns panel (left) showing hierarchy, timeline panel (right) with bars. Zoom (day/week/month/quarter), drag-to-reschedule, dependency arrows, milestone diamonds, today marker, critical path highlighting, tooltip on hover. Styled to match MUI theme. Baseline overlay toggle
- **View Switcher Toolbar**: Unified filter bar (status, type, assignee, priority, milestone, label, component, RAG, text search), grouping options, saved views selector (dropdown + save current + set default). **URL state sync via `nuqs`**: all filter/sort/group/view state in URL query params. Shareable links. Browser back/forward navigates filter history

**Phase 3A Tests**: Board renders correct columns from workflow, drag fires mutation, table inline edit saves, filter changes update URL params

### Phase 3B: Issue Detail & Create (parallel with 3A, 3C)

**Goal**: Issue detail panel, create/edit modal, rich text with image upload and @mentions, scoped undo.

- **Issue Detail Panel**: Slide-out side panel (Jira-style). Status badge with transition dropdown (only valid transitions per workflow). Fields panel (right): Assignee picker, Reporter, Priority, Labels, Components, Version, Milestone, Estimation, % Complete, Dates, custom fields (dynamic via CustomFieldRenderer). Main area (left): Description (TipTap), child issues, linked issues, comments (with @mentions), activity log (filterable), watchers, time entries
- **Custom Field Renderer**: Dynamic rendering for all 11 field types. `buildCustomFieldZodSchema(validation_json)` generates Zod validators from field definition rules. Errors inline
- **Issue Create Modal**: React Hook Form + Zod. Select issue type first (changes available fields). Required: summary, type. Dynamic custom fields. Parent selector, milestone selector. Issue templates optional pre-fill. Quick-create mode (summary + type only, Enter to create)
- **TipTap Rich Text**: Bold, italic, strike, headings (h1-h4), lists, task lists, code blocks (lowlight), blockquotes, images (paste/drag -> POST /uploads/images), tables, horizontal rule. **@mentions**: Mention extension + Suggestion utility. Extracts mentioned user IDs on save for ARQ notification
- **Undo Toast**: Scoped to field changes + status transitions only. 10-second window. Stores previous value in component state. PATCH to revert. Does NOT reverse automations/notifications. VERSION_CONFLICT if concurrent modification

**Phase 3B Tests**: Undo toast reverts field change, saved views CRUD, favorites CRUD, image upload returns URL

### Phase 3C: Basic Home Dashboard (parallel with 3A, 3B)

**Goal**: Landing page for users.

- **Home page** (`/`): My open issues (grouped by project, sortable), overdue items (red highlight), recently assigned (last 7 days), activity feed (last 20 events from notifications)
- **Favorites & Recent**: Star button on projects/issues (favorites table), recent items in sidebar
- **Quick actions**: Create issue (modal with project selector), search placeholder (Cmd+K -- full in Phase 7A)

### Phase 4A: PM Planning (parallel with 4B)

**Goal**: Milestones, baselines, RAG, RACI, resource workload.

- **Milestones & Gates**: CRUD, timeline visualization (diamonds/pentagons), color by status. Gate approval: approver notification via ARQ, approve/reject with notes. Progress auto-calculated from linked issues
- **Baseline Scheduling**: Save plan as named baseline (snapshot dates/estimates/status). Compare on Gantt (dashed bars). Variance indicators. Multiple named baselines
- **RAG Status**: Per-issue selector. Rollup to parent (worst-child-wins or majority). Distribution donut (Recharts). RAG change notification via ARQ
- **RACI Matrix**: Interactive grid (rows=issues, columns=members). Click to cycle R/A/C/I. Validation: warn no Accountable, error >1 Accountable. Filter/bulk assign
- **Resource Workload**: Heatmap (Recharts): rows=members, columns=weeks. Color by capacity (green/amber/red). Click for popover details. Cross-project aggregation

### Phase 4B: PM Tracking (parallel with 4A)

**Goal**: Budget, decisions, stakeholders, documents, time tracking views.

- **Budget & Costs**: Project budget setup. Per-issue cost entries. Summary cards + burn chart (Recharts). Threshold alerts at 80/90/100% via ARQ
- **Decision Log**: Chronological list with status chips (Proposed/Decided/Superseded/Deferred). TipTap detail. Linked issues
- **Stakeholder Register**: CRUD table. Interest vs Influence 2x2 matrix (Recharts scatter). Drag to update via @dnd-kit
- **Document Management**: File upload with MIME whitelist + extension validation. Max 25MB streaming check. uploads table metadata. Image preview inline
- **Time Tracking Views**: Time log per issue. Weekly timesheet (per-user, Mon-Sun grid, inline editable). Time reports + CSV export

**Phase 4 Tests**: Milestone + gate approval, baseline variance, budget threshold at 80%, RACI validation, file upload rejects .exe/.accepts .pdf

### Phase 5: Configuration & Templates

**Goal**: Project settings, workflow editor, templates, creation wizard.

- **Project Settings** (`/projects/:id/settings`): General (archive button), Members & Roles, Issue Types (CRUD + hierarchy), Workflows (React Flow visual editor with ELKjs auto-layout), Custom Fields (validation rules UI), Issue Templates, Labels/Components/Versions, Budget settings, Saved Views
- **Project Templates** (seeded): Blank, Standard PM, Waterfall, Consulting, Product -- each with issue types, workflows, milestones, custom fields, sample labels
- **Project Creation Wizard**: 5-step modal: Name/Key, Template, Team, Milestones, Review & Create

**Phase 5 Tests**: Workflow validation (must have done status), template creates correct entities, archive blocks writes

### Phase 6A: Advanced Roadmaps (parallel with 6B)

**Goal**: Cross-project roadmaps, auto-scheduling, critical path, scenarios.

- **Data Model**: roadmap_plans, roadmap_plan_projects, roadmap_plan_settings, roadmap_teams, roadmap_scenarios, roadmap_scenario_overrides
- **Auto-Scheduling Engine** (ARQ with task_status progress): Build dependency graph -> topological sort -> schedule (capacity-aware) -> critical path -> cache in Redis
- **Roadmap Timeline**: DHTMLX Gantt (cross-project), hierarchy panel, dependency arrows, baseline overlay, capacity lane
- **Scenario Planning**: Fork into sandbox, override dates/assignments, side-by-side compare, apply or discard

### Phase 6B: Portfolio & Program (parallel with 6A)

**Goal**: Portfolio dashboards, program boards, release tracking.

- **Portfolio Overview** (`/portfolio`): Non-archived projects in card grid. RAG, progress %, budget health, next milestone. Sortable/filterable. CSV export
- **Program Board**: Rows=initiatives, columns=time periods. Dependency lines (SVG)
- **Release Tracking**: Cross-project releases, per-release progress, burndown
- **Cross-Project Dependencies**: Visual map, impact analysis ("If X slips N days..."), warning indicators

**Phase 6 Tests**: Auto-scheduler valid output, circular dep detection, critical path, scenario apply, portfolio excludes archived

### Phase 7A: Productivity (parallel with 7B, 8)

**Goal**: Global search, notifications, recurring tasks, SLA.

- **Cmd+K Search**: Add search_vector to comments, wiki_pages, decisions, projects. Faceted `GET /search?q=...&types=...`. MUI command palette overlay, debounced, grouped results, recent searches, quick actions
- **Notification Center**: Bell icon + unread badge (polls every 30s). Dropdown list, click to navigate + mark read. Preferences per-type in UserPreferences
- **Recurring Tasks**: recurring_rules table. ARQ cron hourly. UI in project settings: create/edit/pause/delete, preview next 5 occurrences
- **SLA Tracking**: sla_policies + business_hours_config + issue_sla_status tables. Deadline computation respecting business hours. ARQ cron for approaching/breached. Countdown on issue detail (green/amber/red)

### Phase 7B: Forms & Approvals (parallel with 7A, 8)

**Goal**: Intake forms, approval workflows.

- **Intake Forms**: intake_forms table. Form builder UI. Shareable URL (no auth, branded). 30/min rate limit per IP. Creates issue with "Triage" status
- **Approval Workflows**: approval_steps + issue_approvals tables. ARQ notifications. Approve/reject with comments. Blocks transition until approved

**Phase 7 Tests**: Search faceted results, SLA business hours (Friday 4pm + 4hr = Monday 10am), recurring creates issue, form rate limits, approval blocks transition

### Phase 8: Wiki / Knowledge Base (parallel with 7A, 7B)

**Goal**: Confluence-like wiki with optimistic concurrency.

- **Data Model**: wiki_spaces, wiki_pages (version integer for OCC, content_search_vector), wiki_page_versions, wiki_page_comments
- **Wiki Editor**: TipTap + slash commands + callout blocks + issue references. Auto-save (2s debounce). Optimistic concurrency: save sends version, backend WHERE version = :expected, VERSION_CONFLICT if stale
- **Wiki Features**: Tree navigation with @dnd-kit, version history with diff, page comments (threaded), full-text search, cross-linking to issues, PDF export (WeasyPrint)

**Phase 8 Tests**: Wiki CRUD, version increment, concurrent save conflict, search, PDF export

### Phase 9: Dashboards & Analytics

**Goal**: Project/portfolio/team/custom dashboards, pre-built reports.

- **Personal Dashboard** (`/`): My issues, overdue, milestones (next 30d), activity, time logged (Recharts bar), SLA breaches
- **Project Dashboard**: RAG, progress donut, milestone timeline, metrics cards, open/closed trend, burn-up, budget summary, workload mini-heatmap
- **Portfolio Dashboard**: Non-archived projects, RAG, progress, budget health, sparklines, CSV export
- **Team Dashboard**: Workload bars, velocity trend, capacity forecast
- **Custom Dashboards**: react-grid-layout drag-and-drop widgets. Widget types: bar/donut/line charts, activity feed, milestone progress. Templates: PM/Executive/Team
- **Pre-Built Reports**: Issues by Status/Assignee, Time Logged, Budget Summary, SLA Compliance, Milestone Status. Parameterized SQL with statement_timeout. CSV/PDF export

**Phase 9 Tests**: Report data correct, CSV matches, PDF valid, dashboard persists layout

### Phase 10: AI & Automation

**Goal**: Workflow automations, AI features, import/export.

- **Automations**: automation_rules + execution_log tables. Builder UI: WHEN + IF + THEN. Engine (ARQ): depth-limited recursion (max 5) + visited set + 100/project/min rate limit
- **AI** (OpenAI GPT-4 via ARQ with task_status): Smart Scheduling, Risk Prediction, Auto-Summarize. 10/min rate limit
- **Import/Export**: CSV Import Wizard (preview, map, validate, ARQ import), CSV Export, Jira Import (XML/JSON), Full Project JSON Export

**Phase 10 Tests**: Automation evaluation, recursion depth 5, circular detection, AI task_status (mock OpenAI), CSV import parent-child

### Phase 11: Polish & Responsiveness

**Goal**: Responsive, performance, accessibility, E2E tests.

- **Responsive**: Sidebar -> bottom drawer mobile. Board horizontal scroll. Table pinned column. Gantt simplified. Breakpoints: <768 mobile, 768-1024 tablet, >1024 desktop
- **Performance**: Virtual scrolling, lazy loading, optimistic updates, debounced search, DB index audit (EXPLAIN ANALYZE), Redis caching (dashboards 5min TTL, permissions), bundle analysis (vite-bundle-visualizer)
- **Keyboard Shortcuts**: Cmd+K, C (create), V (view switch), Esc, ?, G+H (home), G+P (projects)
- **Accessibility**: ARIA labels, focus trap, screen reader, WCAG AA contrast, keyboard-navigable
- **E2E (Playwright)**: 10 critical flows: project creation, issue creation, board drag, table inline edit, Gantt interaction, milestone approval, search, wiki, dashboard, intake form
- **Audits**: Lighthouse >80, axe 0 critical violations

---

## Key Architecture Decisions

- **UUIDs everywhere** via `uuid-ossp` extension
- **Soft deletes + archival** -- SoftDeleteMixin (is_deleted) auto-filtered; Projects have separate archived_at (read-only but visible)
- **Repository pattern** -- all DB queries in repo classes, services are storage-agnostic
- **Issue keys via advisory lock** -- SELECT ... FOR UPDATE on project_issue_counters for gap-free concurrent-safe keys
- **Polymorphic custom fields** -- value_text/number/date/json columns; validation_json on definition enforced backend + frontend (dynamic Zod)
- **Cursor-based pagination** -- base64+JSON cursor with sort value + id tie-breaking; optional total_count
- **Standard error envelope** -- { code, message, details, request_id } including VERSION_CONFLICT
- **Redis rate limiting** -- token bucket per-route, graceful degradation if Redis down
- **Orval API types** -- `make generate-api` after any backend endpoint change
- **Linear Alembic migrations** -- never branch, `make check-migrations` enforced
- **URL state sync** -- nuqs library for filter/sort/group in URL params
- **Scoped undo** -- 10s toast for field changes + status transitions only, VERSION_CONFLICT on concurrent edit
