# Friday Documentation

## Developer Documentation

Reference documentation for Claude AI agents and developers working on the Friday codebase.

| Document | Description |
|----------|-------------|
| [Architecture Deep Dive](dev/architecture.md) | 5-layer pattern, request flow, error handling, dependency injection |
| [API Reference](dev/api-reference.md) | All endpoints, pagination, error codes, rate limits |
| [Data Model Reference](dev/data-model.md) | All models, relationships, indexes, enums |
| [Feature Implementation Guide](dev/feature-guide.md) | Step-by-step checklist for adding new features |
| [Service Layer Patterns](dev/service-patterns.md) | Business logic, events, workflow engine, background tasks |
| [Frontend Architecture](dev/frontend-architecture.md) | Components, hooks, stores, routing, styling |
| [Infrastructure & DevOps](dev/infrastructure.md) | Docker, migrations, ARQ, Redis, logging |
| [RBAC System](dev/rbac.md) | Three-level permissions, roles, caching |
| [Testing Patterns](dev/testing.md) | pytest async, vitest, fixtures, conventions |

## User Guide

Task-oriented guides for Friday end users. These documents are written in wiki-importable Markdown for use in Friday's built-in wiki feature.

| Document | Description |
|----------|-------------|
| [Getting Started](guide/getting-started.md) | Onboarding, first project, navigation, keyboard shortcuts |
| [Projects](guide/projects.md) | Creation, templates, settings, team management |
| [Issues & Workflows](guide/issues-and-workflows.md) | Issues, custom fields, views (board/table/timeline) |
| [Planning](guide/planning.md) | Milestones, roadmaps, sprints, risks |
| [Tracking](guide/tracking.md) | Time, budget, dashboards, reports, EVM |
| [Collaboration](guide/collaboration.md) | Wiki, decisions, stakeholders, RACI |
| [Advanced Features](guide/advanced.md) | Automations, intake, approvals, integrations, AI |
| [Administration](guide/administration.md) | Roles, permissions, import/export |

## Keeping Docs Updated

Run `/project:docs:update` to scan for codebase changes and refresh documentation automatically.
