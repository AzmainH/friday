# Frontend Architecture

Reference for Claude AI agents working on the Friday frontend. Covers project structure, routing, state management, API layer, and component conventions.

## Tech Stack

- React 18, TypeScript, Vite 6
- TanStack Query (server state), Zustand (client state)
- Tailwind CSS 4 (dark mode default)
- react-hook-form + zod (forms)
- lucide-react (icons)
- TipTap (rich text editor)
- DHTMLX Gantt (timeline/Gantt charts)
- @dnd-kit (drag-and-drop for Kanban)
- Recharts (charts)
- react-grid-layout (dashboard widgets)
- @tanstack/react-table (data tables)
- @tanstack/react-virtual (list virtualization)
- framer-motion (animations)
- nuqs (URL state)
- date-fns / date-fns-tz (date formatting)

## Project Structure

```
frontend/src/
  api/
    client.ts          # Axios instance with auth + request ID interceptors
    hooks.ts           # Generic CRUD hooks (useCursorList, useDetail, etc.)
  components/          # 38 feature directories (see Component Organization)
  hooks/               # Custom React hooks (18+)
  layouts/
    AppShell.tsx        # Root layout: Sidebar + TopBar + Outlet
    ProjectLayout.tsx   # Project wrapper: loads project data into store
    Sidebar.tsx         # Navigation (240px expanded, 64px collapsed)
    TopBar.tsx          # Search, theme toggle, notifications, user menu
  pages/               # Route-level page components (lazy-loaded)
  stores/              # Zustand state stores (5 stores)
  types/
    api.ts             # TypeScript interfaces for all API entities (288 lines)
```

The `@/` path alias maps to `frontend/src/`.

## Routing

File: `frontend/src/router.tsx`

Uses React Router v6 with `createBrowserRouter`. All pages are lazy-loaded with `React.lazy()` and wrapped in `Suspense`.

### Route Tree

```
/ (AppShell)
├── /                              → Home (dashboard, my issues, activity)
├── /projects                      → Projects list (card grid with RAG indicators)
├── /projects/new                  → Project creation wizard
├── /projects/import-documents     → Document import wizard
├── /projects/:projectId           → ProjectLayout wrapper
│   ├── (index) / board            → Kanban board (default project view)
│   ├── issues                     → Issues list
│   ├── issues/:issueId            → Issue detail
│   ├── table                      → Table/list view
│   ├── timeline                   → Gantt timeline
│   ├── milestones                 → Milestones & gate approvals
│   ├── budget                     → Budget tracking
│   ├── decisions                  → Decision log
│   ├── stakeholders               → Stakeholder management
│   ├── documents                  → Project documents
│   ├── time-tracking              → Time entries & timesheets
│   ├── dashboard                  → Project dashboard (custom widgets)
│   ├── settings                   → Project settings
│   ├── automations                → Workflow automations
│   ├── intake                     → Intake forms
│   ├── approvals                  → Gate approvals
│   ├── import-export              → Data import/export
│   ├── integrations               → Third-party integrations
│   ├── reports                    → Project reports
│   ├── sprints                    → Sprint management
│   └── risks                      → Risk management
├── /planning                      → Planning hub (roadmaps, portfolio, releases)
├── /planning/roadmaps/:planId     → Roadmap detail
├── /planning/resources            → Resource planning
├── /planning/executive            → Executive dashboard
├── /knowledge                     → Wiki/knowledge base
├── /knowledge/:pageId             → Wiki page detail
├── /settings                      → Global settings
└── *                              → 404 Not Found
```

### Layout Components

**AppShell** (`frontend/src/layouts/AppShell.tsx`):
- Wraps all routes
- Renders Sidebar + TopBar + page content via `<Outlet />`
- Manages onboarding wizard/checklist
- AI copilot panel toggle
- Keyboard shortcuts help dialog
- Page transition animations (framer-motion)

**ProjectLayout** (`frontend/src/layouts/ProjectLayout.tsx`):
- Wraps all `/projects/:projectId/*` routes
- Auto-loads project details, workflow, statuses, issue types
- Syncs loaded data to `projectStore`

## State Management

### Server State: TanStack Query

All API data fetching uses TanStack Query with 30s staleTime. Generic hooks in `frontend/src/api/hooks.ts`:
- `useCursorList` — paginated list with cursor
- `useDetail` — single entity fetch
- `useCreateMutation` — POST with cache invalidation
- `useUpdateMutation` — PUT/PATCH with optimistic updates
- `useDeleteMutation` — DELETE with cache invalidation

### Client State: Zustand Stores

| Store | File | State | Persistence |
|-------|------|-------|-------------|
| `useAuthStore` | `stores/authStore.ts` | `currentUserId`, `permissions` | None |
| `useUiStore` | `stores/uiStore.ts` | `sidebarCollapsed`, `themeMode` | localStorage (`friday-ui`) |
| `useOrgStore` | `stores/orgStore.ts` | `currentOrgId`, `currentWorkspaceId` | None |
| `useProjectStore` | `stores/projectStore.ts` | `currentProject`, `workflow`, `statuses`, `issueTypes` | None |
| `useSearchStore` | `stores/searchStore.ts` | `isOpen`, `query`, `selectedIndex` | None |

## API Layer

File: `frontend/src/api/client.ts`

Axios instance with interceptors:
- **Request interceptor**: Adds `X-User-ID` from authStore, generates `X-Request-ID` via `crypto.randomUUID()`
- **Response interceptor**: Logs errors with request ID to console
- **Base URL**: `VITE_API_URL` env var or `/api/v1` fallback

### Orval Code Generation

Run `make generate-api` to regenerate TypeScript types and React Query hooks from the backend's OpenAPI spec. This uses [Orval](https://orval.dev/) to auto-generate type-safe API hooks.

## Component Organization

38 feature directories under `frontend/src/components/`:

| Directory | Contents |
|-----------|----------|
| `ai/` | AI copilot panel, chat messages, quick actions |
| `automations/` | Automation builder, trigger/action/condition selectors |
| `baseline/` | Baseline comparison view |
| `board/` | Kanban columns, cards, drag overlay, swimlanes |
| `budget/` | Cost entry form, summary cards, burn chart |
| `common/` | Error boundary, keyboard shortcuts, undo toast, confirm dialog, skeletons |
| `dashboard/` | Widgets, grid layout, picker, EVM, portfolio health |
| `decisions/` | Decision detail |
| `dependencies/` | Dependency map |
| `document-import/` | WBS tree preview, resource mapper, status mapper |
| `editor/` | Rich text editor (TipTap), mention suggestion |
| `gantt/` | Gantt chart component |
| `home/` | My issues, recent activity, overdue, quick actions, favorites |
| `import/` | CSV import wizard, column mapper |
| `intake/` | Form builder, public form view |
| `integrations/` | Slack, GitHub, webhook forms and logs |
| `issue/` | Issue detail, fields, comments, custom field renderer, create modal |
| `milestones/` | Timeline, gate approval cards |
| `notifications/` | Notification center and items |
| `onboarding/` | Wizard and checklist |
| `portfolio/` | Project cards, program board |
| `raci/` | RACI matrix |
| `rag/` | RAG status selector, distribution donut |
| `reports/` | Report viewer, filters, charts |
| `resource/` | Capacity table, utilization chart |
| `risk/` | Risk dialog, heat map |
| `roadmap/` | Roadmap Gantt, scenario panel |
| `search/` | Command palette (Ctrl+K) |
| `settings/` | Custom fields, issue types, labels, workflows, members |
| `sprint/` | Sprint planning, burndown, complete dialog |
| `stakeholders/` | Stakeholder components |
| `table/` | Issue table, bulk actions, column config |
| `templates/` | Template card, gallery, use template dialog |
| `time/` | Time tracking components |
| `ui/` | Base components (Button, Input, Dialog, Table, Card, Badge, Toast, etc.) |
| `views/` | Saved view selector, view switcher, filter bar |
| `wiki/` | Editor, tree nav, comments, search, version history |
| `workload/` | Workload heatmap |

## Custom Hooks

18+ hooks in `frontend/src/hooks/`:

| Hook | Purpose |
|------|---------|
| `useAI` | AI copilot integration |
| `useAdvancedSearch` | Full-text search with filters |
| `useAutomations` | Automation CRUD |
| `useBudget` | Budget tracking |
| `useColumnPreferences` | Column layout persistence |
| `useDashboard` | Dashboard CRUD & layout |
| `useDecisions` | Decision management |
| `useDocumentImport` | Document upload & parsing |
| `useEVM` | Earned Value Management metrics |
| `useExecutiveDashboard` | Portfolio aggregation |
| `useFilterState` | Filter persistence |
| `useGlobalSearch` | Workspace-wide search |
| `useImportExport` | CSV import/export |
| `useIntakeForms` | Form builder & submission |
| `useIntegrations` | Third-party integration config |
| `useIssueDetail` | Issue detail loading |
| `useIssueMutation` | Issue CRUD mutations |
| `useIssuesByStatus` | Issues grouped by status (for board) |
| `useMilestones` | Milestone CRUD & gate approvals |
| `useProjectSettings` | Project configuration |
| `useResourcePlanning` | Team capacity & allocation |

## Styling Conventions

- **Tailwind CSS 4** with utility-first classes
- **Dark mode** is the default theme; light mode available via toggle
- **`cn()` utility** for conditional class merging (clsx + tailwind-merge)
- **No CSS modules** — all styling via Tailwind classes
- **Headless UI** (`@headlessui/react`) for accessible dropdown/dialog primitives

## Adding a New Frontend Feature

1. Run `make generate-api` if new backend endpoints exist
2. Create page component in `frontend/src/pages/` (or `frontend/src/pages/project/` if project-scoped)
3. Create feature components in `frontend/src/components/{feature}/`
4. Create custom hook in `frontend/src/hooks/` if needed
5. Add route to `frontend/src/router.tsx` with lazy import
6. Add sidebar nav item in `frontend/src/layouts/Sidebar.tsx` if needed
