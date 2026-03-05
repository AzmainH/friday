# Friday PM API Reference

Complete endpoint catalog for the Friday Project Management API. All routes are registered via `backend/app/api/v1/router.py`.

---

## API Conventions

**Base URL:** `/api/v1`

**Authentication:** Pass `X-User-ID` header with a valid UUID. This is a stub mechanism; the system is architected for Azure AD SSO replacement later.

**Content-Type:** `application/json` for all request/response bodies (except file uploads which use `multipart/form-data`).

**Cursor Pagination:** List endpoints use cursor-based pagination:

```
GET /api/v1/{resource}?cursor=<base64>&limit=50&include_count=true
```

Response shape:

```json
{
  "data": [...],
  "pagination": {
    "next_cursor": "abc123",
    "has_more": true,
    "total_count": 142
  }
}
```

- `limit` defaults to 50, max varies by endpoint (typically 100, issues allow up to 500).
- `include_count` defaults to `false`. Set `true` to get `total_count`.
- `next_cursor` is `null` when no more pages exist.

**Error Envelope:**

```json
{
  "code": "NOT_FOUND",
  "message": "Resource not found",
  "details": [{"field": "project_id", "message": "Invalid UUID"}],
  "request_id": "req-abc123"
}
```

**Rate Limits:**

| Category | Limit |
|----------|-------|
| General | 200/min |
| AI endpoints | 10/min |
| Bulk operations | 20/min |
| Intake (public) | 30/min |

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 422 | Request body or query params failed validation |
| `NOT_FOUND` | 404 | Resource does not exist or was soft-deleted |
| `PERMISSION_DENIED` | 403 | User lacks required permission |
| `CONFLICT` | 409 | Resource state conflict (e.g., duplicate name) |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Unhandled server error |
| `VERSION_CONFLICT` | 409 | Optimistic concurrency conflict -- resource modified by another request |

---

## Endpoint Catalog

### Core

#### Health

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/health` | Basic health check | -- |
| GET | `/health/db` | Database connectivity check | -- |
| GET | `/health/redis` | Redis connectivity check | -- |
| GET | `/health/detailed` | Full health: DB pool stats, Redis latency, uptime, worker queue depth | -- |

#### Users

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/users/me` | Get current authenticated user | -- |
| PUT | `/users/me/preferences` | Update current user's preferences | Body: `UserPreferencesUpdate` |
| GET | `/users` | List all users (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/users` | Create a new user | Body: `UserCreate` |
| GET | `/users/{user_id}` | Get user by ID | -- |
| PUT | `/users/{user_id}` | Update user | Body: `UserUpdate` |
| DELETE | `/users/{user_id}` | Soft-delete user | -- |

#### Organizations

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/organizations` | List organizations (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/organizations` | Create organization | Body: `OrgCreate` |
| GET | `/organizations/{org_id}` | Get organization | -- |
| PUT | `/organizations/{org_id}` | Update organization | Body: `OrgUpdate` |
| DELETE | `/organizations/{org_id}` | Delete organization | -- |
| GET | `/organizations/{org_id}/members` | List org members | -- |
| POST | `/organizations/{org_id}/members` | Add member to org | Body: `OrgMemberCreate` (user_id, role_id) |
| DELETE | `/organizations/{org_id}/members/{user_id}` | Remove member from org | -- |

#### Workspaces

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/organizations/{org_id}/workspaces` | List workspaces in org (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/organizations/{org_id}/workspaces` | Create workspace in org | Body: `WorkspaceCreate` |
| GET | `/workspaces/{workspace_id}` | Get workspace | -- |
| PUT | `/workspaces/{workspace_id}` | Update workspace | Body: `WorkspaceUpdate` |
| DELETE | `/workspaces/{workspace_id}` | Delete workspace | -- |
| GET | `/workspaces/{workspace_id}/members` | List workspace members | -- |
| POST | `/workspaces/{workspace_id}/members` | Add member to workspace | Body: `WorkspaceMemberCreate` (user_id, role_id) |
| DELETE | `/workspaces/{workspace_id}/members/{user_id}` | Remove member from workspace | -- |

#### Teams

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/workspaces/{workspace_id}/teams` | List teams in workspace (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/workspaces/{workspace_id}/teams` | Create team in workspace | Body: `TeamCreate` |
| GET | `/teams/{team_id}` | Get team | -- |
| PUT | `/teams/{team_id}` | Update team | Body: `TeamUpdate` |
| DELETE | `/teams/{team_id}` | Delete team | -- |
| POST | `/teams/{team_id}/members` | Add member to team | Body: `TeamMemberCreate` (user_id) |
| DELETE | `/teams/{team_id}/members/{user_id}` | Remove member from team | -- |

#### Projects

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/workspaces/{workspace_id}/projects` | List projects in workspace (paginated) | `include_archived`, `cursor`, `limit`, `include_count` |
| POST | `/workspaces/{workspace_id}/projects` | Create project in workspace | Body: `ProjectCreate` |
| GET | `/projects` | List projects (frontend alias) | `workspace_id` (default: "default"), `include_archived`, `include_count=true` |
| GET | `/projects/{project_id}` | Get project | -- |
| PUT | `/projects/{project_id}` | Update project | Body: `ProjectUpdate` |
| DELETE | `/projects/{project_id}` | Delete project | -- |
| PUT | `/projects/{project_id}/archive` | Archive project | -- |
| PUT | `/projects/{project_id}/unarchive` | Unarchive project | -- |
| GET | `/projects/{project_id}/members` | List project members | -- |
| POST | `/projects/{project_id}/members` | Add member to project | Body: `ProjectMemberCreate` (user_id, role_id, capacity_pct, hours_per_week) |
| PUT | `/projects/{project_id}/members/{user_id}` | Update project member | Body: `ProjectMemberUpdate` |
| DELETE | `/projects/{project_id}/members/{user_id}` | Remove member from project | -- |

#### Roles

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/roles` | List all system roles | -- |
| GET | `/roles/{role_id}` | Get role by ID | -- |

---

### Issues

#### Issues

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/projects/{project_id}/issues` | List issues (paginated, max 500) | `status_id`, `issue_type_id`, `assignee_id`, `priority`, `milestone_id`, `sort_by`, `sort_order`, `search` |
| POST | `/projects/{project_id}/issues` | Create issue | Body: `IssueCreate` |
| POST | `/projects/{project_id}/issues/bulk` | Bulk update issues | Body: `IssueBulkUpdateRequest` (issue_ids + update fields) |
| GET | `/projects/{project_id}/issues/search` | Full-text search issues | `q` (required) |
| GET | `/issues/{issue_id}` | Get issue by ID | -- |
| PUT | `/issues/{issue_id}` | Update issue | Body: `IssueUpdate` |
| DELETE | `/issues/{issue_id}` | Delete issue | -- |

#### Issue Types

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/projects/{project_id}/issue-types` | List issue types for project (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/projects/{project_id}/issue-types` | Create issue type | Body: `IssueTypeCreate` |
| GET | `/issue-types/{issue_type_id}` | Get issue type | -- |
| PUT | `/issue-types/{issue_type_id}` | Update issue type | Body: `IssueTypeUpdate` |
| DELETE | `/issue-types/{issue_type_id}` | Delete issue type | -- |

#### Workflows

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/projects/{project_id}/workflows` | List workflows for project (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/projects/{project_id}/workflows` | Create workflow | Body: `WorkflowCreate` |
| GET | `/workflows/{workflow_id}` | Get workflow detail (includes statuses/transitions) | -- |
| PUT | `/workflows/{workflow_id}` | Update workflow | Body: `WorkflowUpdate` |
| DELETE | `/workflows/{workflow_id}` | Delete workflow | -- |
| POST | `/workflows/{workflow_id}/statuses` | Add status to workflow | Body: `WorkflowStatusCreate` |
| POST | `/workflows/{workflow_id}/transitions` | Add transition to workflow | Body: `WorkflowTransitionCreate` |
| GET | `/workflows/{workflow_id}/transitions` | List valid transitions from a status | `from_status_id` (required) |

#### Comments

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/issues/{issue_id}/comments` | List comments on issue (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/issues/{issue_id}/comments` | Create comment on issue | Body: `IssueCommentCreate` |
| PUT | `/comments/{comment_id}` | Update comment | Body: `IssueCommentUpdate` |
| DELETE | `/comments/{comment_id}` | Delete comment (hard delete) | -- |

#### Issue Links

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/issues/{issue_id}/links` | List links for an issue | -- |
| POST | `/issues/{issue_id}/links` | Create link from issue | Body: `IssueLinkCreate` (target_issue_id, link_type) |
| DELETE | `/issue-links/{link_id}` | Delete issue link | -- |

#### Custom Fields

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/projects/{project_id}/custom-fields` | List custom field definitions (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/projects/{project_id}/custom-fields` | Create custom field definition | Body: `CustomFieldDefinitionCreate` |
| PUT | `/custom-fields/{field_id}` | Update custom field definition | Body: `CustomFieldDefinitionUpdate` |
| DELETE | `/custom-fields/{field_id}` | Delete custom field definition | -- |
| GET | `/issues/{issue_id}/custom-field-values` | List custom field values for issue | -- |
| PUT | `/issues/{issue_id}/custom-field-values` | Set custom field values for issue | Body: `list[CustomFieldValueCreate]` |

#### Labels

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/projects/{project_id}/labels` | List labels for project (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/projects/{project_id}/labels` | Create label | Body: `LabelCreate` |
| DELETE | `/labels/{label_id}` | Delete label | -- |

#### Components

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/projects/{project_id}/components` | List components for project (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/projects/{project_id}/components` | Create component | Body: `ComponentCreate` |
| GET | `/components/{component_id}` | Get component | -- |
| PUT | `/components/{component_id}` | Update component | Body: `ComponentUpdate` |
| DELETE | `/components/{component_id}` | Delete component | -- |

#### Versions

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/projects/{project_id}/versions` | List versions for project (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/projects/{project_id}/versions` | Create version | Body: `VersionCreate` |
| GET | `/versions/{version_id}` | Get version | -- |
| PUT | `/versions/{version_id}` | Update version | Body: `VersionUpdate` |
| DELETE | `/versions/{version_id}` | Delete version | -- |

---

### Planning

#### Milestones

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/projects/{project_id}/milestones` | List milestones (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/projects/{project_id}/milestones` | Create milestone | Body: `MilestoneCreate` |
| GET | `/milestones/{milestone_id}` | Get milestone | -- |
| PATCH | `/milestones/{milestone_id}` | Update milestone | Body: `MilestoneUpdate` |
| DELETE | `/milestones/{milestone_id}` | Delete milestone | -- |
| POST | `/milestones/{milestone_id}/gate-approvals` | Request gate approval | Body: `GateApprovalCreate` (notes) |
| PATCH | `/gate-approvals/{approval_id}` | Approve/reject gate | Body: `GateApprovalDecision` (status, notes) |

#### Baselines

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/projects/{project_id}/baselines` | List baselines (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/projects/{project_id}/baselines` | Snapshot current project state as baseline | Body: `BaselineCreate` |
| GET | `/baselines/{baseline_id}` | Get baseline detail | -- |
| GET | `/baselines/{baseline_id}/compare` | Compare baseline to current state | -- |
| DELETE | `/baselines/{baseline_id}` | Delete baseline | -- |

#### Roadmaps

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/workspaces/{workspace_id}/roadmaps` | List roadmap plans (paginated) | `cursor`, `limit`, `include_count` |
| GET | `/roadmaps` | List roadmap plans (frontend alias) | `workspace_id` (required) |
| POST | `/workspaces/{workspace_id}/roadmaps` | Create roadmap plan | Body: `RoadmapPlanCreate` |
| GET | `/roadmaps/{plan_id}` | Get roadmap plan | -- |
| PATCH | `/roadmaps/{plan_id}` | Update roadmap plan | Body: `RoadmapPlanUpdate` |
| DELETE | `/roadmaps/{plan_id}` | Delete roadmap plan | -- |
| POST | `/roadmaps/{plan_id}/projects` | Add project to roadmap | Body: `RoadmapPlanProjectCreate` |
| DELETE | `/roadmaps/{plan_id}/projects/{project_id}` | Remove project from roadmap | -- |
| GET | `/roadmaps/{plan_id}/timeline` | Get timeline view | -- |
| GET | `/roadmaps/{plan_id}/scenarios` | List scenarios (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/roadmaps/{plan_id}/scenarios` | Create scenario | Body: `RoadmapScenarioCreate` |

#### Scheduling

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| POST | `/projects/{project_id}/schedule` | Trigger auto-schedule run (async) | -- |
| GET | `/projects/{project_id}/schedule/runs` | List schedule runs for project | -- |
| GET | `/schedule/runs/{run_id}` | Get schedule run result | -- |

#### Sprints

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/projects/{project_id}/sprints` | List sprints (paginated) | `status`, `cursor`, `limit`, `include_count` |
| POST | `/projects/{project_id}/sprints` | Create sprint | Body: `SprintCreate` |
| GET | `/sprints/{sprint_id}` | Get sprint | -- |
| PATCH | `/sprints/{sprint_id}` | Update sprint | Body: `SprintUpdate` |
| DELETE | `/sprints/{sprint_id}` | Delete sprint | -- |
| POST | `/sprints/{sprint_id}/start` | Start sprint | -- |
| POST | `/sprints/{sprint_id}/complete` | Complete sprint | -- |
| GET | `/sprints/{sprint_id}/burndown` | Get burndown chart data | -- |
| POST | `/sprints/{sprint_id}/issues` | Add issues to sprint | Body: `SprintAddIssuesRequest` (issue_ids) |
| DELETE | `/sprints/{sprint_id}/issues/{issue_id}` | Remove issue from sprint | -- |

#### Risks

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/projects/{project_id}/risks` | List risks (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/projects/{project_id}/risks` | Create risk | Body: `RiskCreate` |
| GET | `/projects/{project_id}/risks/matrix` | Get risk probability/impact matrix | -- |
| GET | `/projects/{project_id}/risks/summary` | Get risk summary stats | -- |
| GET | `/risks/{risk_id}` | Get risk | -- |
| PATCH | `/risks/{risk_id}` | Update risk | Body: `RiskUpdate` |
| DELETE | `/risks/{risk_id}` | Delete risk | -- |
| GET | `/risks/{risk_id}/responses` | List risk responses (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/risks/{risk_id}/responses` | Create risk response action | Body: `RiskResponseCreate` |
| PATCH | `/risk-responses/{response_id}` | Update risk response | Body: `RiskResponseUpdate` |
| DELETE | `/risk-responses/{response_id}` | Delete risk response | -- |

---

### Tracking

#### Time Entries

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/issues/{issue_id}/time-entries` | List time entries for issue (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/issues/{issue_id}/time-entries` | Log time entry | Body: `TimeEntryCreate` |
| DELETE | `/time-entries/{entry_id}` | Delete time entry | -- |

#### Budgets

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/projects/{project_id}/budget` | Get project budget | -- |
| PUT | `/projects/{project_id}/budget` | Create or update project budget | Body: `ProjectBudgetCreate` |
| GET | `/projects/{project_id}/budget/summary` | Get budget summary (spent, remaining, burn rate) | -- |
| GET | `/projects/{project_id}/costs` | List cost entries (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/projects/{project_id}/costs` | Add cost entry | Body: `CostEntryCreate` |
| DELETE | `/costs/{cost_id}` | Delete cost entry | -- |

#### Resource Planning

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/workspaces/{workspace_id}/resource-planning/capacity` | Get team capacity | `weeks` (1-52, default 4) |
| GET | `/workspaces/{workspace_id}/resource-planning/allocation` | Get team allocation | `weeks` (1-52, default 4) |
| GET | `/workspaces/{workspace_id}/resource-planning/utilization` | Get utilization report | `weeks` (1-52, default 4) |

#### Earned Value Management (EVM)

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/projects/{project_id}/evm` | Calculate earned value metrics (CPI, SPI, EAC, etc.) | -- |

#### SLA

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/projects/{project_id}/sla-policies` | List SLA policies (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/projects/{project_id}/sla-policies` | Create SLA policy | Body: `SLAPolicyCreate` |
| PATCH | `/sla-policies/{policy_id}` | Update SLA policy | Body: `SLAPolicyUpdate` |
| DELETE | `/sla-policies/{policy_id}` | Delete SLA policy | -- |
| GET | `/issues/{issue_id}/sla` | Get SLA status for an issue | Returns `null` if no policy applies |

---

### Collaboration

#### Wiki

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/workspaces/{workspace_id}/wiki-spaces` | List wiki spaces (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/workspaces/{workspace_id}/wiki-spaces` | Create wiki space | Body: `WikiSpaceCreate` |
| GET | `/wiki-spaces/{space_id}` | Get wiki space | -- |
| PATCH | `/wiki-spaces/{space_id}` | Update wiki space | Body: `WikiSpaceUpdate` |
| DELETE | `/wiki-spaces/{space_id}` | Delete wiki space | -- |
| GET | `/wiki-spaces/{space_id}/tree` | Get page tree (hierarchical) | -- |
| GET | `/wiki-spaces/{space_id}/pages` | List pages in space (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/wiki-spaces/{space_id}/pages` | Create page | Body: `WikiPageCreate` |
| GET | `/wiki-pages/{page_id}` | Get page | -- |
| PATCH | `/wiki-pages/{page_id}` | Update page | Body: `WikiPageUpdate` |
| DELETE | `/wiki-pages/{page_id}` | Delete page | -- |
| GET | `/wiki-pages/{page_id}/versions` | List page version history (paginated) | `cursor`, `limit`, `include_count` |
| GET | `/wiki-pages/{page_id}/versions/{version_number}` | Get specific page version | -- |
| GET | `/wiki-pages/{page_id}/comments` | List page comments (threaded) | -- |
| POST | `/wiki-pages/{page_id}/comments` | Create page comment | Body: `WikiPageCommentCreate` |
| GET | `/wiki-spaces/{space_id}/search` | Search within wiki space | `q` (required, min 1 char) |

#### Decisions

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/projects/{project_id}/decisions` | List decisions (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/projects/{project_id}/decisions` | Create decision record | Body: `DecisionCreate` |
| GET | `/decisions/{decision_id}` | Get decision | -- |
| PATCH | `/decisions/{decision_id}` | Update decision | Body: `DecisionUpdate` |
| DELETE | `/decisions/{decision_id}` | Delete decision | -- |
| POST | `/decisions/{decision_id}/links` | Link decision to issue | Body: `DecisionIssueLinkCreate` (issue_id) |
| DELETE | `/decision-links/{link_id}` | Remove decision-issue link | -- |

#### Stakeholders

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/projects/{project_id}/stakeholders` | List stakeholders (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/projects/{project_id}/stakeholders` | Create stakeholder entry | Body: `StakeholderCreate` |
| GET | `/projects/{project_id}/stakeholders/matrix` | Get power/interest stakeholder matrix | -- |
| GET | `/stakeholders/{stakeholder_id}` | Get stakeholder | -- |
| PATCH | `/stakeholders/{stakeholder_id}` | Update stakeholder | Body: `StakeholderUpdate` |
| DELETE | `/stakeholders/{stakeholder_id}` | Delete stakeholder | -- |

#### RACI

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/projects/{project_id}/raci` | Get RACI matrix | -- |
| POST | `/projects/{project_id}/raci` | Create RACI assignment | Body: `RACIAssignmentCreate` |
| PUT | `/projects/{project_id}/raci/bulk` | Bulk update RACI assignments | Body: `RACIBulkUpdate` (assignments[]) |
| DELETE | `/raci/{assignment_id}` | Delete RACI assignment | -- |

#### Approvals

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/projects/{project_id}/approval-steps` | List approval steps (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/projects/{project_id}/approval-steps` | Create approval step | Body: `ApprovalStepCreate` |
| PATCH | `/approval-steps/{step_id}` | Update approval step | Body: `ApprovalStepUpdate` |
| DELETE | `/approval-steps/{step_id}` | Delete approval step | -- |
| POST | `/issues/{issue_id}/approvals/request` | Request approval for issue | `project_id` (query, required) |
| PATCH | `/issue-approvals/{approval_id}` | Approve or reject | Body: `IssueApprovalDecision` (status, notes) |
| GET | `/issues/{issue_id}/approvals` | List approvals for issue (paginated) | `cursor`, `limit`, `include_count` |

---

### Productivity

#### Search

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/search` | Global search across entities | `q` (required, min 2 chars), `types` (comma-separated: issues, projects, comments), `workspace_id`, `project_id`, `limit` (default 20), `offset` |

#### Notifications

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/me/notifications` | List notifications for current user (paginated) | `is_read`, `cursor`, `limit`, `include_count` |
| PUT | `/me/notifications/{notification_id}/read` | Mark notification as read | -- |
| PUT | `/me/notifications/read-all` | Mark all notifications as read | -- |

#### Favorites

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/me/favorites` | List user's favorites (paginated) | `cursor`, `limit`, `include_count` |
| GET | `/favorites` | Alias for list favorites | `cursor`, `limit`, `include_count` |
| POST | `/me/favorites` | Toggle favorite (add/remove) | Body: `FavoriteCreate` (entity_type, entity_id) |

#### Recent Items

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/me/recent` | Get recently viewed items | `limit` (default 20, max 100) |
| GET | `/recent-items` | Alias for recent items | `limit` |

#### Saved Views

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/projects/{project_id}/saved-views` | List saved views (paginated) | `shared` (bool), `cursor`, `limit`, `include_count` |
| POST | `/projects/{project_id}/saved-views` | Create saved view | Body: `SavedViewCreate` |
| GET | `/saved-views/{view_id}` | Get saved view | -- |
| PUT | `/saved-views/{view_id}` | Update saved view | Body: `SavedViewUpdate` |
| DELETE | `/saved-views/{view_id}` | Delete saved view | -- |

#### Recurring Rules

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/projects/{project_id}/recurring-rules` | List recurring rules (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/projects/{project_id}/recurring-rules` | Create recurring rule | Body: `RecurringRuleCreate` |
| GET | `/recurring-rules/{rule_id}` | Get recurring rule | -- |
| PATCH | `/recurring-rules/{rule_id}` | Update recurring rule | Body: `RecurringRuleUpdate` |
| DELETE | `/recurring-rules/{rule_id}` | Delete recurring rule | -- |
| POST | `/recurring-rules/{rule_id}/trigger` | Manually trigger rule | -- |

---

### Advanced

#### Automations

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/projects/{project_id}/automations` | List automation rules (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/projects/{project_id}/automations` | Create automation rule | Body: `AutomationRuleCreate` |
| GET | `/automations/{rule_id}` | Get automation rule | -- |
| PATCH | `/automations/{rule_id}` | Update automation rule | Body: `AutomationRuleUpdate` |
| DELETE | `/automations/{rule_id}` | Delete automation rule | -- |
| POST | `/automations/{rule_id}/test` | Dry-run automation against an issue | Body: `AutomationTestRequest` (issue_id) |
| GET | `/automations/{rule_id}/logs` | List execution logs (paginated) | `cursor`, `limit`, `include_count` |

#### Intake

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/projects/{project_id}/intake-forms` | List intake forms (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/projects/{project_id}/intake-forms` | Create intake form | Body: `IntakeFormCreate` |
| GET | `/intake-forms/{form_id}` | Get intake form | -- |
| PATCH | `/intake-forms/{form_id}` | Update intake form | Body: `IntakeFormUpdate` |
| DELETE | `/intake-forms/{form_id}` | Delete intake form | -- |
| POST | `/intake/{public_slug}/submit` | Public submission (no auth) | Body: `IntakeSubmissionCreate` |
| GET | `/intake-forms/{form_id}/submissions` | List submissions (paginated) | `cursor`, `limit`, `include_count` |
| PATCH | `/intake-submissions/{submission_id}/review` | Review submission | Body: `IntakeSubmissionReview` (status, notes) |

#### Integrations

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/projects/{project_id}/integrations` | List integrations (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/projects/{project_id}/integrations` | Create integration | Body: `IntegrationCreate` |
| GET | `/integrations/{integration_id}` | Get integration | -- |
| PATCH | `/integrations/{integration_id}` | Update integration | Body: `IntegrationUpdate` |
| DELETE | `/integrations/{integration_id}` | Delete integration | -- |
| GET | `/integrations/{integration_id}/logs` | List webhook delivery logs (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/integrations/{integration_id}/test` | Send test webhook | Body: `TestWebhookRequest` (event_type, payload) |

#### Webhooks (Inbound)

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| POST | `/webhooks/github` | Receive GitHub webhook events | `X-GitHub-Event` header |
| POST | `/webhooks/slack` | Receive Slack slash commands | Form data: command, text, channel_id, user_id |

#### AI

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| POST | `/projects/{project_id}/ai/chat` | Chat with AI copilot | Body: `AIChatRequest` (message) |
| POST | `/projects/{project_id}/ai/status-report` | Generate AI status report | -- |
| POST | `/issues/{issue_id}/ai/decompose` | AI-suggested sub-task decomposition | -- |
| POST | `/projects/{project_id}/ai/{task_type}` | Trigger AI background task (202) | `task_type`: smart_schedule, risk_prediction, summarize |
| GET | `/ai/tasks/{task_id}` | Poll AI task status | -- |

#### Dashboards

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/dashboards/personal` | Get personal dashboard | -- |
| GET | `/projects/{project_id}/dashboard` | Get project dashboard | -- |
| GET | `/workspaces/{workspace_id}/portfolio-dashboard` | Get portfolio dashboard | -- |
| GET | `/dashboards` | List custom dashboards (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/dashboards` | Create custom dashboard | Body: `CustomDashboardCreate` |
| GET | `/dashboards/{dashboard_id}` | Get custom dashboard | -- |
| PATCH | `/dashboards/{dashboard_id}` | Update custom dashboard | Body: `CustomDashboardUpdate` |
| DELETE | `/dashboards/{dashboard_id}` | Delete custom dashboard | -- |
| GET | `/reports` | List saved reports (paginated) | `cursor`, `limit`, `include_count` |
| POST | `/reports` | Create saved report | Body: `SavedReportCreate` |
| POST | `/reports/run` | Run ad-hoc report | Body: `RunReportRequest` (report_type, config) |
| GET | `/reports/{report_id}/run` | Run a saved report | -- |

#### Templates

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/templates` | List project templates (paginated) | `cursor`, `limit`, `include_count` |
| GET | `/templates/{template_id}` | Get template | -- |
| POST | `/templates` | Create project template | Body: `ProjectTemplateCreate` |
| POST | `/wizard/create-project` | Create project from wizard/template | Body: `ProjectWizardRequest` |

#### Import / Export

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| POST | `/projects/{project_id}/import/preview` | Upload CSV and preview columns | File upload (multipart) |
| POST | `/projects/{project_id}/import` | Start CSV import (202, async) | File upload + `ImportRequest` (column_mapping) |
| POST | `/projects/{project_id}/export` | Start CSV export (202, async) | Body: `ExportRequest` (format, filters) |
| GET | `/import-export/tasks/{task_id}` | Poll import/export task status | -- |
| GET | `/import-export/download/{task_id}` | Download completed export file | Returns CSV file |

#### Document Import

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| POST | `/document-import/analyze` | Upload .docx/.xlsx for AI analysis (202, async) | File upload (multiple files) |
| GET | `/document-import/analysis/{task_id}` | Get analysis result | -- |
| POST | `/document-import/create` | Create project from analysis (202, async) | Body: `DocumentProjectCreateRequest` |
| GET | `/document-import/tasks/{task_id}` | Poll document import task status | -- |

#### Portfolio

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/workspaces/{workspace_id}/portfolio` | Get portfolio overview | -- |
| GET | `/portfolio/overview` | Portfolio overview (frontend alias) | `workspace_id` (required) |
| GET | `/workspaces/{workspace_id}/releases` | List releases (paginated) | `cursor`, `limit`, `include_count` |
| GET | `/releases` | List releases (frontend alias) | `workspace_id` (required) |
| POST | `/workspaces/{workspace_id}/releases` | Create release | Body: `ReleaseCreate` |
| GET | `/releases/{release_id}` | Get release | -- |
| PATCH | `/releases/{release_id}` | Update release | Body: `ReleaseUpdate` |
| DELETE | `/releases/{release_id}` | Delete release | -- |
| POST | `/releases/{release_id}/projects` | Add project to release | Body: `ReleaseProjectCreate` (project_id) |
| DELETE | `/releases/{release_id}/projects` | Remove project from release | Body: `ReleaseProjectCreate` (project_id) |
| GET | `/workspaces/{workspace_id}/dependencies` | List cross-project dependencies (paginated) | `cursor`, `limit`, `include_count` |
| GET | `/portfolio/dependencies` | List dependencies (frontend alias) | `workspace_id` (required) |
| POST | `/workspaces/{workspace_id}/dependencies` | Create cross-project dependency | Body: `CrossProjectDependencyCreate` |
| DELETE | `/dependencies/{dep_id}` | Delete dependency | -- |
| GET | `/projects/{project_id}/impact` | Impact analysis for project | -- |

---

### System

#### Uploads

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| POST | `/uploads/images` | Upload image or document file | File upload (multipart). Images: 5MB max (png, jpeg, gif, webp). Documents: 25MB max (pdf, docx, xlsx, csv, txt, zip) |

#### Task Status

| Method | Path | Description | Notable Params |
|--------|------|-------------|----------------|
| GET | `/me/tasks` | List background tasks for current user (paginated) | `cursor`, `limit`, `include_count` |
| GET | `/tasks/{task_id}` | Get background task status | -- |
