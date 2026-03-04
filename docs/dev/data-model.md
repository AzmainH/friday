# Data Model Reference

Complete reference for all SQLAlchemy models in the Friday PM application. Source files are in `backend/app/models/`. Models are registered in `backend/app/models/__init__.py`.

---

## Table of Contents

1. [Base Classes and Mixins](#base-classes-and-mixins)
2. [Enum Types](#enum-types)
3. [Phase 1 -- Core Models](#phase-1----core-models)
4. [Phase 2 -- Issue Engine](#phase-2----issue-engine)
5. [Phase 3-10 -- PM, Roadmap, Wiki, Dashboard, Automation](#phase-3-10----pm-roadmap-wiki-dashboard-automation)
6. [Junction Tables](#junction-tables)
7. [Entity Relationship Groups](#entity-relationship-groups)
8. [Indexes Reference](#indexes-reference)
9. [Migration Strategy](#migration-strategy)

---

## Base Classes and Mixins

File: `backend/app/models/base.py`

All models inherit from `BaseModel` (which extends SQLAlchemy `Base`) and optionally mix in timestamp/audit/soft-delete behavior. See `docs/dev/architecture.md` for detailed design rationale.

| Class | Columns | Notes |
|-------|---------|-------|
| `BaseModel` | `id` (UUID PK, `gen_random_uuid()`) | Abstract base for all models |
| `TimestampMixin` | `created_at` (DateTime TZ, server default `now()`), `updated_at` (DateTime TZ, server default `now()`, onupdate `now()`) | Auto-managed timestamps |
| `AuditMixin` | Inherits `TimestampMixin` + `created_by` (UUID, nullable), `updated_by` (UUID, nullable) | Tracks which user made changes |
| `SoftDeleteMixin` | `is_deleted` (Boolean, default false, indexed), `deleted_at` (DateTime TZ, nullable), `deleted_by` (UUID, nullable) | Logical deletion support |

Common inheritance patterns used across models:
- `BaseModel, AuditMixin, SoftDeleteMixin` -- most entity models
- `BaseModel, AuditMixin` -- entities without soft delete
- `BaseModel, TimestampMixin` -- junction/value models
- `BaseModel` alone -- log/immutable models

---

## Enum Types

All enums are stored as `native_enum=False` (stored as varchar, not Postgres enum type) unless noted otherwise.

### Workflow & Status

| Enum | File | Values |
|------|------|--------|
| `StatusCategory` | `workflow.py` | `to_do`, `in_progress`, `in_review`, `done`, `blocked` |
| `SprintStatus` | `sprint.py` | `planning`, `active`, `completed`, `cancelled` |
| `ProjectStatus` | `project.py` | `planning`, `active`, `on_hold`, `completed`, `cancelled` |
| `RAGStatus` | `project.py` | `green`, `amber`, `red`, `none` |

### Issue Relations

| Enum | File | Values |
|------|------|--------|
| `IssueLinkType` | `issue_relation.py` | `blocks`, `is_blocked_by`, `relates_to`, `duplicates`, `is_duplicated_by`, `depends_on`, `is_dependency_of` |
| `CustomFieldType` | `custom_field.py` | `text`, `number`, `date`, `datetime`, `single_select`, `multi_select`, `user`, `url`, `checkbox`, `paragraph`, `currency` |

### Milestone & Approval

| Enum | File | Values |
|------|------|--------|
| `MilestoneStatus` | `milestone.py` | `not_started`, `in_progress`, `completed`, `blocked` |
| `MilestoneType` | `milestone.py` | `phase_gate`, `deliverable`, `payment`, `review`, `custom` |
| `GateApprovalStatus` | `milestone.py` | `pending`, `approved`, `rejected` |
| `ApprovalStatus` | `approval.py` | `pending`, `approved`, `rejected` |

### Risk

| Enum | File | Values |
|------|------|--------|
| `RiskCategory` | `risk.py` | `technical`, `schedule`, `resource`, `budget`, `scope`, `external`, `quality` |
| `RiskProbability` | `risk.py` | `very_low`, `low`, `medium`, `high`, `very_high` |
| `RiskImpact` | `risk.py` | `very_low`, `low`, `medium`, `high`, `very_high` |
| `RiskStatus` | `risk.py` | `identified`, `analyzing`, `mitigating`, `resolved`, `accepted`, `closed` |
| `RiskResponseType` | `risk.py` | `avoid`, `mitigate`, `transfer`, `accept` |
| `RiskResponseStatus` | `risk.py` | `planned`, `in_progress`, `completed` |

### Decision & Portfolio

| Enum | File | Values |
|------|------|--------|
| `DecisionStatus` | `decision.py` | `proposed`, `under_review`, `decided`, `deferred`, `superseded` |
| `ReleaseStatus` | `portfolio.py` | `planning`, `in_progress`, `released`, `archived` |

### Automation

| Enum | File | Values |
|------|------|--------|
| `TriggerType` | `automation.py` | `issue_created`, `issue_updated`, `status_changed`, `assignee_changed`, `priority_changed`, `comment_added`, `due_date_approaching`, `scheduled` |
| `ActionType` | `automation.py` | `change_status`, `change_assignee`, `change_priority`, `add_label`, `remove_label`, `add_comment`, `send_notification`, `move_to_project` |

### Budget & Schedule

| Enum | File | Values |
|------|------|--------|
| `CostCategory` | `budget.py` | `labor`, `software`, `hardware`, `travel`, `consulting`, `other` |
| `ScheduleRunStatus` | `schedule.py` | `pending`, `running`, `completed`, `failed` |
| `RecurrenceFrequency` | `recurring.py` | `daily`, `weekly`, `biweekly`, `monthly`, `quarterly` |
| `RACIRoleType` | `raci.py` | `responsible`, `accountable`, `consulted`, `informed` |

### Dashboard & Integration

| Enum | File | Values |
|------|------|--------|
| `DashboardScope` | `dashboard.py` | `personal`, `project`, `team`, `portfolio`, `custom` |
| `IntegrationType` | `integration.py` | `webhook`, `github`, `slack` |

---

## Phase 1 -- Core Models

### User

File: `backend/app/models/user.py` | Table: `users` | Inherits: `BaseModel, AuditMixin, SoftDeleteMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `email` | String(255) | unique, not null, indexed |
| `display_name` | String(255) | not null |
| `avatar_url` | String(500) | nullable |
| `timezone` | String(100) | default `"UTC"` |
| `is_active` | Boolean | default true, not null |

Relationships: `preferences` (one-to-one UserPreferences)

### UserPreferences

File: `backend/app/models/user_preferences.py` | Table: `user_preferences` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK `users.id`, unique, not null, indexed |
| `default_view` | String(50) | default `"board"` |
| `sidebar_state` | JSONB | nullable |
| `column_layouts` | JSONB | nullable |
| `notification_settings` | JSONB | nullable |
| `date_format` | String(50) | default `"MMM d, yyyy"` |
| `timezone` | String(100) | default `"UTC"` |

Relationships: `user` (back to User)

### Organization

File: `backend/app/models/organization.py` | Table: `organizations` | Inherits: `BaseModel, AuditMixin, SoftDeleteMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `name` | String(255) | not null |
| `slug` | String(255) | unique, not null, indexed |
| `logo_url` | String(500) | nullable |
| `settings` | JSONB | nullable |

Relationships: `workspaces`, `members`

### Workspace

File: `backend/app/models/workspace.py` | Table: `workspaces` | Inherits: `BaseModel, AuditMixin, SoftDeleteMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `org_id` | UUID | FK `organizations.id`, not null, indexed |
| `name` | String(255) | not null |
| `slug` | String(255) | not null |
| `description` | Text | nullable |

Unique constraint: `uq_workspaces_org_slug` on (`org_id`, `slug`)

Relationships: `organization`, `members`, `teams`, `projects`

### Project

File: `backend/app/models/project.py` | Table: `projects` | Inherits: `BaseModel, AuditMixin, SoftDeleteMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `workspace_id` | UUID | FK `workspaces.id`, not null, indexed |
| `name` | String(255) | not null |
| `key_prefix` | String(10) | unique, not null |
| `description` | Text | nullable |
| `status` | ProjectStatus enum | default `planning`, not null |
| `lead_id` | UUID | FK `users.id`, nullable, indexed |
| `start_date` | Date | nullable |
| `target_end_date` | Date | nullable |
| `rag_status` | RAGStatus enum | default `none`, not null |
| `archived_at` | DateTime TZ | nullable |
| `archived_by` | UUID | nullable |

Relationships: `workspace`, `lead`, `members`

### Role

File: `backend/app/models/role.py` | Table: `roles` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `name` | String(100) | not null |
| `scope_type` | String(50) | not null |
| `is_system` | Boolean | default true, not null |
| `description` | Text | nullable |

Unique constraint: `uq_roles_name_scope` on (`name`, `scope_type`)

Relationships: `permissions` (cascade all, delete-orphan)

### RolePermission

File: `backend/app/models/role.py` | Table: `role_permissions` | Inherits: `BaseModel`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `role_id` | UUID | FK `roles.id`, not null, indexed |
| `permission` | String(100) | not null |

Unique constraint: `uq_role_permissions_role_perm` on (`role_id`, `permission`)

### OrgMember

File: `backend/app/models/members.py` | Table: `org_members` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `org_id` | UUID | FK `organizations.id`, not null, indexed |
| `user_id` | UUID | FK `users.id`, not null, indexed |
| `role_id` | UUID | FK `roles.id`, not null, indexed |

Unique constraint: `uq_org_members_org_user` on (`org_id`, `user_id`)

### WorkspaceMember

File: `backend/app/models/members.py` | Table: `workspace_members` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `workspace_id` | UUID | FK `workspaces.id`, not null, indexed |
| `user_id` | UUID | FK `users.id`, not null, indexed |
| `role_id` | UUID | FK `roles.id`, not null, indexed |

Unique constraint: `uq_workspace_members_ws_user` on (`workspace_id`, `user_id`)

### ProjectMember

File: `backend/app/models/members.py` | Table: `project_members` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK `projects.id`, not null, indexed |
| `user_id` | UUID | FK `users.id`, not null, indexed |
| `role_id` | UUID | FK `roles.id`, not null, indexed |
| `capacity_pct` | Float | nullable |
| `hours_per_week` | Float | nullable |

Unique constraint: `uq_project_members_proj_user` on (`project_id`, `user_id`)

### Team

File: `backend/app/models/team.py` | Table: `teams` | Inherits: `BaseModel, AuditMixin, SoftDeleteMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `workspace_id` | UUID | FK `workspaces.id`, not null, indexed |
| `name` | String(255) | not null |
| `description` | Text | nullable |

Relationships: `workspace`, `members`

### TeamMember

File: `backend/app/models/team.py` | Table: `team_members` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `team_id` | UUID | FK `teams.id`, not null, indexed |
| `user_id` | UUID | FK `users.id`, not null, indexed |

Unique constraint: `uq_team_members_team_user` on (`team_id`, `user_id`)

---

## Phase 2 -- Issue Engine

### IssueType

File: `backend/app/models/issue_type.py` | Table: `issue_types` | Inherits: `BaseModel, AuditMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK `projects.id`, not null, indexed |
| `name` | String(100) | not null |
| `description` | Text | nullable |
| `icon` | String(50) | default `"task"`, not null |
| `color` | String(7) | default `"#1976d2"`, not null |
| `hierarchy_level` | Integer | default 0, not null |
| `is_subtask` | Boolean | default false, not null |
| `sort_order` | Integer | default 0, not null |

Unique constraint: `uq_issue_types_project_name` on (`project_id`, `name`)

### Workflow

File: `backend/app/models/workflow.py` | Table: `workflows` | Inherits: `BaseModel, AuditMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK `projects.id`, not null, indexed |
| `name` | String(100) | not null |
| `description` | Text | nullable |
| `is_default` | Boolean | default false, not null |

Relationships: `statuses`, `transitions`

### WorkflowStatus

File: `backend/app/models/workflow.py` | Table: `workflow_statuses` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `workflow_id` | UUID | FK `workflows.id`, not null, indexed |
| `name` | String(100) | not null |
| `category` | StatusCategory enum | not null |
| `color` | String(7) | default `"#9e9e9e"`, not null |
| `sort_order` | Integer | default 0, not null |

Unique constraint: `uq_workflow_statuses_workflow_name` on (`workflow_id`, `name`)

### WorkflowTransition

File: `backend/app/models/workflow.py` | Table: `workflow_transitions` | Inherits: `BaseModel`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `workflow_id` | UUID | FK `workflows.id`, not null, indexed |
| `from_status_id` | UUID | FK `workflow_statuses.id`, not null |
| `to_status_id` | UUID | FK `workflow_statuses.id`, not null |
| `name` | String(100) | nullable |

Relationships: `workflow`, `from_status`, `to_status`

### Issue

File: `backend/app/models/issue.py` | Table: `issues` | Inherits: `BaseModel, AuditMixin, SoftDeleteMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK `projects.id`, not null |
| `issue_type_id` | UUID | FK `issue_types.id`, not null, indexed |
| `status_id` | UUID | FK `workflow_statuses.id`, not null |
| `issue_key` | String(20) | unique, not null |
| `summary` | String(500) | not null |
| `description` | Text | nullable |
| `description_text` | Text | nullable (plaintext version) |
| `priority` | String(20) | default `"medium"`, not null |
| `assignee_id` | UUID | FK `users.id`, nullable |
| `reporter_id` | UUID | FK `users.id`, nullable, indexed |
| `parent_issue_id` | UUID | FK `issues.id`, nullable (self-referential) |
| `milestone_id` | UUID | nullable |
| `estimated_hours` | Float | nullable |
| `actual_hours` | Float | nullable |
| `story_points` | Integer | nullable |
| `percent_complete` | Integer | default 0, not null |
| `rag_status` | String(10) | default `"none"`, not null |
| `planned_start` | Date | nullable |
| `planned_end` | Date | nullable |
| `actual_start` | Date | nullable |
| `actual_end` | Date | nullable |
| `sprint_id` | UUID | FK `sprints.id`, nullable, indexed |
| `sort_order` | Float | default 0.0, not null |
| `search_vector` | TSVECTOR | full-text search column |

Check constraint: `ck_issues_percent_complete_range` -- `percent_complete >= 0 AND percent_complete <= 100`

Relationships: `project`, `issue_type`, `status`, `assignee`, `reporter`, `parent`, `children`, `sprint`, `comments`, `labels` (via junction), `watchers` (via junction)

### IssueLink

File: `backend/app/models/issue_relation.py` | Table: `issue_links` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `source_issue_id` | UUID | FK `issues.id`, not null |
| `target_issue_id` | UUID | FK `issues.id`, not null |
| `link_type` | IssueLinkType enum | not null |
| `created_by` | UUID | FK `users.id`, nullable |

Relationships: `source_issue`, `target_issue`

### IssueComment

File: `backend/app/models/issue_relation.py` | Table: `issue_comments` | Inherits: `BaseModel, AuditMixin, SoftDeleteMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `issue_id` | UUID | FK `issues.id`, not null, indexed |
| `author_id` | UUID | FK `users.id`, not null, indexed |
| `content` | Text | not null |
| `content_text` | Text | nullable (plaintext version) |

Relationships: `issue`, `author`

### IssueActivityLog

File: `backend/app/models/issue_relation.py` | Table: `issue_activity_log` | Inherits: `BaseModel`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `issue_id` | UUID | FK `issues.id`, not null, indexed |
| `user_id` | UUID | FK `users.id`, not null, indexed |
| `action` | String(50) | not null |
| `field_name` | String(100) | nullable |
| `old_value` | Text | nullable |
| `new_value` | Text | nullable |
| `created_at` | DateTime TZ | server default `now()`, not null |

### Label

File: `backend/app/models/issue_extras.py` | Table: `labels` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK `projects.id`, not null, indexed |
| `name` | String(100) | not null |
| `color` | String(7) | default `"#1976d2"`, not null |

Unique constraint: `uq_labels_project_name` on (`project_id`, `name`)

### Component

File: `backend/app/models/issue_extras.py` | Table: `components` | Inherits: `BaseModel, AuditMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK `projects.id`, not null, indexed |
| `name` | String(100) | not null |
| `description` | Text | nullable |
| `lead_id` | UUID | FK `users.id`, nullable, indexed |

Unique constraint: `uq_components_project_name` on (`project_id`, `name`)

### Version

File: `backend/app/models/issue_extras.py` | Table: `versions` | Inherits: `BaseModel, AuditMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK `projects.id`, not null, indexed |
| `name` | String(100) | not null |
| `description` | Text | nullable |
| `start_date` | Date | nullable |
| `release_date` | Date | nullable |
| `status` | String(20) | default `"unreleased"`, not null |

Unique constraint: `uq_versions_project_name` on (`project_id`, `name`)

### TimeEntry

File: `backend/app/models/issue_extras.py` | Table: `time_entries` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `issue_id` | UUID | FK `issues.id`, not null |
| `user_id` | UUID | FK `users.id`, not null |
| `hours` | Float | not null |
| `date` | Date | not null |
| `description` | Text | nullable |

### ProjectIssueCounter

File: `backend/app/models/issue_extras.py` | Table: `project_issue_counters` | Inherits: `Base` (raw, no BaseModel)

| Column | Type | Constraints |
|--------|------|-------------|
| `project_id` | UUID | FK `projects.id`, PK |
| `prefix` | String(10) | not null |
| `next_number` | Integer | default 1, not null |

Used for atomic issue key generation (e.g., `PROJ-42`). Single row per project.

### CustomFieldDefinition

File: `backend/app/models/custom_field.py` | Table: `custom_field_definitions` | Inherits: `BaseModel, AuditMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK `projects.id`, not null, indexed |
| `name` | String(100) | not null |
| `field_type` | CustomFieldType enum | not null |
| `description` | Text | nullable |
| `options_json` | JSONB | nullable |
| `validation_json` | JSONB | nullable |
| `default_value` | String(500) | nullable |
| `sort_order` | Integer | default 0, not null |
| `is_required` | Boolean | default false, not null |

Unique constraint: `uq_custom_field_defs_project_name` on (`project_id`, `name`)

### CustomFieldValue

File: `backend/app/models/custom_field.py` | Table: `custom_field_values` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `issue_id` | UUID | FK `issues.id`, not null, indexed |
| `field_definition_id` | UUID | FK `custom_field_definitions.id`, not null, indexed |
| `value_text` | Text | nullable |
| `value_number` | Float | nullable |
| `value_date` | Date | nullable |
| `value_json` | JSONB | nullable |

Unique constraint: `uq_custom_field_values_issue_field` on (`issue_id`, `field_definition_id`)

Values are stored in the column matching `CustomFieldType`. Multi-select and complex types use `value_json`.

### Notification, AuditLog, SavedView, Favorite, RecentItem, TaskStatus, Upload

File: `backend/app/models/notification.py`

#### AuditLog

Table: `audit_log` | Inherits: `BaseModel`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `entity_type` | String(50) | not null |
| `entity_id` | UUID | not null |
| `user_id` | UUID | FK `users.id`, nullable, indexed |
| `action` | String(50) | not null |
| `changes_json` | JSONB | nullable |
| `ip_address` | String(50) | nullable |
| `request_id` | String(100) | nullable |
| `created_at` | DateTime TZ | server default `now()`, not null |

#### Notification

Table: `notifications` | Inherits: `BaseModel`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK `users.id`, not null |
| `type` | String(50) | not null |
| `title` | String(255) | not null |
| `body` | Text | nullable |
| `entity_type` | String(50) | nullable |
| `entity_id` | UUID | nullable |
| `project_id` | UUID | FK `projects.id`, nullable, indexed |
| `is_read` | Boolean | default false, not null |
| `created_at` | DateTime TZ | server default `now()`, not null |

#### SavedView

Table: `saved_views` | Inherits: `BaseModel, AuditMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK `projects.id`, not null, indexed |
| `user_id` | UUID | FK `users.id`, not null, indexed |
| `name` | String(100) | not null |
| `is_shared` | Boolean | default false, not null |
| `view_type` | String(20) | not null |
| `filters_json` | JSONB | nullable |
| `columns_json` | JSONB | nullable |
| `sort_json` | JSONB | nullable |
| `grouping_json` | JSONB | nullable |
| `is_default` | Boolean | default false, not null |

#### Favorite

Table: `favorites` | Inherits: `BaseModel`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK `users.id`, not null |
| `entity_type` | String(50) | not null |
| `entity_id` | UUID | not null |
| `created_at` | DateTime TZ | server default `now()`, not null |

#### RecentItem

Table: `recent_items` | Inherits: `BaseModel`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK `users.id`, not null |
| `entity_type` | String(50) | not null |
| `entity_id` | UUID | not null |
| `viewed_at` | DateTime TZ | server default `now()`, not null |

#### TaskStatus

Table: `task_status` | Inherits: `BaseModel`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `task_type` | String(50) | not null |
| `entity_id` | UUID | nullable |
| `user_id` | UUID | FK `users.id`, not null, indexed |
| `status` | String(20) | default `"pending"`, not null |
| `progress_pct` | Integer | default 0, not null |
| `result_summary_json` | JSONB | nullable |
| `error_message` | Text | nullable |
| `created_at` | DateTime TZ | server default `now()`, not null |
| `started_at` | DateTime TZ | nullable |
| `completed_at` | DateTime TZ | nullable |

#### Upload

Table: `uploads` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `entity_type` | String(50) | not null |
| `entity_id` | UUID | nullable |
| `file_name` | String(255) | not null |
| `file_path` | String(500) | not null |
| `file_size_bytes` | Integer | not null |
| `mime_type` | String(100) | not null |
| `uploaded_by` | UUID | FK `users.id`, not null, indexed |
| `is_deleted` | Boolean | default false, not null |

---

## Phase 3-10 -- PM, Roadmap, Wiki, Dashboard, Automation

### Sprint

File: `backend/app/models/sprint.py` | Table: `sprints` | Inherits: `BaseModel, AuditMixin, SoftDeleteMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK `projects.id`, not null, indexed |
| `name` | String(200) | not null |
| `goal` | Text | nullable |
| `start_date` | Date | not null |
| `end_date` | Date | not null |
| `status` | SprintStatus enum | default `planning`, not null |
| `velocity` | Integer | nullable |

Relationships: `project`, `issues` (back_populates from Issue.sprint)

### Milestone

File: `backend/app/models/milestone.py` | Table: `milestones` | Inherits: `BaseModel, AuditMixin, SoftDeleteMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK `projects.id`, not null, indexed |
| `name` | String(200) | not null |
| `description` | Text | nullable |
| `milestone_type` | MilestoneType enum | not null |
| `status` | MilestoneStatus enum | default `not_started`, not null |
| `start_date` | Date | nullable |
| `due_date` | Date | nullable |
| `completed_date` | Date | nullable |
| `progress_pct` | Integer | default 0, not null |
| `sort_order` | Integer | default 0, not null |

Relationships: `project`, `gate_approvals` (cascade all, delete-orphan)

### GateApproval

File: `backend/app/models/milestone.py` | Table: `gate_approvals` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `milestone_id` | UUID | FK `milestones.id`, not null, indexed |
| `approver_id` | UUID | FK `users.id`, not null |
| `status` | GateApprovalStatus enum | default `pending`, not null |
| `notes` | Text | nullable |
| `decided_at` | DateTime TZ | nullable |

### Baseline

File: `backend/app/models/baseline.py` | Table: `baselines` | Inherits: `BaseModel, AuditMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK `projects.id`, not null, indexed |
| `name` | String(200) | not null |
| `description` | Text | nullable |
| `snapshot_date` | DateTime TZ | server default `now()`, not null |

Relationships: `project`, `snapshots` (cascade all, delete-orphan)

### BaselineSnapshot

File: `backend/app/models/baseline.py` | Table: `baseline_snapshots` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `baseline_id` | UUID | FK `baselines.id`, not null, indexed |
| `issue_id` | UUID | FK `issues.id`, not null, indexed |
| `planned_start` | Date | nullable |
| `planned_end` | Date | nullable |
| `estimated_hours` | Float | nullable |
| `story_points` | Integer | nullable |
| `status_id` | UUID | nullable |

Unique constraint: `uq_baseline_snapshots_baseline_issue` on (`baseline_id`, `issue_id`)

### RoadmapPlan

File: `backend/app/models/roadmap.py` | Table: `roadmap_plans` | Inherits: `BaseModel, AuditMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `workspace_id` | UUID | FK `workspaces.id`, not null, indexed |
| `name` | String(200) | not null |
| `description` | Text | nullable |
| `start_date` | Date | nullable |
| `end_date` | Date | nullable |
| `is_active` | Boolean | default true, not null |

Relationships: `workspace`, `plan_projects` (cascade), `scenarios` (cascade)

### RoadmapPlanProject

File: `backend/app/models/roadmap.py` | Table: `roadmap_plan_projects` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `plan_id` | UUID | FK `roadmap_plans.id`, not null, indexed |
| `project_id` | UUID | FK `projects.id`, not null, indexed |
| `color` | String(7) | default `"#1976d2"`, not null |
| `sort_order` | Integer | default 0, not null |

Unique constraint: `uq_roadmap_plan_project` on (`plan_id`, `project_id`)

### RoadmapScenario

File: `backend/app/models/roadmap.py` | Table: `roadmap_scenarios` | Inherits: `BaseModel, AuditMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `plan_id` | UUID | FK `roadmap_plans.id`, not null, indexed |
| `name` | String(200) | not null |
| `description` | Text | nullable |
| `is_baseline` | Boolean | default false, not null |

Relationships: `plan`, `overrides` (cascade all, delete-orphan)

### RoadmapScenarioOverride

File: `backend/app/models/roadmap.py` | Table: `roadmap_scenario_overrides` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `scenario_id` | UUID | FK `roadmap_scenarios.id`, not null, indexed |
| `issue_id` | UUID | FK `issues.id`, not null |
| `override_start` | Date | nullable |
| `override_end` | Date | nullable |
| `override_assignee_id` | UUID | FK `users.id`, nullable |

Unique constraint: `uq_roadmap_scenario_override` on (`scenario_id`, `issue_id`)

### WikiSpace

File: `backend/app/models/wiki.py` | Table: `wiki_spaces` | Inherits: `BaseModel, AuditMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `workspace_id` | UUID | FK `workspaces.id`, not null, indexed |
| `name` | String(200) | not null |
| `slug` | String(100) | not null |
| `description` | Text | nullable |
| `is_active` | Boolean | default true, not null |

Unique constraint: `uq_wiki_spaces_workspace_slug` on (`workspace_id`, `slug`)

Relationships: `workspace`, `pages` (cascade all, delete-orphan)

### WikiPage

File: `backend/app/models/wiki.py` | Table: `wiki_pages` | Inherits: `BaseModel, AuditMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `space_id` | UUID | FK `wiki_spaces.id`, not null, indexed |
| `parent_id` | UUID | FK `wiki_pages.id`, nullable, indexed (self-referential) |
| `title` | String(300) | not null |
| `slug` | String(200) | not null |
| `content` | Text | nullable |
| `version` | Integer | default 1, not null |
| `sort_order` | Integer | default 0, not null |
| `search_vector` | TSVECTOR | full-text search column |

Unique constraint: `uq_wiki_pages_space_slug` on (`space_id`, `slug`)

GIN index: `ix_wiki_pages_search_vector` on `search_vector`

Relationships: `space`, `parent`, `children` (cascade all, delete-orphan), `versions` (cascade all, delete-orphan)

### WikiPageVersion

File: `backend/app/models/wiki.py` | Table: `wiki_page_versions` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `page_id` | UUID | FK `wiki_pages.id`, not null, indexed |
| `version_number` | Integer | not null |
| `title` | String(300) | not null |
| `content` | Text | nullable |
| `edited_by` | UUID | FK `users.id`, nullable |
| `change_summary` | String(500) | nullable |

Unique constraint: `uq_wiki_page_versions_page_version` on (`page_id`, `version_number`)

### WikiPageComment

File: `backend/app/models/wiki.py` | Table: `wiki_page_comments` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `page_id` | UUID | FK `wiki_pages.id`, not null, indexed |
| `author_id` | UUID | FK `users.id`, not null |
| `parent_comment_id` | UUID | FK `wiki_page_comments.id`, nullable (self-referential) |
| `content` | Text | not null |

Relationships: `page`, `author`, `parent_comment`, `replies`

### ApprovalStep

File: `backend/app/models/approval.py` | Table: `approval_steps` | Inherits: `BaseModel, AuditMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK `projects.id`, not null, indexed |
| `name` | String(200) | not null |
| `step_order` | Integer | not null |
| `approver_id` | UUID | FK `users.id`, not null |
| `is_active` | Boolean | default true, not null |

### IssueApproval

File: `backend/app/models/approval.py` | Table: `issue_approvals` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `issue_id` | UUID | FK `issues.id`, not null, indexed |
| `step_id` | UUID | FK `approval_steps.id`, not null |
| `approver_id` | UUID | FK `users.id`, not null |
| `status` | ApprovalStatus enum | default `pending`, not null |
| `notes` | Text | nullable |
| `decided_at` | DateTime TZ | nullable |

Unique constraint: `uq_issue_approval_step` on (`issue_id`, `step_id`)

### AutomationRule

File: `backend/app/models/automation.py` | Table: `automation_rules` | Inherits: `BaseModel, AuditMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK `projects.id`, not null, indexed |
| `name` | String(200) | not null |
| `is_enabled` | Boolean | default true, not null |
| `trigger_type` | TriggerType enum | not null |
| `trigger_config` | JSONB | default `{}`, not null |
| `condition_config` | JSONB | nullable |
| `action_type` | ActionType enum | not null |
| `action_config` | JSONB | default `{}`, not null |
| `execution_count` | Integer | default 0, not null |
| `last_executed_at` | DateTime TZ | nullable |

Relationships: `project`, `execution_logs` (cascade all, delete-orphan)

### AutomationExecutionLog

File: `backend/app/models/automation.py` | Table: `automation_execution_logs` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `rule_id` | UUID | FK `automation_rules.id`, not null, indexed |
| `issue_id` | UUID | FK `issues.id`, nullable, indexed |
| `trigger_data` | JSONB | nullable |
| `success` | Boolean | not null |
| `error_message` | Text | nullable |
| `executed_at` | DateTime TZ | server default `now()`, not null |

### ProjectBudget

File: `backend/app/models/budget.py` | Table: `project_budgets` | Inherits: `BaseModel, AuditMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK `projects.id`, unique, not null, indexed |
| `total_budget` | Float | not null |
| `currency` | String(3) | default `"USD"`, not null |
| `notes` | Text | nullable |

One budget per project (unique constraint on `project_id`). Relationships: `project`, `cost_entries` (viewonly, via `project_id` join)

### CostEntry

File: `backend/app/models/budget.py` | Table: `cost_entries` | Inherits: `BaseModel, AuditMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK `projects.id`, not null, indexed |
| `issue_id` | UUID | FK `issues.id`, nullable, indexed |
| `category` | CostCategory enum | not null |
| `amount` | Float | not null |
| `description` | Text | nullable |
| `entry_date` | Date | not null |

### CustomDashboard

File: `backend/app/models/dashboard.py` | Table: `custom_dashboards` | Inherits: `BaseModel, AuditMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `owner_id` | UUID | FK `users.id`, not null, indexed |
| `name` | String(200) | not null |
| `scope` | String(20) | default `"personal"`, not null |
| `scope_id` | UUID | nullable |
| `layout_json` | JSONB | default `{}`, not null |
| `widgets_json` | JSONB | default `[]`, not null |
| `is_shared` | Boolean | default false, not null |

### SavedReport

File: `backend/app/models/dashboard.py` | Table: `saved_reports` | Inherits: `BaseModel, AuditMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `owner_id` | UUID | FK `users.id`, not null, indexed |
| `name` | String(200) | not null |
| `report_type` | String(50) | not null |
| `config_json` | JSONB | default `{}`, not null |
| `project_id` | UUID | FK `projects.id`, nullable, indexed |

### Decision

File: `backend/app/models/decision.py` | Table: `decisions` | Inherits: `BaseModel, AuditMixin, SoftDeleteMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK `projects.id`, not null, indexed |
| `title` | String(300) | not null |
| `description` | Text | nullable |
| `status` | DecisionStatus enum | default `proposed`, not null |
| `decided_date` | Date | nullable |
| `outcome` | Text | nullable |
| `rationale` | Text | nullable |

Relationships: `project`, `issue_links` (cascade all, delete-orphan)

### DecisionIssueLink

File: `backend/app/models/decision.py` | Table: `decision_issue_links` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `decision_id` | UUID | FK `decisions.id`, not null, indexed |
| `issue_id` | UUID | FK `issues.id`, not null, indexed |

Unique constraint: `uq_decision_issue_link` on (`decision_id`, `issue_id`)

### IntakeForm

File: `backend/app/models/intake.py` | Table: `intake_forms` | Inherits: `BaseModel, AuditMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK `projects.id`, not null, indexed |
| `name` | String(200) | not null |
| `description` | Text | nullable |
| `fields_schema` | JSONB | not null |
| `is_active` | Boolean | default true, not null |
| `public_slug` | String(100) | unique, nullable |

Relationships: `project`, `submissions` (cascade all, delete-orphan)

### IntakeSubmission

File: `backend/app/models/intake.py` | Table: `intake_submissions` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `form_id` | UUID | FK `intake_forms.id`, not null, indexed |
| `submitted_by_email` | String(254) | nullable |
| `submitted_by_name` | String(200) | nullable |
| `data_json` | JSONB | not null |
| `status` | String(20) | default `"pending"`, not null |
| `created_issue_id` | UUID | FK `issues.id`, nullable |
| `reviewed_by` | UUID | FK `users.id`, nullable |
| `reviewed_at` | DateTime TZ | nullable |

### Risk

File: `backend/app/models/risk.py` | Table: `risks` | Inherits: `BaseModel, AuditMixin, SoftDeleteMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK `projects.id`, not null, indexed |
| `title` | String(300) | not null |
| `description` | Text | nullable |
| `category` | RiskCategory enum | default `technical`, not null |
| `probability` | RiskProbability enum | default `medium`, not null |
| `impact` | RiskImpact enum | default `medium`, not null |
| `risk_score` | Integer | default 9, not null |
| `status` | RiskStatus enum | default `identified`, not null |
| `owner_id` | UUID | FK `users.id`, nullable |
| `mitigation_plan` | Text | nullable |
| `contingency_plan` | Text | nullable |
| `trigger_conditions` | Text | nullable |
| `due_date` | Date | nullable |
| `resolved_at` | DateTime TZ | nullable |

`risk_score` = probability_score * impact_score (1-5 each, computed via `compute_risk_score()` helper).

Relationships: `project`, `owner`, `responses` (cascade all, delete-orphan)

### RiskResponse

File: `backend/app/models/risk.py` | Table: `risk_responses` | Inherits: `BaseModel, AuditMixin, SoftDeleteMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `risk_id` | UUID | FK `risks.id`, not null, indexed |
| `response_type` | RiskResponseType enum | default `mitigate`, not null |
| `description` | Text | nullable |
| `status` | RiskResponseStatus enum | default `planned`, not null |
| `assigned_to` | UUID | FK `users.id`, nullable |

### Stakeholder

File: `backend/app/models/stakeholder.py` | Table: `stakeholders` | Inherits: `BaseModel, AuditMixin, SoftDeleteMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK `projects.id`, not null, indexed |
| `name` | String(200) | not null |
| `role` | String(100) | nullable |
| `email` | String(254) | nullable |
| `organization_name` | String(200) | nullable |
| `interest_level` | Integer | not null |
| `influence_level` | Integer | not null |
| `engagement_strategy` | Text | nullable |
| `notes` | Text | nullable |

Check constraints: `ck_stakeholders_interest_level_range` (1-5), `ck_stakeholders_influence_level_range` (1-5)

### RACIAssignment

File: `backend/app/models/raci.py` | Table: `raci_assignments` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK `projects.id`, not null, indexed |
| `issue_id` | UUID | FK `issues.id`, nullable, indexed |
| `user_id` | UUID | FK `users.id`, not null, indexed |
| `role_type` | RACIRoleType enum | not null |

Unique constraint: `uq_raci_assignment` on (`project_id`, `issue_id`, `user_id`, `role_type`)

### RecurringRule

File: `backend/app/models/recurring.py` | Table: `recurring_rules` | Inherits: `BaseModel, AuditMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK `projects.id`, not null, indexed |
| `name` | String(200) | not null |
| `frequency` | RecurrenceFrequency enum | not null |
| `day_of_week` | Integer | nullable (0=Mon, 6=Sun) |
| `day_of_month` | Integer | nullable |
| `template_summary` | String(500) | not null |
| `template_description` | Text | nullable |
| `template_issue_type_id` | UUID | FK `issue_types.id`, nullable |
| `template_assignee_id` | UUID | FK `users.id`, nullable |
| `template_priority` | String(20) | default `"medium"`, not null |
| `is_active` | Boolean | default true, not null |
| `last_created_at` | DateTime TZ | nullable |
| `next_due_at` | DateTime TZ | nullable |

### SLAPolicy

File: `backend/app/models/sla.py` | Table: `sla_policies` | Inherits: `BaseModel, AuditMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK `projects.id`, not null, indexed |
| `name` | String(200) | not null |
| `priority_filter` | String(20) | nullable |
| `response_hours` | Integer | nullable |
| `resolution_hours` | Integer | nullable |
| `is_active` | Boolean | default true, not null |

### IssueSLAStatus

File: `backend/app/models/sla.py` | Table: `issue_sla_statuses` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `issue_id` | UUID | FK `issues.id`, unique, not null, indexed |
| `policy_id` | UUID | FK `sla_policies.id`, not null |
| `response_deadline` | DateTime TZ | nullable |
| `resolution_deadline` | DateTime TZ | nullable |
| `first_responded_at` | DateTime TZ | nullable |
| `resolved_at` | DateTime TZ | nullable |
| `response_breached` | Boolean | default false, not null |
| `resolution_breached` | Boolean | default false, not null |

One SLA status per issue (unique on `issue_id`).

### ScheduleRun

File: `backend/app/models/schedule.py` | Table: `schedule_runs` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK `projects.id`, not null, indexed |
| `triggered_by` | UUID | FK `users.id`, nullable |
| `status` | ScheduleRunStatus enum | default `pending`, not null |
| `result_json` | JSONB | nullable |
| `critical_path_json` | JSONB | nullable |
| `error_message` | Text | nullable |
| `started_at` | DateTime TZ | nullable |
| `completed_at` | DateTime TZ | nullable |

### Release

File: `backend/app/models/portfolio.py` | Table: `releases` | Inherits: `BaseModel, AuditMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `workspace_id` | UUID | FK `workspaces.id`, not null, indexed |
| `name` | String(200) | not null |
| `description` | Text | nullable |
| `status` | ReleaseStatus enum | default `planning`, not null |
| `release_date` | Date | nullable |
| `released_at` | DateTime TZ | nullable |

Relationships: `workspace`, `release_projects` (cascade all, delete-orphan)

### ReleaseProject

File: `backend/app/models/portfolio.py` | Table: `release_projects` | Inherits: `BaseModel, TimestampMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `release_id` | UUID | FK `releases.id`, not null, indexed |
| `project_id` | UUID | FK `projects.id`, not null, indexed |

Unique constraint: `uq_release_projects` on (`release_id`, `project_id`)

### CrossProjectDependency

File: `backend/app/models/portfolio.py` | Table: `cross_project_dependencies` | Inherits: `BaseModel, AuditMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `source_project_id` | UUID | FK `projects.id`, not null, indexed |
| `target_project_id` | UUID | FK `projects.id`, not null, indexed |
| `source_issue_id` | UUID | FK `issues.id`, nullable |
| `target_issue_id` | UUID | FK `issues.id`, nullable |
| `dependency_type` | String(50) | default `"blocks"`, not null |
| `description` | Text | nullable |

### ProjectTemplate

File: `backend/app/models/template.py` | Table: `project_templates` | Inherits: `BaseModel, AuditMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `name` | String(200) | not null |
| `description` | Text | nullable |
| `icon` | String(50) | nullable |
| `color` | String(7) | nullable |
| `is_system` | Boolean | default false, not null |
| `template_data` | JSONB | not null |

No project FK -- templates are global resources.

### Integration

File: `backend/app/models/integration.py` | Table: `integrations` | Inherits: `BaseModel, AuditMixin, SoftDeleteMixin`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK `projects.id`, not null, indexed |
| `type` | IntegrationType enum | not null (native enum) |
| `name` | String(255) | not null |
| `config_json` | Text | not null, default `"{}"` |
| `is_active` | Boolean | default true, not null |
| `last_triggered_at` | DateTime TZ | nullable |

Note: `IntegrationType` uses native Postgres enum (not `native_enum=False`).

Relationships: `webhook_logs` (cascade all, delete-orphan)

### WebhookLog

File: `backend/app/models/integration.py` | Table: `webhook_logs` | Inherits: `BaseModel`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `integration_id` | UUID | FK `integrations.id`, not null, indexed |
| `event_type` | String(100) | not null |
| `payload_json` | Text | not null |
| `status_code` | Integer | nullable |
| `response_body` | Text | nullable |
| `success` | Boolean | default false, not null |
| `created_at` | DateTime TZ | server default `now()`, not null |

---

## Junction Tables

Defined as raw `Table` objects in `backend/app/models/issue_extras.py`.

### issue_labels

| Column | Type | Constraints |
|--------|------|-------------|
| `issue_id` | UUID | FK `issues.id`, PK |
| `label_id` | UUID | FK `labels.id`, PK |

Composite PK. Used by `Issue.labels` relationship as `secondary`.

### issue_watchers

| Column | Type | Constraints |
|--------|------|-------------|
| `issue_id` | UUID | FK `issues.id`, PK |
| `user_id` | UUID | FK `users.id`, PK |

Composite PK. Used by `Issue.watchers` relationship as `secondary`.

---

## Entity Relationship Groups

### Multi-tenancy Hierarchy

```
Organization (1) ---> (*) Workspace (1) ---> (*) Project (1) ---> (*) Issue
     |                       |                       |
     v                       v                       v
  OrgMember           WorkspaceMember          ProjectMember
                            |
                            v
                          Team ---> TeamMember
```

- Organization is the top-level tenant
- Workspaces partition an org (unique slug per org)
- Projects live in a workspace (unique `key_prefix` globally)
- Issues belong to a project

### RBAC

```
Role (1) ---> (*) RolePermission
  ^
  |--- referenced by OrgMember.role_id
  |--- referenced by WorkspaceMember.role_id
  |--- referenced by ProjectMember.role_id
```

Roles are scoped by `scope_type` (org, workspace, project). System roles (`is_system=true`) are seeded via `make seed`.

### Issue Graph

```
Issue (self-referential: parent_issue_id)
  |
  |--- children: Issue[]
  |--- IssueLink (source_issue_id <--link_type--> target_issue_id)
  |--- IssueComment (issue_id, author_id)
  |--- IssueActivityLog (issue_id, user_id, action, field changes)
  |--- CustomFieldValue (issue_id, field_definition_id)
  |--- Labels (via issue_labels junction)
  |--- Watchers (via issue_watchers junction)
  |--- TimeEntry (issue_id, user_id)
  |--- IssueApproval (issue_id, step_id)
  |--- IssueSLAStatus (issue_id, 1:1)
```

### Workflow Engine

```
Workflow (1) ---> (*) WorkflowStatus
    |                     ^
    |                     |--- Issue.status_id references WorkflowStatus
    |
    +--> (*) WorkflowTransition (from_status_id --> to_status_id)
```

Each project has one or more workflows. Statuses are categorized by `StatusCategory` for reporting.

### Planning

```
Project ---> Milestone ---> GateApproval
    |
    +--> Baseline ---> BaselineSnapshot (per issue)
    |
    +--> Sprint ---> Issue.sprint_id
    |
    +--> ScheduleRun (critical path analysis)

Workspace ---> RoadmapPlan ---> RoadmapPlanProject
                   |
                   +--> RoadmapScenario ---> RoadmapScenarioOverride
```

### Wiki

```
Workspace ---> WikiSpace ---> WikiPage (self-referential: parent_id)
                                  |
                                  +--> WikiPageVersion (version history)
                                  +--> WikiPageComment (threaded: parent_comment_id)
```

Both `Issue` and `WikiPage` have `TSVECTOR` columns with GIN indexes for full-text search.

### Portfolio & Cross-Project

```
Workspace ---> Release ---> ReleaseProject ---> Project
    |
    +--> CrossProjectDependency (source_project <--> target_project, optional issue links)
```

---

## Indexes Reference

### GIN Indexes (Full-Text Search)

| Table | Index | Column |
|-------|-------|--------|
| `issues` | `ix_issues_search` | `search_vector` |
| `wiki_pages` | `ix_wiki_pages_search_vector` | `search_vector` |

### Composite Indexes

| Table | Index | Columns |
|-------|-------|---------|
| `issues` | `ix_issues_project_deleted` | `project_id`, `is_deleted` |
| `issue_comments` | `ix_issue_comments_issue_created` | `issue_id`, `created_at` |
| `issue_activity_log` | `ix_issue_activity_issue_created` | `issue_id`, `created_at` |
| `issue_links` | `ix_issue_links_source` | `source_issue_id` |
| `issue_links` | `ix_issue_links_target` | `target_issue_id` |
| `time_entries` | `ix_time_entries_issue` | `issue_id` |
| `time_entries` | `ix_time_entries_user_date` | `user_id`, `date` |
| `audit_log` | `ix_audit_log_entity` | `entity_type`, `entity_id`, `created_at` |
| `notifications` | `ix_notifications_user_read_created` | `user_id`, `is_read`, `created_at` |
| `favorites` | `ix_favorites_user_entity` | `user_id`, `entity_type` |
| `recent_items` | `ix_recent_items_user_viewed` | `user_id`, `viewed_at` |
| `cost_entries` | `ix_cost_entries_project_date` | `project_id`, `entry_date` |
| `automation_execution_logs` | `ix_automation_exec_logs_rule_executed` | `rule_id`, `executed_at` |

### Notable Single-Column Indexes

Most FK columns are explicitly indexed. Additionally:
- `users.email` -- unique index
- `organizations.slug` -- unique index
- `issues.issue_key` -- unique index
- `SoftDeleteMixin.is_deleted` -- indexed on every model that uses it

---

## Migration Strategy

- Migrations use **Alembic** with a linear (non-branching) revision chain
- Migration files: `backend/alembic/`
- Generate a new migration: `make makemigration` (auto-detects model changes)
- Apply migrations: `make migrate`
- All models must be imported in `backend/app/models/__init__.py` for Alembic autogenerate to detect them
- Enum types use `native_enum=False` (varchar storage) to avoid the complexity of Postgres enum migration, with one exception: `IntegrationType` uses native Postgres enum
- UUID primary keys use `gen_random_uuid()` as server default
