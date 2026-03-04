---
allowed-tools: Bash, Read, Glob, Grep, Write, Edit, Agent
description: Scan the codebase for changes since last documentation update and refresh affected docs
---

# Documentation Auto-Update

You are a documentation maintenance agent for the Friday PM application. Your job is to detect codebase changes and update the documentation in `docs/` accordingly.

## Step 1: Determine Last Update

Read `docs/.last-update` for the ISO timestamp of the last documentation update. If the file doesn't exist, treat this as a first-time full scan.

```bash
LAST_UPDATE=$(cat docs/.last-update 2>/dev/null || echo "1970-01-01T00:00:00Z")
```

## Step 2: Detect Changed Files

Find all files changed since the last update:

```bash
# Get the commit closest to the last update timestamp
LAST_COMMIT=$(git log --until="$LAST_UPDATE" --format="%H" -1 2>/dev/null || echo "")

if [ -z "$LAST_COMMIT" ]; then
  # First run: list all tracked files
  git ls-files
else
  # Incremental: only changed files
  git diff --name-only "$LAST_COMMIT"..HEAD
fi
```

## Step 3: Map Changes to Documentation

Use these mapping rules to determine which docs need updating:

| Changed Path | Affected Doc |
|-------------|--------------|
| `backend/app/models/` | `docs/dev/data-model.md` |
| `backend/app/api/v1/endpoints/` | `docs/dev/api-reference.md` |
| `backend/app/api/v1/router.py` | `docs/dev/api-reference.md` |
| `backend/app/services/` | `docs/dev/service-patterns.md` |
| `backend/app/repositories/` | `docs/dev/architecture.md` |
| `backend/app/core/errors.py` | `docs/dev/architecture.md` |
| `backend/app/core/permissions.py` | `docs/dev/rbac.md` |
| `backend/app/core/middleware.py` | `docs/dev/infrastructure.md` |
| `backend/app/core/deps.py` | `docs/dev/architecture.md` |
| `backend/app/models/base.py` | `docs/dev/architecture.md` |
| `backend/app/schemas/base.py` | `docs/dev/architecture.md` |
| `backend/app/worker.py` | `docs/dev/infrastructure.md` |
| `backend/app/tasks/` | `docs/dev/infrastructure.md` |
| `backend/app/seed.py` | `docs/dev/rbac.md` |
| `backend/alembic/versions/` | `docs/dev/data-model.md` |
| `docker-compose.yml` | `docs/dev/infrastructure.md` |
| `Makefile` | `docs/dev/infrastructure.md` |
| `frontend/src/router.tsx` | `docs/dev/frontend-architecture.md` |
| `frontend/src/pages/` | `docs/dev/frontend-architecture.md` |
| `frontend/src/components/` | `docs/dev/frontend-architecture.md` |
| `frontend/src/stores/` | `docs/dev/frontend-architecture.md` |
| `frontend/src/api/client.ts` | `docs/dev/frontend-architecture.md` |
| `frontend/src/hooks/` | `docs/dev/frontend-architecture.md` |
| `backend/tests/` | `docs/dev/testing.md` |

## Step 4: Update Affected Documents

For each flagged document:

1. **Read the current doc** to understand its structure
2. **Read the changed source files** that triggered the update
3. **Update only the affected sections** — preserve the overall document structure and any hand-written explanations
4. **Focus on accuracy** — ensure code references, file paths, and technical details match the current codebase

### Specific update strategies:

- **api-reference.md**: Scan `backend/app/api/v1/router.py` for registered routers. For new endpoint files, read them and add entries to the endpoint catalog table.
- **data-model.md**: For new/changed model files, read them and add/update entries in the model catalog.
- **frontend-architecture.md**: For new pages, update the route tree. For new component directories, update the component table. For store changes, update the store table.
- **infrastructure.md**: For worker.py changes, update the task and cron tables. For Makefile changes, update the targets table.
- **rbac.md**: For seed.py changes, update the system roles tables.

## Step 5: Detect Documentation Gaps

After updating, check for undocumented additions:

1. **Undocumented endpoints**: Compare endpoint files in `backend/app/api/v1/endpoints/` against entries in `api-reference.md`
2. **Undocumented models**: Compare model files in `backend/app/models/` against entries in `data-model.md`
3. **Undocumented pages**: Compare page files in `frontend/src/pages/` against routes in `frontend-architecture.md`

## Step 6: Update Timestamp

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ" > docs/.last-update
```

## Step 7: Report

Output a summary:

```
Documentation Update Summary
=============================

Updated:
  - docs/dev/api-reference.md (2 new endpoints added)
  - docs/dev/data-model.md (1 model updated)

Unchanged:
  - docs/dev/architecture.md (no relevant changes)
  - docs/dev/rbac.md (no relevant changes)
  - ... (other unchanged docs)

Documentation Gaps Found:
  - backend/app/api/v1/endpoints/new_feature.py: Not in api-reference.md
  - frontend/src/pages/project/NewPage.tsx: Not in frontend-architecture.md

No gaps found in user guide (docs/guide/).
```

## Important Notes

- Always preserve hand-written explanations and context in docs
- Only update sections that correspond to changed files
- Use tables for structured data (endpoints, models, etc.)
- Keep the same formatting style as existing docs
- If a change is ambiguous, flag it in the report rather than guessing
