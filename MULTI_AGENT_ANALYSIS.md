# Friday PM App: Comprehensive Multi-Agent Analysis & Improvement Plan

## Context

Friday is an enterprise project management application (~70-80% complete) built with FastAPI/PostgreSQL backend and React/TypeScript frontend. This plan is the result of a comprehensive multi-agent analysis involving 6+ specialized agents examining the app from software architecture, project management, PMO, UX, product, and DevOps perspectives. Competitive research against Jira, Linear, Asana, Monday.com, ClickUp, and Microsoft Project informed the gap analysis.

**Current State**: 35 models, 45+ services, 150+ API endpoints, 34 frontend feature folders, 30 UI components. Core PM workflows exist but critical infrastructure gaps (auth, real-time, testing, CI/CD) block production readiness.

---

## Analysis Summary by Perspective

### 1. SOFTWARE ARCHITECT Assessment

**Strengths**: Clean 5-layer architecture (Model → Repo → Service → Schema → Endpoint), async throughout, cursor-based pagination, soft deletes, structured logging, RBAC with 3-level scoping.

**Critical Gaps**:
| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 1 | **No test coverage** - Only 2 test files for 150+ endpoints | High | High |
| 2 | **No real-time/WebSocket support** - Polling only, no live updates | High | Medium |
| 3 | **Auth is a stub** (X-User-ID header) - No JWT, no SSO, no session management | Critical | Medium |
| 4 | **No caching layer** - Redis configured but unused for query caching | Medium | Low |
| 5 | **No CI/CD pipeline** - No GitHub Actions, no automated testing | High | Medium |
| 6 | **No file storage backend** - Upload model exists, no S3/local storage | Medium | Medium |
| 7 | **Single monolithic migration** - 42KB migration, no incremental history | Low | Low |

### 2. SENIOR PROJECT MANAGER Assessment

**Strengths**: Comprehensive issue tracking, workflow engine, milestones, time tracking, RACI, stakeholder management, decision logging, budget tracking, approvals.

**Critical Gaps**:
| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 1 | **No burndown/velocity charts** - No sprint analytics or trend data | High | Medium |
| 2 | **Reports page is empty** - No report generation, export, or scheduling | High | High |
| 3 | **No sprint/iteration management** - Agile ceremonies not supported | High | Medium |
| 4 | **No resource allocation/capacity planning** - Can't see team workload across projects | High | High |
| 5 | **No email/Slack notifications** - Notifications only in-app, no external delivery | Medium | Medium |

### 3. PMO DIRECTOR Assessment

**Strengths**: Portfolio view with RAG status, cross-project dependencies, roadmap scenarios, baseline tracking, gate approvals.

**Critical Gaps**:
| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 1 | **No earned value management (EVM)** - No CPI/SPI tracking | High | Medium |
| 2 | **No executive dashboards** - Portfolio dashboard is basic, no KPI roll-ups | High | Medium |
| 3 | **No risk register** - No formal risk scoring, heat maps, or mitigation tracking | High | Medium |
| 4 | **No resource leveling** - Can't optimize resource allocation across portfolio | High | High |
| 5 | **No compliance/audit export** - Audit logs exist but can't be exported/reported | Medium | Low |

### 4. UX DESIGNER Assessment

**Strengths**: Dark mode, responsive sidebar, TipTap editor, DHTMLX Gantt, drag-drop Kanban, 30-component UI kit, command palette (Cmd+K).

**Critical Gaps**:
| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 1 | **No onboarding flow** - New users see empty state with no guidance | High | Medium |
| 2 | **Settings page is "Coming Soon"** - Users can't configure workspace/org | High | Medium |
| 3 | **No empty states with CTAs** - Empty pages show nothing, not helpful prompts | Medium | Low |
| 4 | **No keyboard shortcuts** (beyond Cmd+K) - Power users can't navigate efficiently | Medium | Medium |
| 5 | **No loading/error states** consistently - Some pages lack skeleton loaders | Low | Low |

### 5. PRODUCT MANAGER Assessment

**Strengths**: Feature breadth rivals Jira+Asana combined. Wiki, automations, intake forms, budget tracking, RACI - features most competitors charge extra for.

**Critical Gaps**:
| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 1 | **No AI copilot** - Industry is moving fast; competitors all have AI assistants | Critical | High |
| 2 | **No integrations** - No GitHub, Slack, Calendar, Jira sync, webhooks, or API keys | Critical | High |
| 3 | **No mobile experience** - Not responsive for mobile PM workflows | High | High |
| 4 | **No user onboarding/templates** - Project templates exist but no guided setup | Medium | Medium |
| 5 | **No public API documentation** - Can't build ecosystem without developer docs | Medium | Low |

### 6. SECURITY & DEVOPS Assessment

**Strengths**: Rate limiting, request ID tracing, structlog, Docker health checks, CORS configuration.

**Critical Gaps**:
| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 1 | **Auth stub is a security hole** - Any user can impersonate anyone | Critical | Medium |
| 2 | **No HTTPS/TLS** configuration - Dev-only HTTP setup | High | Low |
| 3 | **No CI/CD** - No automated testing, linting, building, or deployment | High | Medium |
| 4 | **No monitoring/observability** - No Sentry, Prometheus, health dashboards | High | Medium |
| 5 | **No input sanitization audit** - XSS/injection risk in rich text fields | High | Medium |
| 6 | **No secrets management** - .env files, no vault integration | Medium | Low |

---

## Prioritized Improvement Roadmap

### TIER 1: Foundation (Must-Do Before Any Beta/Demo)

These are **blockers** for any real usage:

| # | Improvement | Perspective | Impact | Effort | Files/Areas |
|---|------------|-------------|--------|--------|-------------|
| **1** | **Implement real authentication (JWT + Azure AD SSO)** | Security | Critical | Medium | `backend/app/core/deps.py`, `backend/app/core/auth.py` (new), `backend/app/api/v1/endpoints/auth.py` (new), `frontend/src/stores/authStore.ts`, `frontend/src/pages/LoginPage.tsx` (new) |
| **2** | **Build CI/CD pipeline (GitHub Actions)** | DevOps | High | Medium | `.github/workflows/ci.yml` (new), `.github/workflows/deploy.yml` (new) |
| **3** | **Write integration tests for critical paths** | Architect | High | High | `backend/tests/test_issues.py`, `backend/tests/test_workflows.py`, `backend/tests/test_projects.py`, `backend/tests/test_auth.py` (all new) |
| **4** | **Complete Settings page** | UX | High | Medium | `frontend/src/pages/SettingsPage.tsx`, `frontend/src/components/settings/` |
| **5** | **Implement WebSocket for real-time updates** | Architect | High | Medium | `backend/app/core/websocket.py` (new), `backend/app/services/event_bus.py` (new), `frontend/src/hooks/useWebSocket.ts` (new) |

### TIER 2: Core PM Features (Competitive Parity)

These bring Friday to feature parity with competitors:

| # | Improvement | Perspective | Impact | Effort | Files/Areas |
|---|------------|-------------|--------|--------|-------------|
| **6** | **Build Reports & Analytics engine** (burndown, velocity, custom reports) | PM | High | High | `backend/app/services/analytics.py` (new), `frontend/src/pages/project/ReportsPage.tsx`, `frontend/src/components/reports/` |
| **7** | **Add Sprint/Iteration management** | PM | High | Medium | `backend/app/models/sprint.py` (new), `backend/app/services/sprint.py` (new), `frontend/src/components/sprint/` (new) |
| **8** | **Build notification delivery** (email + in-app real-time) | PM | Medium | Medium | `backend/app/services/notification_delivery.py` (new), `backend/app/tasks/notifications.py` |
| **9** | **Implement file storage backend** (S3-compatible) | Architect | Medium | Medium | `backend/app/core/storage.py` (new), `backend/app/services/upload.py` (update) |
| **10** | **Add onboarding flow & empty states** | UX | High | Medium | `frontend/src/components/onboarding/` (new), update all list pages |

### TIER 3: Differentiation (Competitive Advantage)

These make Friday stand out:

| # | Improvement | Perspective | Impact | Effort | Files/Areas |
|---|------------|-------------|--------|--------|-------------|
| **11** | **AI Copilot for PM** (task generation, risk prediction, status summaries, natural language queries) | Product | Critical | High | `backend/app/services/ai.py` (enhance), `frontend/src/components/ai/` (new), `backend/app/api/v1/endpoints/ai.py` (enhance) |
| **12** | **Integrations framework** (webhooks, GitHub, Slack, Calendar) | Product | Critical | High | `backend/app/models/integration.py` (new), `backend/app/services/integrations/` (new), `backend/app/api/v1/endpoints/webhooks.py` (new) |
| **13** | **Risk register & heat maps** | PMO | High | Medium | `backend/app/models/risk.py` (new), `backend/app/services/risk.py` (new), `frontend/src/components/risk/` (new) |
| **14** | **Resource capacity planning & leveling** | PMO | High | High | `backend/app/services/resource_planning.py` (new), `frontend/src/components/resource/` (new) |
| **15** | **Executive/PMO dashboards** (portfolio KPIs, health scores, trend analysis) | PMO | High | Medium | `frontend/src/components/dashboard/ExecutiveDashboard.tsx` (new), `backend/app/services/portfolio.py` (enhance) |

### TIER 4: Polish & Scale (Production Hardening)

| # | Improvement | Perspective | Impact | Effort | Files/Areas |
|---|------------|-------------|--------|--------|-------------|
| **16** | **Monitoring & observability** (Sentry, Prometheus metrics, health dashboards) | DevOps | High | Medium | `backend/app/core/monitoring.py` (new), `docker-compose.yml` (add Prometheus/Grafana) |
| **17** | **Redis caching layer** for hot queries | Architect | Medium | Low | `backend/app/core/cache.py` (new), update services |
| **18** | **Keyboard shortcuts system** | UX | Medium | Medium | `frontend/src/hooks/useKeyboardShortcuts.ts` (new) |
| **19** | **Public API documentation & API keys** | Product | Medium | Medium | `backend/app/api/v1/endpoints/api_keys.py` (new), docs site |
| **20** | **Frontend test suite** (Vitest + Testing Library) | Architect | Medium | High | `frontend/src/**/*.test.tsx` (new) |

### TIER 5: Enterprise & Growth

| # | Improvement | Perspective | Impact | Effort | Files/Areas |
|---|------------|-------------|--------|--------|-------------|
| **21** | **Earned Value Management (EVM)** - CPI/SPI/EAC metrics | PMO | High | Medium | `backend/app/services/evm.py` (new) |
| **22** | **Mobile-responsive redesign** | Product | High | High | Frontend responsive audit across all pages |
| **23** | **Audit log export & compliance reports** | PMO | Medium | Low | `backend/app/api/v1/endpoints/audit.py` (enhance) |
| **24** | **Project template gallery** with guided setup | UX | Medium | Medium | `frontend/src/components/templates/` (new) |
| **25** | **Advanced search with filters, saved searches** | UX | Medium | Medium | `frontend/src/components/search/` (enhance) |

---

## Implementation Strategy

### Phase A: Foundation Sprint (Weeks 1-3)
- Items 1-5 (Auth, CI/CD, Tests, Settings, WebSocket)
- **Goal**: App is secure, testable, and real-time capable

### Phase B: PM Core Sprint (Weeks 4-6)
- Items 6-10 (Reports, Sprints, Notifications, File Storage, Onboarding)
- **Goal**: Feature parity with Linear/Asana for core workflows

### Phase C: Differentiation Sprint (Weeks 7-10)
- Items 11-15 (AI Copilot, Integrations, Risk, Resources, Executive Dashboards)
- **Goal**: Enterprise-grade features that differentiate from competitors

### Phase D: Hardening Sprint (Weeks 11-13)
- Items 16-20 (Monitoring, Caching, Shortcuts, API Docs, Frontend Tests)
- **Goal**: Production-ready, scalable, well-documented

### Phase E: Enterprise Sprint (Weeks 14-16)
- Items 21-25 (EVM, Mobile, Compliance, Templates, Search)
- **Goal**: Enterprise PMO capabilities

---

## Verification Plan

After implementation of each tier:

1. **Backend tests**: `make test-backend` - all endpoints have integration tests
2. **Frontend tests**: `make test-frontend` - critical flows covered
3. **Docker validation**: `make reset && make up` - full stack starts cleanly
4. **API generation**: `make generate-api` - Orval types match backend
5. **Manual E2E flow**: Create project → Create issues → Move through workflow → Generate reports
6. **Load testing**: Verify cursor pagination handles 10K+ issues
7. **Security scan**: Run OWASP ZAP against API endpoints

---

## Key Existing Code to Reuse

| What | Where | Reuse For |
|------|-------|-----------|
| `BaseRepository[T]` | `backend/app/repositories/base.py` | All new repositories |
| `BaseModel + mixins` | `backend/app/models/base.py` | All new models |
| `AppException` hierarchy | `backend/app/core/errors.py` | All new error handling |
| `require_permission()` | `backend/app/core/permissions.py` | All new endpoint auth |
| `useCursorList<T>()` | `frontend/src/api/hooks.ts` | All new list views |
| `ActivityService.log_activity()` | `backend/app/services/activity.py` | All new audit trails |
| ARQ task infrastructure | `backend/app/tasks/` | All new background jobs |
| TipTap editor components | `frontend/src/components/editor/` | Any new rich text needs |
| Dashboard widget system | `frontend/src/components/dashboard/` | New dashboard widgets |
| Recharts components | Used in budget/portfolio | New chart/report views |

---

## Competitive Positioning Summary

| Feature Area | Friday Today | Jira | Linear | Asana | Monday | Gap |
|-------------|-------------|------|--------|-------|--------|-----|
| Issue Tracking | Strong | Strong | Strong | Good | Good | Parity |
| Kanban Board | Strong | Strong | Strong | Strong | Strong | Parity |
| Gantt/Timeline | Strong | Good | Weak | Good | Good | Ahead |
| Wiki/Knowledge | Strong | Confluence | None | None | Docs | Ahead |
| Automations | Good | Strong | Good | Strong | Strong | Parity |
| Budget Tracking | Strong | None | None | None | Basic | Ahead |
| RACI/Stakeholders | Strong | None | None | None | None | Ahead |
| Intake Forms | Strong | JSM | None | Forms | Forms | Ahead |
| Portfolio/Roadmap | Good | JPP | Roadmaps | Good | Good | Parity |
| **Auth/SSO** | **Stub** | Strong | Strong | Strong | Strong | **Behind** |
| **Reporting** | **Empty** | Strong | Good | Strong | Strong | **Behind** |
| **Sprints** | **None** | Strong | Strong | None | None | **Behind** |
| **AI Features** | **Minimal** | Atlassian AI | AI Auto | Asana AI | AI | **Behind** |
| **Integrations** | **None** | 3000+ | GitHub | 200+ | 200+ | **Behind** |
| **Real-time** | **None** | Yes | Yes | Yes | Yes | **Behind** |
| **Mobile** | **None** | Yes | Yes | Yes | Yes | **Behind** |

**Friday's unique strength**: It combines PM governance features (RACI, stakeholders, decisions, gate approvals, budgets, intake) that competitors either lack or charge separately for. The path to differentiation is fixing the foundation gaps (auth, real-time, integrations) and then leaning into AI + enterprise PMO features.

---

## Code-Level Findings (from deep analysis)

These specific issues were identified through code-level inspection:

1. **`backend/app/core/deps.py:28`** - Returns `_DEV_USER_ID` (hardcoded UUID) for any unauthenticated request. This is the single insertion point for real auth.
2. **`backend/app/core/config.py:9`** - `SECRET_KEY` defaults to `"dev-secret-key"`. Critical vulnerability if deployed.
3. **`backend/app/core/permissions.py`** - `_check_scope_permission` executes 2-4 SQL queries per request with zero caching. Add Redis TTL cache.
4. **`backend/app/services/ai.py:44-55`** - Creates and destroys Redis connection pool per AI call. Should reuse the app-level pool.
5. **`frontend/src/hooks/useNotifications.ts:16`** - `refetchInterval: 30_000` (30s polling). Replace with SSE/WebSocket.
6. **`frontend/src/pages/SettingsPage.tsx`** - Renders only "Coming soon" text.
7. **`frontend/src/pages/project/ReportsPage.tsx`** - Empty file with just `</div>`.
8. **No XSS sanitization** - TipTap HTML stored and rendered as-is in issues, wiki, comments. Need `bleach` (backend) + `DOMPurify` (frontend).

## Strategic Recommendation

**Differentiation wedge: "AI-Native Enterprise PM"**

Rather than competing feature-for-feature with Jira (3000+ integrations) or Asana (AI teammates), Friday should lean into its unique strengths:
- Already has governance features (RACI, gates, decisions, budgets) that competitors lack
- Embed AI deeply into every workflow: auto-triage intake forms, auto-assign based on workload, predict milestone slippage, auto-generate status reports, summarize decision threads
- This is the one area where incumbents are weakest and differentiation is most achievable

**The mantra: "A mile wide, go deeper."** Prioritize depth on core workflows (issues, board, reports) over adding new feature areas.

---

## Sources

- [Asana PM Comparison 2026](https://asana.com/resources/best-project-management-software)
- [Smartsheet Enterprise PM](https://www.smartsheet.com/content/best-project-management-software)
- [PPM Tools 2026](https://thedigitalprojectmanager.com/tools/ppm-tools/)
- [AI PM Tools - ClickUp](https://clickup.com/blog/ai-project-management-tools/)
- [AI PM Tools - Epicflow](https://www.epicflow.com/blog/excellent-ai-project-management-software-tools-setting-new-standards/)
- [Microsoft Project AI Copilot](https://smartnetsoftware.com/blog/uncategorized/microsoft-project-ai-copilot-project-management/)
- [Enterprise PM Comparison - Zapier](https://zapier.com/blog/best-enterprise-project-management-software/)
- [PPM Software 2026 - Prism](https://prismppm.com/blog/project-portfolio-management/10-best-project-portfolio-management-ppm-software-for-2026/)
