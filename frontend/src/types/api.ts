// Shared TypeScript interfaces mirroring backend schemas

export interface PaginationMeta {
  next_cursor: string | null
  has_more: boolean
  total_count: number | null
}

export interface CursorPage<T> {
  data: T[]
  pagination: PaginationMeta
}

export interface User {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  timezone: string
  is_active: boolean
  created_at: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  settings: Record<string, unknown> | null
  created_at: string
}

export interface Workspace {
  id: string
  org_id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

export interface Project {
  id: string
  workspace_id: string
  name: string
  key_prefix: string
  description: string | null
  status: 'active' | 'paused' | 'completed' | 'archived'
  rag_status: 'green' | 'amber' | 'red' | 'none'
  lead_id: string | null
  start_date: string | null
  target_date: string | null
  actual_date: string | null
  created_at: string
  updated_at: string
}

export interface WorkflowStatus {
  id: string
  workflow_id: string
  name: string
  category: 'todo' | 'in_progress' | 'done'
  color: string
  sort_order: number
}

export interface Workflow {
  id: string
  project_id: string
  name: string
  is_default: boolean
  statuses?: WorkflowStatus[]
}

export interface IssueType {
  id: string
  name: string
  icon: string | null
  color: string | null
  is_subtask: boolean
}

export interface Issue {
  id: string
  project_id: string
  issue_type_id: string
  status_id: string
  issue_key: string
  summary: string
  description: string | null
  priority: string
  assignee_id: string | null
  reporter_id: string | null
  parent_id: string | null
  estimated_hours: number | null
  actual_hours: number | null
  story_points: number | null
  percent_complete: number
  start_date: string | null
  due_date: string | null
  sort_order: number
  created_at: string
  updated_at: string
  // Expanded relations (optional)
  assignee?: User
  reporter?: User
  issue_type?: IssueType
  status?: WorkflowStatus
  labels?: Label[]
}

export interface IssueComment {
  id: string
  issue_id: string
  author_id: string
  content: string
  created_at: string
  updated_at: string
  author?: User
}

export interface Label {
  id: string
  project_id: string
  name: string
  color: string
  description: string | null
}

export interface Component {
  id: string
  project_id: string
  name: string
  description: string | null
  lead_id: string | null
}

export interface Version {
  id: string
  project_id: string
  name: string
  description: string | null
  start_date: string | null
  release_date: string | null
  status: string
}

export interface TimeEntry {
  id: string
  issue_id: string
  user_id: string
  hours: number
  date: string
  description: string | null
  created_at: string
}

export interface SavedView {
  id: string
  project_id: string
  user_id: string
  name: string
  description: string | null
  filters_json: Record<string, unknown> | null
  columns_json: string[] | null
  sort_json: Record<string, unknown> | null
  is_shared: boolean
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  entity_type: string | null
  entity_id: string | null
  project_id: string | null
  is_read: boolean
  created_at: string
}

export interface Favorite {
  id: string
  user_id: string
  entity_type: string
  entity_id: string
  created_at: string
}

export interface Milestone {
  id: string
  project_id: string
  name: string
  description: string | null
  milestone_type: string
  status: string
  start_date: string | null
  due_date: string | null
  completed_date: string | null
  progress_pct: number
  created_at: string
}

export interface Decision {
  id: string
  project_id: string
  title: string
  description: string | null
  status: string
  decided_date: string | null
  created_at: string
}

export interface Stakeholder {
  id: string
  project_id: string
  name: string
  role: string | null
  interest_level: number
  influence_level: number
  created_at: string
}

export interface WikiPage {
  id: string
  space_id: string
  parent_id: string | null
  title: string
  content: string | null
  slug: string
  version: number
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface WikiSpace {
  id: string
  workspace_id: string
  name: string
  slug: string
  description: string | null
}

export interface RoadmapPlan {
  id: string
  workspace_id: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
}

export interface Release {
  id: string
  workspace_id: string
  name: string
  description: string | null
  status: string
  release_date: string | null
}

export interface AutomationRule {
  id: string
  project_id: string
  name: string
  is_enabled: boolean
  trigger_type: string
  trigger_config: Record<string, unknown>
  condition_config: Record<string, unknown> | null
  action_type: string
  action_config: Record<string, unknown>
  execution_count: number
}

export interface CustomDashboard {
  id: string
  owner_id: string
  name: string
  scope: string
  scope_id: string | null
  layout_json: Record<string, unknown>
  widgets_json: Record<string, unknown>[]
}
