# Infrastructure & DevOps

Reference for the Friday development environment, Docker services, background jobs, and operational tooling.

## Docker Compose Services

File: `docker-compose.yml` — 6 services (pgadmin only in debug profile)

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `db` | `postgres:16-alpine` | 5432 | PostgreSQL database with `pg_trgm` + `uuid-ossp` extensions |
| `redis` | `redis:7-alpine` | 6379 | Caching, ARQ broker, rate limiting. AOF persistence enabled |
| `backend` | Custom (Dockerfile) | 8000 | FastAPI + uvicorn. Hot-reload via volume mount of `backend/app/` |
| `worker` | Same as backend | — | ARQ worker. Hot-reload via `watchfiles`. Waits 5s for backend migrations |
| `frontend` | Custom (Dockerfile) | 3000 | Vite dev server. Hot-reload via volume mount of `frontend/src/` |
| `pgadmin` | `dpage/pgadmin4` | 5050 | Database admin UI. Only starts with `--profile debug` |

### Service Dependencies

```
frontend → backend → db (healthy), redis (healthy)
worker → db (healthy), redis (healthy)
pgadmin (debug profile only)
```

### Health Checks

- **db**: `pg_isready -U friday` (5s interval, 5 retries)
- **redis**: `redis-cli ping` (5s interval, 5 retries)

## Makefile Targets

File: `Makefile`

| Target | Command | Description |
|--------|---------|-------------|
| `make up` | `docker compose up -d` | Start all services |
| `make down` | `docker compose down` | Stop all services |
| `make rebuild` | `docker compose up -d --build` | Rebuild and start |
| `make reset` | `docker compose down -v && up --build` | Full reset (destroys volumes) |
| `make logs` | `docker compose logs -f backend worker` | Tail backend + worker logs |
| `make migrate` | `alembic upgrade head` | Run pending migrations |
| `make makemigration` | `alembic revision --autogenerate` | Generate new migration (prompts for message) |
| `make check-migrations` | `alembic check` | Verify migration state |
| `make seed` | `python -m app.seed` | Seed system roles + dev user |
| `make test-backend` | `pytest -v --tb=short` | Run backend tests |
| `make test-frontend` | `npm test` | Run frontend tests |
| `make generate-api` | `npx orval` | Regenerate TypeScript types from OpenAPI |
| `make shell` | `bash` in backend container | Open backend shell |
| `make db` | `psql -U friday -d friday` | Open PostgreSQL shell |
| `make backup` | `pg_dump` to `backups/` | Create database backup |

## PostgreSQL Configuration

- **Version**: 16 (Alpine)
- **Extensions**: `pg_trgm` (trigram matching), `uuid-ossp` (UUID generation). Initialized via `backend/scripts/init-extensions.sql`
- **Connection pooling** (SQLAlchemy):
  - `pool_size=5`
  - `max_overflow=10`
  - `pool_pre_ping=True`
- **Database**: `friday` (configured via `POSTGRES_DB` env var)

### Key Database Features

- **TSVector search**: Full-text search on issues via GIN index on `search_vector` column
- **UUID primary keys**: All tables use `gen_random_uuid()` server default
- **Timezone-aware timestamps**: All `DateTime` columns use `timezone=True`

## Redis Configuration

- **Version**: 7 (Alpine)
- **Persistence**: AOF (`appendonly yes`)

### Redis Usage Patterns

| Use Case | Key Pattern | TTL |
|----------|-------------|-----|
| Permission cache | `perm:{user_id}:{scope}:{scope_id}:{permission}` | 300s |
| Rate limiting | `rate_limit:{identifier}` | 60s |
| Dashboard cache | `dashboard:{type}:{id}` | 300s |
| ARQ job queue | Managed by ARQ | — |

## Background Jobs (ARQ)

File: `backend/app/worker.py`

### Worker Configuration

```python
class WorkerSettings:
    max_jobs = 10
    job_timeout = 300  # 5 minutes
```

### Registered Functions

| Task | File | Description |
|------|------|-------------|
| `run_auto_schedule` | `backend/app/tasks/scheduling.py` | Topological sort + capacity-aware scheduling |
| `evaluate_automations` | `backend/app/tasks/automation.py` | Run automation rules engine |
| `ai_summarize` | `backend/app/tasks/ai.py` | OpenAI GPT-4 issue summary |
| `ai_risk_prediction` | `backend/app/tasks/ai.py` | AI risk analysis |
| `ai_smart_schedule` | `backend/app/tasks/ai.py` | AI scheduling suggestions |
| `import_csv` | `backend/app/tasks/import_export.py` | CSV data import |
| `export_csv` | `backend/app/tasks/import_export.py` | CSV data export |
| `analyze_documents` | `backend/app/tasks/document_import.py` | Document analysis for project import |
| `create_project_from_documents` | `backend/app/tasks/document_import.py` | Create project from parsed documents |
| `send_email_notification` | `backend/app/tasks/notification_tasks.py` | Individual email delivery |
| `send_daily_digest` | `backend/app/tasks/notification_tasks.py` | Daily digest email |

### Cron Jobs

| Task | Schedule | Description |
|------|----------|-------------|
| `process_recurring_tasks` | Every 6h (0, 6, 12, 18) | Generate issues from recurring rules |
| `check_sla_breaches` | Every 15min | Check for approaching/breached SLAs |
| `send_daily_digest` | 8:00 UTC daily | Daily notification digest |

## Middleware Stack

File: `backend/app/core/middleware.py`

Applied in order (outermost first):

1. **RequestIDMiddleware** — Assigns UUID to every request. Reads `X-Request-ID` header or generates one. Binds to structlog context vars. Returns ID in response header.

2. **RequestLoggingMiddleware** — Logs `request_started` and `request_finished` events with method, path, status code, duration (ms), and request ID.

3. **RateLimitMiddleware** — Redis token-bucket rate limiting. Default 200/min per user (identified by `X-User-ID` or client IP). Per-route overrides via `rate_limit:N` tags. Gracefully degrades if Redis unavailable.

## Logging

Library: `structlog`

- **Production**: JSON output
- **Development**: Colored console output
- **Context**: Request ID bound to every log entry via `structlog.contextvars`
- **Config**: `backend/app/core/logging_config.py`

## Alembic Migrations

- **Directory**: `backend/alembic/versions/`
- **Strategy**: Linear (never branch). Auto-generated from model changes
- **Create**: `make makemigration` (prompts for description)
- **Apply**: `make migrate` (runs `alembic upgrade head`)
- **Check**: `make check-migrations` (verifies DB matches models)

## Environment Variables

Configured via `.env` file, loaded by Docker Compose:

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `friday` | Database name |
| `POSTGRES_USER` | `friday` | Database user |
| `POSTGRES_PASSWORD` | — | Database password |
| `REDIS_URL` | `redis://redis:6379/0` | Redis connection URL |
| `DB_PORT` | `5432` | Exposed PostgreSQL port |
| `REDIS_PORT` | `6379` | Exposed Redis port |
| `BACKEND_PORT` | `8000` | Exposed backend port |
| `FRONTEND_PORT` | `3000` | Exposed frontend port |
| `VITE_API_URL` | `http://localhost:8000/api/v1` | Frontend API base URL |
| `RATE_LIMIT_PER_MINUTE` | `200` | Default rate limit |
| `CORS_ORIGINS` | — | Allowed CORS origins |

## Development Workflow

1. `make up` — Start all services
2. `make seed` — Seed roles and dev user (first time only)
3. Edit code — Hot-reload on both backend and frontend
4. `make logs` — Monitor backend + worker logs
5. `make test-backend` / `make test-frontend` — Run tests
6. `make makemigration` — After model changes
7. `make migrate` — Apply migrations
8. `make generate-api` — After endpoint changes, regenerate frontend types
