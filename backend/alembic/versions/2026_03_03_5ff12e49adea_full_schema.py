"""full_schema

Revision ID: 5ff12e49adea
Revises: 
Create Date: 2026-03-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '5ff12e49adea'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create all tables in dependency order
    op.execute('''
CREATE TABLE organizations (
	name VARCHAR(255) NOT NULL, 
	slug VARCHAR(255) NOT NULL, 
	logo_url VARCHAR(500), 
	settings JSONB, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	deleted_by UUID, 
	PRIMARY KEY (id)
)
''')

    op.execute('''
CREATE TABLE roles (
	name VARCHAR(100) NOT NULL, 
	scope_type VARCHAR(50) NOT NULL, 
	is_system BOOLEAN NOT NULL, 
	description TEXT, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_roles_name_scope UNIQUE (name, scope_type)
)
''')

    op.execute('''
CREATE TABLE users (
	email VARCHAR(255) NOT NULL, 
	display_name VARCHAR(255) NOT NULL, 
	avatar_url VARCHAR(500), 
	timezone VARCHAR(100) NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	deleted_by UUID, 
	PRIMARY KEY (id)
)
''')

    op.execute('''
CREATE TABLE project_templates (
	name VARCHAR(200) NOT NULL, 
	description TEXT, 
	icon VARCHAR(50), 
	color VARCHAR(7), 
	is_system BOOLEAN NOT NULL, 
	template_data JSONB NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id)
)
''')

    op.execute('''
CREATE TABLE org_members (
	org_id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	role_id UUID NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_org_members_org_user UNIQUE (org_id, user_id), 
	FOREIGN KEY(org_id) REFERENCES organizations (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(role_id) REFERENCES roles (id)
)
''')

    op.execute('''
CREATE TABLE role_permissions (
	role_id UUID NOT NULL, 
	permission VARCHAR(100) NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_role_permissions_role_perm UNIQUE (role_id, permission), 
	FOREIGN KEY(role_id) REFERENCES roles (id)
)
''')

    op.execute('''
CREATE TABLE user_preferences (
	user_id UUID NOT NULL, 
	default_view VARCHAR(50) NOT NULL, 
	sidebar_state JSONB, 
	column_layouts JSONB, 
	notification_settings JSONB, 
	date_format VARCHAR(50) NOT NULL, 
	timezone VARCHAR(100) NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)
''')

    op.execute('''
CREATE TABLE workspaces (
	org_id UUID NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	slug VARCHAR(255) NOT NULL, 
	description TEXT, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	deleted_by UUID, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_workspaces_org_slug UNIQUE (org_id, slug), 
	FOREIGN KEY(org_id) REFERENCES organizations (id)
)
''')

    op.execute('''
CREATE TABLE audit_log (
	entity_type VARCHAR(50) NOT NULL, 
	entity_id UUID NOT NULL, 
	user_id UUID, 
	action VARCHAR(50) NOT NULL, 
	changes_json JSONB, 
	ip_address VARCHAR(50), 
	request_id VARCHAR(100), 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)
''')

    op.execute('''
CREATE TABLE favorites (
	user_id UUID NOT NULL, 
	entity_type VARCHAR(50) NOT NULL, 
	entity_id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)
''')

    op.execute('''
CREATE TABLE recent_items (
	user_id UUID NOT NULL, 
	entity_type VARCHAR(50) NOT NULL, 
	entity_id UUID NOT NULL, 
	viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)
''')

    op.execute('''
CREATE TABLE task_status (
	task_type VARCHAR(50) NOT NULL, 
	entity_id UUID, 
	user_id UUID NOT NULL, 
	status VARCHAR(20) NOT NULL, 
	progress_pct INTEGER NOT NULL, 
	result_summary_json JSONB, 
	error_message TEXT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	started_at TIMESTAMP WITH TIME ZONE, 
	completed_at TIMESTAMP WITH TIME ZONE, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)
''')

    op.execute('''
CREATE TABLE uploads (
	entity_type VARCHAR(50) NOT NULL, 
	entity_id UUID, 
	file_name VARCHAR(255) NOT NULL, 
	file_path VARCHAR(500) NOT NULL, 
	file_size_bytes INTEGER NOT NULL, 
	mime_type VARCHAR(100) NOT NULL, 
	uploaded_by UUID NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(uploaded_by) REFERENCES users (id)
)
''')

    op.execute('''
CREATE TABLE custom_dashboards (
	owner_id UUID NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	scope VARCHAR(20) NOT NULL, 
	scope_id UUID, 
	layout_json JSONB DEFAULT '{}' NOT NULL, 
	widgets_json JSONB DEFAULT '[]' NOT NULL, 
	is_shared BOOLEAN NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(owner_id) REFERENCES users (id)
)
''')

    op.execute('''
CREATE TABLE workspace_members (
	workspace_id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	role_id UUID NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_workspace_members_ws_user UNIQUE (workspace_id, user_id), 
	FOREIGN KEY(workspace_id) REFERENCES workspaces (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(role_id) REFERENCES roles (id)
)
''')

    op.execute('''
CREATE TABLE projects (
	workspace_id UUID NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	key_prefix VARCHAR(10) NOT NULL, 
	description TEXT, 
	status VARCHAR(9) NOT NULL, 
	lead_id UUID, 
	start_date DATE, 
	target_end_date DATE, 
	rag_status VARCHAR(5) NOT NULL, 
	archived_at TIMESTAMP WITH TIME ZONE, 
	archived_by UUID, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	deleted_by UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(workspace_id) REFERENCES workspaces (id), 
	UNIQUE (key_prefix), 
	FOREIGN KEY(lead_id) REFERENCES users (id)
)
''')

    op.execute('''
CREATE TABLE teams (
	workspace_id UUID NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	description TEXT, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	deleted_by UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(workspace_id) REFERENCES workspaces (id)
)
''')

    op.execute('''
CREATE TABLE releases (
	workspace_id UUID NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	description TEXT, 
	status VARCHAR(11) NOT NULL, 
	release_date DATE, 
	released_at TIMESTAMP WITH TIME ZONE, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(workspace_id) REFERENCES workspaces (id)
)
''')

    op.execute('''
CREATE TABLE roadmap_plans (
	workspace_id UUID NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	description TEXT, 
	start_date DATE, 
	end_date DATE, 
	is_active BOOLEAN NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(workspace_id) REFERENCES workspaces (id)
)
''')

    op.execute('''
CREATE TABLE wiki_spaces (
	workspace_id UUID NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	slug VARCHAR(100) NOT NULL, 
	description TEXT, 
	is_active BOOLEAN NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_wiki_spaces_workspace_slug UNIQUE (workspace_id, slug), 
	FOREIGN KEY(workspace_id) REFERENCES workspaces (id)
)
''')

    op.execute('''
CREATE TABLE project_members (
	project_id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	role_id UUID NOT NULL, 
	capacity_pct FLOAT, 
	hours_per_week FLOAT, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_project_members_proj_user UNIQUE (project_id, user_id), 
	FOREIGN KEY(project_id) REFERENCES projects (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(role_id) REFERENCES roles (id)
)
''')

    op.execute('''
CREATE TABLE team_members (
	team_id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_team_members_team_user UNIQUE (team_id, user_id), 
	FOREIGN KEY(team_id) REFERENCES teams (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)
''')

    op.execute('''
CREATE TABLE custom_field_definitions (
	project_id UUID NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	field_type VARCHAR(13) NOT NULL, 
	description TEXT, 
	options_json JSONB, 
	validation_json JSONB, 
	default_value VARCHAR(500), 
	sort_order INTEGER NOT NULL, 
	is_required BOOLEAN NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_custom_field_defs_project_name UNIQUE (project_id, name), 
	FOREIGN KEY(project_id) REFERENCES projects (id)
)
''')

    op.execute('''
CREATE TABLE labels (
	project_id UUID NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	color VARCHAR(7) NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_labels_project_name UNIQUE (project_id, name), 
	FOREIGN KEY(project_id) REFERENCES projects (id)
)
''')

    op.execute('''
CREATE TABLE components (
	project_id UUID NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	description TEXT, 
	lead_id UUID, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_components_project_name UNIQUE (project_id, name), 
	FOREIGN KEY(project_id) REFERENCES projects (id), 
	FOREIGN KEY(lead_id) REFERENCES users (id)
)
''')

    op.execute('''
CREATE TABLE versions (
	project_id UUID NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	description TEXT, 
	start_date DATE, 
	release_date DATE, 
	status VARCHAR(20) NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_versions_project_name UNIQUE (project_id, name), 
	FOREIGN KEY(project_id) REFERENCES projects (id)
)
''')

    op.execute('''
CREATE TABLE project_issue_counters (
	project_id UUID NOT NULL, 
	prefix VARCHAR(10) NOT NULL, 
	next_number INTEGER NOT NULL, 
	PRIMARY KEY (project_id), 
	FOREIGN KEY(project_id) REFERENCES projects (id)
)
''')

    op.execute('''
CREATE TABLE issue_types (
	project_id UUID NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	description TEXT, 
	icon VARCHAR(50) NOT NULL, 
	color VARCHAR(7) NOT NULL, 
	hierarchy_level INTEGER NOT NULL, 
	is_subtask BOOLEAN NOT NULL, 
	sort_order INTEGER NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_issue_types_project_name UNIQUE (project_id, name), 
	FOREIGN KEY(project_id) REFERENCES projects (id)
)
''')

    op.execute('''
CREATE TABLE notifications (
	user_id UUID NOT NULL, 
	type VARCHAR(50) NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	body TEXT, 
	entity_type VARCHAR(50), 
	entity_id UUID, 
	project_id UUID, 
	is_read BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id)
)
''')

    op.execute('''
CREATE TABLE saved_views (
	project_id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	is_shared BOOLEAN NOT NULL, 
	view_type VARCHAR(20) NOT NULL, 
	filters_json JSONB, 
	columns_json JSONB, 
	sort_json JSONB, 
	grouping_json JSONB, 
	is_default BOOLEAN NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)
''')

    op.execute('''
CREATE TABLE workflows (
	project_id UUID NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	description TEXT, 
	is_default BOOLEAN NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id)
)
''')

    op.execute('''
CREATE TABLE approval_steps (
	project_id UUID NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	step_order INTEGER NOT NULL, 
	approver_id UUID NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id), 
	FOREIGN KEY(approver_id) REFERENCES users (id)
)
''')

    op.execute('''
CREATE TABLE automation_rules (
	project_id UUID NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	is_enabled BOOLEAN NOT NULL, 
	trigger_type VARCHAR(20) NOT NULL, 
	trigger_config JSONB DEFAULT '{}' NOT NULL, 
	condition_config JSONB, 
	action_type VARCHAR(17) NOT NULL, 
	action_config JSONB DEFAULT '{}' NOT NULL, 
	execution_count INTEGER NOT NULL, 
	last_executed_at TIMESTAMP WITH TIME ZONE, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id)
)
''')

    op.execute('''
CREATE TABLE baselines (
	project_id UUID NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	description TEXT, 
	snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id)
)
''')

    op.execute('''
CREATE TABLE project_budgets (
	project_id UUID NOT NULL, 
	total_budget FLOAT NOT NULL, 
	currency VARCHAR(3) NOT NULL, 
	notes TEXT, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_project_budgets_project UNIQUE (project_id), 
	FOREIGN KEY(project_id) REFERENCES projects (id)
)
''')

    op.execute('''
CREATE TABLE saved_reports (
	owner_id UUID NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	report_type VARCHAR(50) NOT NULL, 
	config_json JSONB DEFAULT '{}' NOT NULL, 
	project_id UUID, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(owner_id) REFERENCES users (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id)
)
''')

    op.execute('''
CREATE TABLE decisions (
	project_id UUID NOT NULL, 
	title VARCHAR(300) NOT NULL, 
	description TEXT, 
	status VARCHAR(12) NOT NULL, 
	decided_date DATE, 
	outcome TEXT, 
	rationale TEXT, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	deleted_by UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id)
)
''')

    op.execute('''
CREATE TABLE intake_forms (
	project_id UUID NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	description TEXT, 
	fields_schema JSONB NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	public_slug VARCHAR(100), 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id), 
	UNIQUE (public_slug)
)
''')

    op.execute('''
CREATE TABLE milestones (
	project_id UUID NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	description TEXT, 
	milestone_type VARCHAR(11) NOT NULL, 
	status VARCHAR(11) NOT NULL, 
	start_date DATE, 
	due_date DATE, 
	completed_date DATE, 
	progress_pct INTEGER NOT NULL, 
	sort_order INTEGER NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	deleted_by UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id)
)
''')

    op.execute('''
CREATE TABLE release_projects (
	release_id UUID NOT NULL, 
	project_id UUID NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_release_projects UNIQUE (release_id, project_id), 
	FOREIGN KEY(release_id) REFERENCES releases (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id)
)
''')

    op.execute('''
CREATE TABLE roadmap_plan_projects (
	plan_id UUID NOT NULL, 
	project_id UUID NOT NULL, 
	color VARCHAR(7) NOT NULL, 
	sort_order INTEGER NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_roadmap_plan_project UNIQUE (plan_id, project_id), 
	FOREIGN KEY(plan_id) REFERENCES roadmap_plans (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id)
)
''')

    op.execute('''
CREATE TABLE roadmap_scenarios (
	plan_id UUID NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	description TEXT, 
	is_baseline BOOLEAN NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(plan_id) REFERENCES roadmap_plans (id)
)
''')

    op.execute('''
CREATE TABLE schedule_runs (
	project_id UUID NOT NULL, 
	triggered_by UUID, 
	status VARCHAR(9) NOT NULL, 
	result_json JSONB, 
	critical_path_json JSONB, 
	error_message TEXT, 
	started_at TIMESTAMP WITH TIME ZONE, 
	completed_at TIMESTAMP WITH TIME ZONE, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id), 
	FOREIGN KEY(triggered_by) REFERENCES users (id)
)
''')

    op.execute('''
CREATE TABLE sla_policies (
	project_id UUID NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	priority_filter VARCHAR(20), 
	response_hours INTEGER, 
	resolution_hours INTEGER, 
	is_active BOOLEAN NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id)
)
''')

    op.execute('''
CREATE TABLE stakeholders (
	project_id UUID NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	role VARCHAR(100), 
	email VARCHAR(254), 
	organization_name VARCHAR(200), 
	interest_level INTEGER NOT NULL, 
	influence_level INTEGER NOT NULL, 
	engagement_strategy TEXT, 
	notes TEXT, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	deleted_by UUID, 
	PRIMARY KEY (id), 
	CONSTRAINT ck_stakeholders_interest_level_range CHECK (interest_level >= 1 AND interest_level <= 5), 
	CONSTRAINT ck_stakeholders_influence_level_range CHECK (influence_level >= 1 AND influence_level <= 5), 
	FOREIGN KEY(project_id) REFERENCES projects (id)
)
''')

    op.execute('''
CREATE TABLE wiki_pages (
	space_id UUID NOT NULL, 
	parent_id UUID, 
	title VARCHAR(300) NOT NULL, 
	slug VARCHAR(200) NOT NULL, 
	content TEXT, 
	version INTEGER NOT NULL, 
	sort_order INTEGER NOT NULL, 
	search_vector TSVECTOR, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_wiki_pages_space_slug UNIQUE (space_id, slug), 
	FOREIGN KEY(space_id) REFERENCES wiki_spaces (id), 
	FOREIGN KEY(parent_id) REFERENCES wiki_pages (id)
)
''')

    op.execute('''
CREATE TABLE workflow_statuses (
	workflow_id UUID NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	category VARCHAR(11) NOT NULL, 
	color VARCHAR(7) NOT NULL, 
	sort_order INTEGER NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_workflow_statuses_workflow_name UNIQUE (workflow_id, name), 
	FOREIGN KEY(workflow_id) REFERENCES workflows (id)
)
''')

    op.execute('''
CREATE TABLE gate_approvals (
	milestone_id UUID NOT NULL, 
	approver_id UUID NOT NULL, 
	status VARCHAR(8) NOT NULL, 
	notes TEXT, 
	decided_at TIMESTAMP WITH TIME ZONE, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(milestone_id) REFERENCES milestones (id), 
	FOREIGN KEY(approver_id) REFERENCES users (id)
)
''')

    op.execute('''
CREATE TABLE recurring_rules (
	project_id UUID NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	frequency VARCHAR(9) NOT NULL, 
	day_of_week INTEGER, 
	day_of_month INTEGER, 
	template_summary VARCHAR(500) NOT NULL, 
	template_description TEXT, 
	template_issue_type_id UUID, 
	template_assignee_id UUID, 
	template_priority VARCHAR(20) NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	last_created_at TIMESTAMP WITH TIME ZONE, 
	next_due_at TIMESTAMP WITH TIME ZONE, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id), 
	FOREIGN KEY(template_issue_type_id) REFERENCES issue_types (id), 
	FOREIGN KEY(template_assignee_id) REFERENCES users (id)
)
''')

    op.execute('''
CREATE TABLE wiki_page_versions (
	page_id UUID NOT NULL, 
	version_number INTEGER NOT NULL, 
	title VARCHAR(300) NOT NULL, 
	content TEXT, 
	edited_by UUID, 
	change_summary VARCHAR(500), 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_wiki_page_versions_page_version UNIQUE (page_id, version_number), 
	FOREIGN KEY(page_id) REFERENCES wiki_pages (id), 
	FOREIGN KEY(edited_by) REFERENCES users (id)
)
''')

    op.execute('''
CREATE TABLE wiki_page_comments (
	page_id UUID NOT NULL, 
	author_id UUID NOT NULL, 
	parent_comment_id UUID, 
	content TEXT NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(page_id) REFERENCES wiki_pages (id), 
	FOREIGN KEY(author_id) REFERENCES users (id), 
	FOREIGN KEY(parent_comment_id) REFERENCES wiki_page_comments (id)
)
''')

    op.execute('''
CREATE TABLE issues (
	project_id UUID NOT NULL, 
	issue_type_id UUID NOT NULL, 
	status_id UUID NOT NULL, 
	issue_key VARCHAR(20) NOT NULL, 
	summary VARCHAR(500) NOT NULL, 
	description TEXT, 
	description_text TEXT, 
	priority VARCHAR(20) NOT NULL, 
	assignee_id UUID, 
	reporter_id UUID, 
	parent_issue_id UUID, 
	milestone_id UUID, 
	estimated_hours FLOAT, 
	actual_hours FLOAT, 
	story_points INTEGER, 
	percent_complete INTEGER NOT NULL, 
	rag_status VARCHAR(10) NOT NULL, 
	planned_start DATE, 
	planned_end DATE, 
	actual_start DATE, 
	actual_end DATE, 
	sort_order FLOAT NOT NULL, 
	search_vector TSVECTOR, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	deleted_by UUID, 
	PRIMARY KEY (id), 
	CONSTRAINT ck_issues_percent_complete_range CHECK (percent_complete >= 0 AND percent_complete <= 100), 
	FOREIGN KEY(project_id) REFERENCES projects (id), 
	FOREIGN KEY(issue_type_id) REFERENCES issue_types (id), 
	FOREIGN KEY(status_id) REFERENCES workflow_statuses (id), 
	UNIQUE (issue_key), 
	FOREIGN KEY(assignee_id) REFERENCES users (id), 
	FOREIGN KEY(reporter_id) REFERENCES users (id), 
	FOREIGN KEY(parent_issue_id) REFERENCES issues (id)
)
''')

    op.execute('''
CREATE TABLE workflow_transitions (
	workflow_id UUID NOT NULL, 
	from_status_id UUID NOT NULL, 
	to_status_id UUID NOT NULL, 
	name VARCHAR(100), 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(workflow_id) REFERENCES workflows (id), 
	FOREIGN KEY(from_status_id) REFERENCES workflow_statuses (id), 
	FOREIGN KEY(to_status_id) REFERENCES workflow_statuses (id)
)
''')

    op.execute('''
CREATE TABLE custom_field_values (
	issue_id UUID NOT NULL, 
	field_definition_id UUID NOT NULL, 
	value_text TEXT, 
	value_number FLOAT, 
	value_date DATE, 
	value_json JSONB, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_custom_field_values_issue_field UNIQUE (issue_id, field_definition_id), 
	FOREIGN KEY(issue_id) REFERENCES issues (id), 
	FOREIGN KEY(field_definition_id) REFERENCES custom_field_definitions (id)
)
''')

    op.execute('''
CREATE TABLE issue_labels (
	issue_id UUID NOT NULL, 
	label_id UUID NOT NULL, 
	PRIMARY KEY (issue_id, label_id), 
	FOREIGN KEY(issue_id) REFERENCES issues (id), 
	FOREIGN KEY(label_id) REFERENCES labels (id)
)
''')

    op.execute('''
CREATE TABLE issue_watchers (
	issue_id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	PRIMARY KEY (issue_id, user_id), 
	FOREIGN KEY(issue_id) REFERENCES issues (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)
''')

    op.execute('''
CREATE TABLE time_entries (
	issue_id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	hours FLOAT NOT NULL, 
	date DATE NOT NULL, 
	description TEXT, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(issue_id) REFERENCES issues (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)
''')

    op.execute('''
CREATE TABLE issue_links (
	source_issue_id UUID NOT NULL, 
	target_issue_id UUID NOT NULL, 
	link_type VARCHAR(16) NOT NULL, 
	created_by UUID, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(source_issue_id) REFERENCES issues (id), 
	FOREIGN KEY(target_issue_id) REFERENCES issues (id), 
	FOREIGN KEY(created_by) REFERENCES users (id)
)
''')

    op.execute('''
CREATE TABLE issue_comments (
	issue_id UUID NOT NULL, 
	author_id UUID NOT NULL, 
	content TEXT NOT NULL, 
	content_text TEXT, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	deleted_by UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(issue_id) REFERENCES issues (id), 
	FOREIGN KEY(author_id) REFERENCES users (id)
)
''')

    op.execute('''
CREATE TABLE issue_activity_log (
	issue_id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	action VARCHAR(50) NOT NULL, 
	field_name VARCHAR(100), 
	old_value TEXT, 
	new_value TEXT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(issue_id) REFERENCES issues (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)
''')

    op.execute('''
CREATE TABLE issue_approvals (
	issue_id UUID NOT NULL, 
	step_id UUID NOT NULL, 
	approver_id UUID NOT NULL, 
	status VARCHAR(8) NOT NULL, 
	notes TEXT, 
	decided_at TIMESTAMP WITH TIME ZONE, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_issue_approval_step UNIQUE (issue_id, step_id), 
	FOREIGN KEY(issue_id) REFERENCES issues (id), 
	FOREIGN KEY(step_id) REFERENCES approval_steps (id), 
	FOREIGN KEY(approver_id) REFERENCES users (id)
)
''')

    op.execute('''
CREATE TABLE automation_execution_logs (
	rule_id UUID NOT NULL, 
	issue_id UUID, 
	trigger_data JSONB, 
	success BOOLEAN NOT NULL, 
	error_message TEXT, 
	executed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(rule_id) REFERENCES automation_rules (id), 
	FOREIGN KEY(issue_id) REFERENCES issues (id)
)
''')

    op.execute('''
CREATE TABLE baseline_snapshots (
	baseline_id UUID NOT NULL, 
	issue_id UUID NOT NULL, 
	planned_start DATE, 
	planned_end DATE, 
	estimated_hours FLOAT, 
	story_points INTEGER, 
	status_id UUID, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_baseline_snapshots_baseline_issue UNIQUE (baseline_id, issue_id), 
	FOREIGN KEY(baseline_id) REFERENCES baselines (id), 
	FOREIGN KEY(issue_id) REFERENCES issues (id)
)
''')

    op.execute('''
CREATE TABLE cost_entries (
	project_id UUID NOT NULL, 
	issue_id UUID, 
	category VARCHAR(10) NOT NULL, 
	amount FLOAT NOT NULL, 
	description TEXT, 
	entry_date DATE NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id), 
	FOREIGN KEY(issue_id) REFERENCES issues (id)
)
''')

    op.execute('''
CREATE TABLE decision_issue_links (
	decision_id UUID NOT NULL, 
	issue_id UUID NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_decision_issue_link UNIQUE (decision_id, issue_id), 
	FOREIGN KEY(decision_id) REFERENCES decisions (id), 
	FOREIGN KEY(issue_id) REFERENCES issues (id)
)
''')

    op.execute('''
CREATE TABLE intake_submissions (
	form_id UUID NOT NULL, 
	submitted_by_email VARCHAR(254), 
	submitted_by_name VARCHAR(200), 
	data_json JSONB NOT NULL, 
	status VARCHAR(20) NOT NULL, 
	created_issue_id UUID, 
	reviewed_by UUID, 
	reviewed_at TIMESTAMP WITH TIME ZONE, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(form_id) REFERENCES intake_forms (id), 
	FOREIGN KEY(created_issue_id) REFERENCES issues (id), 
	FOREIGN KEY(reviewed_by) REFERENCES users (id)
)
''')

    op.execute('''
CREATE TABLE cross_project_dependencies (
	source_project_id UUID NOT NULL, 
	target_project_id UUID NOT NULL, 
	source_issue_id UUID, 
	target_issue_id UUID, 
	dependency_type VARCHAR(50) NOT NULL, 
	description TEXT, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_by UUID, 
	updated_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(source_project_id) REFERENCES projects (id), 
	FOREIGN KEY(target_project_id) REFERENCES projects (id), 
	FOREIGN KEY(source_issue_id) REFERENCES issues (id), 
	FOREIGN KEY(target_issue_id) REFERENCES issues (id)
)
''')

    op.execute('''
CREATE TABLE raci_assignments (
	project_id UUID NOT NULL, 
	issue_id UUID, 
	user_id UUID NOT NULL, 
	role_type VARCHAR(20) NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_raci_assignment UNIQUE (project_id, issue_id, user_id, role_type), 
	FOREIGN KEY(project_id) REFERENCES projects (id), 
	FOREIGN KEY(issue_id) REFERENCES issues (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)
''')

    op.execute('''
CREATE TABLE roadmap_scenario_overrides (
	scenario_id UUID NOT NULL, 
	issue_id UUID NOT NULL, 
	override_start DATE, 
	override_end DATE, 
	override_assignee_id UUID, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_roadmap_scenario_override UNIQUE (scenario_id, issue_id), 
	FOREIGN KEY(scenario_id) REFERENCES roadmap_scenarios (id), 
	FOREIGN KEY(issue_id) REFERENCES issues (id), 
	FOREIGN KEY(override_assignee_id) REFERENCES users (id)
)
''')

    op.execute('''
CREATE TABLE issue_sla_statuses (
	issue_id UUID NOT NULL, 
	policy_id UUID NOT NULL, 
	response_deadline TIMESTAMP WITH TIME ZONE, 
	resolution_deadline TIMESTAMP WITH TIME ZONE, 
	first_responded_at TIMESTAMP WITH TIME ZONE, 
	resolved_at TIMESTAMP WITH TIME ZONE, 
	response_breached BOOLEAN NOT NULL, 
	resolution_breached BOOLEAN NOT NULL, 
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(issue_id) REFERENCES issues (id), 
	FOREIGN KEY(policy_id) REFERENCES sla_policies (id)
)
''')



def downgrade() -> None:
    # Drop all tables in reverse dependency order
    op.execute('DROP TABLE IF EXISTS issue_sla_statuses CASCADE')
    op.execute('DROP TABLE IF EXISTS roadmap_scenario_overrides CASCADE')
    op.execute('DROP TABLE IF EXISTS raci_assignments CASCADE')
    op.execute('DROP TABLE IF EXISTS cross_project_dependencies CASCADE')
    op.execute('DROP TABLE IF EXISTS intake_submissions CASCADE')
    op.execute('DROP TABLE IF EXISTS decision_issue_links CASCADE')
    op.execute('DROP TABLE IF EXISTS cost_entries CASCADE')
    op.execute('DROP TABLE IF EXISTS baseline_snapshots CASCADE')
    op.execute('DROP TABLE IF EXISTS automation_execution_logs CASCADE')
    op.execute('DROP TABLE IF EXISTS issue_approvals CASCADE')
    op.execute('DROP TABLE IF EXISTS issue_activity_log CASCADE')
    op.execute('DROP TABLE IF EXISTS issue_comments CASCADE')
    op.execute('DROP TABLE IF EXISTS issue_links CASCADE')
    op.execute('DROP TABLE IF EXISTS time_entries CASCADE')
    op.execute('DROP TABLE IF EXISTS issue_watchers CASCADE')
    op.execute('DROP TABLE IF EXISTS issue_labels CASCADE')
    op.execute('DROP TABLE IF EXISTS custom_field_values CASCADE')
    op.execute('DROP TABLE IF EXISTS workflow_transitions CASCADE')
    op.execute('DROP TABLE IF EXISTS issues CASCADE')
    op.execute('DROP TABLE IF EXISTS wiki_page_comments CASCADE')
    op.execute('DROP TABLE IF EXISTS wiki_page_versions CASCADE')
    op.execute('DROP TABLE IF EXISTS recurring_rules CASCADE')
    op.execute('DROP TABLE IF EXISTS gate_approvals CASCADE')
    op.execute('DROP TABLE IF EXISTS workflow_statuses CASCADE')
    op.execute('DROP TABLE IF EXISTS wiki_pages CASCADE')
    op.execute('DROP TABLE IF EXISTS stakeholders CASCADE')
    op.execute('DROP TABLE IF EXISTS sla_policies CASCADE')
    op.execute('DROP TABLE IF EXISTS schedule_runs CASCADE')
    op.execute('DROP TABLE IF EXISTS roadmap_scenarios CASCADE')
    op.execute('DROP TABLE IF EXISTS roadmap_plan_projects CASCADE')
    op.execute('DROP TABLE IF EXISTS release_projects CASCADE')
    op.execute('DROP TABLE IF EXISTS milestones CASCADE')
    op.execute('DROP TABLE IF EXISTS intake_forms CASCADE')
    op.execute('DROP TABLE IF EXISTS decisions CASCADE')
    op.execute('DROP TABLE IF EXISTS saved_reports CASCADE')
    op.execute('DROP TABLE IF EXISTS project_budgets CASCADE')
    op.execute('DROP TABLE IF EXISTS baselines CASCADE')
    op.execute('DROP TABLE IF EXISTS automation_rules CASCADE')
    op.execute('DROP TABLE IF EXISTS approval_steps CASCADE')
    op.execute('DROP TABLE IF EXISTS workflows CASCADE')
    op.execute('DROP TABLE IF EXISTS saved_views CASCADE')
    op.execute('DROP TABLE IF EXISTS notifications CASCADE')
    op.execute('DROP TABLE IF EXISTS issue_types CASCADE')
    op.execute('DROP TABLE IF EXISTS project_issue_counters CASCADE')
    op.execute('DROP TABLE IF EXISTS versions CASCADE')
    op.execute('DROP TABLE IF EXISTS components CASCADE')
    op.execute('DROP TABLE IF EXISTS labels CASCADE')
    op.execute('DROP TABLE IF EXISTS custom_field_definitions CASCADE')
    op.execute('DROP TABLE IF EXISTS team_members CASCADE')
    op.execute('DROP TABLE IF EXISTS project_members CASCADE')
    op.execute('DROP TABLE IF EXISTS wiki_spaces CASCADE')
    op.execute('DROP TABLE IF EXISTS roadmap_plans CASCADE')
    op.execute('DROP TABLE IF EXISTS releases CASCADE')
    op.execute('DROP TABLE IF EXISTS teams CASCADE')
    op.execute('DROP TABLE IF EXISTS projects CASCADE')
    op.execute('DROP TABLE IF EXISTS workspace_members CASCADE')
    op.execute('DROP TABLE IF EXISTS custom_dashboards CASCADE')
    op.execute('DROP TABLE IF EXISTS uploads CASCADE')
    op.execute('DROP TABLE IF EXISTS task_status CASCADE')
    op.execute('DROP TABLE IF EXISTS recent_items CASCADE')
    op.execute('DROP TABLE IF EXISTS favorites CASCADE')
    op.execute('DROP TABLE IF EXISTS audit_log CASCADE')
    op.execute('DROP TABLE IF EXISTS workspaces CASCADE')
    op.execute('DROP TABLE IF EXISTS user_preferences CASCADE')
    op.execute('DROP TABLE IF EXISTS role_permissions CASCADE')
    op.execute('DROP TABLE IF EXISTS org_members CASCADE')
    op.execute('DROP TABLE IF EXISTS project_templates CASCADE')
    op.execute('DROP TABLE IF EXISTS users CASCADE')
    op.execute('DROP TABLE IF EXISTS roles CASCADE')
    op.execute('DROP TABLE IF EXISTS organizations CASCADE')

