# Friday -- Enterprise Project Management Application

## Tech Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2 (async), PostgreSQL 16, Redis 7, ARQ (background jobs), Alembic
- **Frontend**: React 18, TypeScript, Vite 6, TanStack Query, Zustand, Tailwind CSS 4, TipTap, DHTMLX Gantt
- **Infrastructure**: Docker Compose (db, redis, backend, worker, frontend), Makefile
- **Auth**: Stub via `X-User-ID` header (architected for Azure AD SSO later)

## Quick Commands

| Command | Action |
|---------|--------|
| `make up` | Start all services |
| `make rebuild` | Rebuild and start |
| `make reset` | Full reset (destroy volumes + rebuild) |
| `make logs` | Tail backend + worker logs |
| `make test-backend` | Run pytest in backend container |
| `make test-frontend` | Run vitest in frontend container |
| `make migrate` | Run Alembic migrations |
| `make makemigration` | Generate new Alembic migration |
| `make generate-api` | Regenerate Orval API types/hooks |
| `make db` | Open psql shell |
| `make seed` | Seed system roles/permissions |

## Directory Structure

```
backend/app/
  api/v1/endpoints/   # FastAPI route handlers (thin wrappers)
  core/               # Config, database, middleware, deps, errors, permissions
  models/             # SQLAlchemy models (BaseModel + mixins)
  repositories/       # Data access layer (BaseRepository with cursor pagination)
  schemas/            # Pydantic v2 request/response models
  services/           # Business logic layer
  tasks/              # ARQ background tasks
backend/tests/        # pytest (async, httpx ASGI transport)
backend/alembic/      # Database migrations

frontend/src/
  api/                # Axios client, Orval-generated hooks
  components/         # React components organized by feature
  hooks/              # Custom React hooks
  layouts/            # AppShell, Sidebar, TopBar
  pages/              # Route-level page components
  stores/             # Zustand state stores
  types/              # TypeScript type definitions
```

## Architecture Patterns

### Backend: 5-Layer Pattern

Every feature follows: **Model -> Repository -> Service -> Schema -> Endpoint**

- Models inherit `BaseModel` (UUID PK) + `AuditMixin` + `SoftDeleteMixin` (`backend/app/models/base.py`)
- Repositories inherit `BaseRepository[T]` with cursor-based pagination (`backend/app/repositories/base.py`)
- Services contain all business logic; endpoints are thin wrappers
- Schemas use Pydantic v2 with `ConfigDict(from_attributes=True)`
- Errors use `AppException` subclasses (`backend/app/core/errors.py`)
- Ruff formatting: line-length 100, target Python 3.12

### Frontend Conventions

- TanStack Query for server state, Zustand for client state
- Orval generates API hooks from OpenAPI spec (`make generate-api`)
- Tailwind CSS with dark mode as default
- `@/` path alias maps to `frontend/src/`
- Forms: react-hook-form + zod validation
- Icons: lucide-react

## Development Environment

- Frontend: `localhost:3000`
- Backend API: `localhost:8000/api/v1`
- API Docs: `localhost:8000/docs`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## Custom Commands

Add skill files to `.claude/commands/` -- each `.md` file becomes a `/project:<name>` command. See `.claude/commands/README.md` for details.

## Reference

See `FRIDAY_BUILD_PLAN.md` for the full phased build plan and current build state.
