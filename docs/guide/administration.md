# Administration Guide

This guide covers Friday's administration features: organization settings, workspace management, user management, roles and permissions, import/export tools, and project templates.

---

## Organization Settings

The organization is the top-level entity in Friday. All workspaces, projects, users, and data belong to a single organization.

### Accessing Organization Settings

1. Click **Settings** in the left navigation.
2. Select **Organization** from the settings menu.

### Configurable Settings

- **Organization Name** -- The display name shown in the application header and emails.
- **Organization Logo** -- Upload a logo that appears in the top-left corner and on exported reports.
- **Default Timezone** -- The fallback timezone used when a user has not set a personal timezone.
- **Date Format** -- Choose how dates are displayed across the application (e.g., MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD).
- **Fiscal Year Start** -- Set the month your fiscal year begins, which affects budget and reporting periods.

Click **Save** after making changes.

[Screenshot: Organization settings page]

---

## Workspace Management

Workspaces let you organize projects into logical groups -- by department, team, product line, or however your organization is structured.

### Creating a Workspace

1. Navigate to **Settings > Workspaces**.
2. Click **New Workspace**.
3. Enter a workspace name and optional description.
4. Click **Create**.

The workspace is now available in the left navigation under **Projects**, where projects are grouped by workspace.

### Managing Workspace Members

1. Open a workspace by clicking its name in **Settings > Workspaces**.
2. Click the **Members** tab.
3. Click **Add Member** to invite users to the workspace.
4. Select a user and assign them a workspace role (Workspace Admin or Workspace Member).
5. Click **Add**.

To remove a member, click the three-dot menu next to their name and select **Remove from Workspace**.

[Screenshot: Workspace members list]

### Workspace Settings

Each workspace has its own settings accessible from the workspace detail page:

- **Name and description** -- Update the workspace identity.
- **Default project settings** -- Set defaults that apply to new projects created within this workspace (e.g., default issue types, workflows).
- **Archive** -- Archive a workspace to hide it from active navigation without deleting its data.

---

## User Management

### Adding Users

1. Navigate to **Settings > Users**.
2. Click **Invite User**.
3. Enter the user's email address.
4. Select their organization role (Org Admin or Org Member).
5. Click **Send Invite**.

The invited user receives an email with a link to set up their account. Until they accept, they appear in the user list with a "Pending" status.

You can invite multiple users at once by entering email addresses separated by commas.

### User Profiles

Each user has a profile accessible from **Settings > Users** (for admins) or by clicking their avatar and selecting **Profile** (for the user themselves).

Profile fields include:

- **Display Name** -- The name shown throughout the application.
- **Email** -- The user's login email.
- **Avatar** -- Upload a profile picture.
- **Job Title** -- Shown on team views and stakeholder lists.
- **Department** -- Used for resource planning and reporting filters.
- **Phone** -- Optional contact number.

### Timezone Settings

Each user can set their personal timezone under their profile. This affects:

- How dates and times are displayed throughout the application.
- SLA business hours calculations for issues assigned to them.
- Notification delivery timing when quiet hours are configured.

To set your timezone, click your avatar in the top-right corner, select **Profile**, and choose your timezone from the dropdown.

[Screenshot: User profile with timezone setting]

---

## Roles and Permissions

Friday uses a hierarchical role system with nine built-in roles. Roles are assigned at three levels: organization, workspace, and project.

### The Nine System Roles

**Organization-Level Roles**

| Role | Description |
|------|-------------|
| Org Admin | Full control over the entire organization. Can manage all settings, workspaces, projects, and users. Can assign any role to any user. Has access to billing and integrations. |
| Org Member | Can access workspaces and projects they are a member of. Cannot change organization settings or manage users at the organization level. |

**Workspace-Level Roles**

| Role | Description |
|------|-------------|
| Workspace Admin | Full control within a specific workspace. Can create and configure projects, manage workspace members, and adjust workspace settings. |
| Workspace Member | Can access projects within the workspace that they are a member of. Cannot create new projects or change workspace settings. |

**Project-Level Roles**

| Role | Description |
|------|-------------|
| Project Admin | Full control within a specific project. Can configure project settings, manage members, create and delete issues, sprints, milestones, and wiki pages. Can set up automations, SLAs, and integrations at the project level. |
| Project Manager | Can manage issues, sprints, milestones, and team assignments. Can view and edit project settings but cannot delete the project or remove admins. Can manage budgets and resource allocation. |
| Project Member | Can create and edit issues, log time, add comments, and contribute to wiki pages. Cannot change project settings or manage other members. |
| Project Viewer | Read-only access to the project. Can view issues, dashboards, wiki pages, and reports, but cannot create or modify anything. Useful for stakeholders who need visibility without edit access. |
| Project Guest | Limited read-only access. Can view specific issues they are explicitly granted access to, but cannot browse the full project. Useful for external collaborators or clients who need to see only their relevant items. |

### What Each Role Can Do

The following table summarizes key actions by role. A checkmark means the role can perform the action.

| Action | Org Admin | Org Member | WS Admin | WS Member | Proj Admin | Proj Manager | Proj Member | Proj Viewer | Proj Guest |
|--------|-----------|------------|----------|-----------|------------|--------------|-------------|-------------|------------|
| Manage org settings | Yes | -- | -- | -- | -- | -- | -- | -- | -- |
| Invite users to org | Yes | -- | -- | -- | -- | -- | -- | -- | -- |
| Create workspaces | Yes | -- | -- | -- | -- | -- | -- | -- | -- |
| Manage workspace members | Yes | -- | Yes | -- | -- | -- | -- | -- | -- |
| Create projects | Yes | -- | Yes | -- | -- | -- | -- | -- | -- |
| Configure project settings | Yes | -- | Yes | -- | Yes | -- | -- | -- | -- |
| Manage project members | Yes | -- | Yes | -- | Yes | -- | -- | -- | -- |
| Create/edit issues | Yes | Yes | Yes | Yes | Yes | Yes | Yes | -- | -- |
| View issues | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Limited |
| Log time | Yes | Yes | Yes | Yes | Yes | Yes | Yes | -- | -- |
| Add comments | Yes | Yes | Yes | Yes | Yes | Yes | Yes | -- | -- |
| Manage sprints | Yes | -- | Yes | -- | Yes | Yes | -- | -- | -- |
| Manage budgets | Yes | -- | Yes | -- | Yes | Yes | -- | -- | -- |
| View reports | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | -- |
| Edit wiki pages | Yes | Yes | Yes | Yes | Yes | Yes | Yes | -- | -- |
| Configure automations | Yes | -- | Yes | -- | Yes | -- | -- | -- | -- |
| Set up integrations | Yes | -- | -- | -- | Yes | -- | -- | -- | -- |

---

## Permission Hierarchy

Permissions in Friday follow a cascading model: organization, then workspace, then project. Higher-level roles grant baseline access, and lower-level roles can add (but never subtract) permissions.

### How Inheritance Works

- An **Org Admin** automatically has full access to every workspace and every project in the organization, without needing to be explicitly added as a member.
- An **Org Member** can see workspaces and projects they belong to. Within those, their effective permissions are determined by their workspace or project role.
- A **Workspace Admin** has full access to all projects within that workspace.
- A **Workspace Member** can access projects they are specifically added to, with the project-level role they are assigned.

### Practical Examples

**Scenario 1:** Sarah is an Org Admin. She can view and manage every workspace and project without any additional role assignments.

**Scenario 2:** James is an Org Member and a Workspace Admin for the "Engineering" workspace. He has full control over all projects in Engineering but cannot see projects in the "Marketing" workspace unless he is added there.

**Scenario 3:** Priya is an Org Member, a Workspace Member of "Product", and a Project Viewer on the "Q1 Roadmap" project. She can see the Q1 Roadmap project in read-only mode. She cannot edit issues in that project even though she is a Workspace Member, because her project-level role is Viewer.

### Role Assignment

Roles are assigned by users who have management permissions at the relevant level:

- Org Admins assign organization roles.
- Workspace Admins (and Org Admins) assign workspace roles.
- Project Admins (and Workspace/Org Admins) assign project roles.

[Screenshot: Member role assignment dialog]

---

## Import and Export

Friday provides tools to bring data in from other systems and export your data for external use.

### CSV Import Wizard

The CSV import wizard lets you bulk-create issues from a spreadsheet.

**Step 1: Upload**

1. Navigate to a project and go to **Settings > Import**.
2. Click **Import CSV**.
3. Select or drag-and-drop your CSV file.

**Step 2: Preview**

Friday shows a preview of the first ten rows of your file so you can verify the data looks correct.

**Step 3: Column Mapping**

Map each column in your CSV to a Friday issue field. Friday attempts to auto-detect mappings based on column headers, but you can adjust them manually.

Available target fields: Title, Description, Status, Priority, Assignee, Issue Type, Due Date, Estimated Hours, Labels, and any custom fields configured in the project.

**Step 4: Validation**

Friday validates the mapped data and highlights any rows with errors (e.g., invalid dates, unrecognized assignees, missing required fields). You can fix errors in the preview or skip problematic rows.

**Step 5: Import**

Click **Import** to create the issues. A progress bar shows the import status. When complete, Friday reports how many issues were created and how many rows were skipped.

[Screenshot: CSV import column mapping step]

### CSV Export

Export issues from any project by navigating to the issue list, applying your desired filters, and clicking **Export > CSV**. The exported file includes all visible columns.

From the Portfolio Dashboard, you can also export the multi-project overview table as CSV.

### Jira Import

Friday supports importing data from Jira to make migration straightforward.

1. Navigate to **Settings > Import > Jira**.
2. Upload your Jira export file (XML or JSON format, exported from Jira's backup or issue export tool).
3. Friday parses the file and shows a summary of what will be imported: projects, issues, comments, attachments, and users.
4. Map Jira statuses and issue types to their Friday equivalents.
5. Click **Import** to begin.

Large imports run as a background task. You will receive a notification when the import is complete.

### Full Project JSON Export

For backup or migration purposes, you can export an entire project as a JSON file.

1. Navigate to the project's **Settings > Export**.
2. Click **Export Project JSON**.
3. Friday generates a JSON file containing all project data: settings, issues, comments, attachments (as URLs), wiki pages, sprints, milestones, and member roles.
4. Download the file when the export is ready.

This export can be used to restore a project or transfer it to another Friday instance.

---

## Project Templates

Templates help teams start new projects quickly with pre-configured issue types, workflows, milestones, and settings.

### Using Built-In Templates

When creating a new project:

1. Navigate to **Projects** and click **New Project**.
2. In the creation dialog, select a template from the **Template** dropdown.
3. Available built-in templates include:
   - **Blank** -- An empty project with default settings.
   - **Software Development** -- Pre-configured with issue types (Story, Bug, Task, Epic), a Kanban workflow (Backlog, To Do, In Progress, In Review, Done), and sprint support.
   - **Product Launch** -- Includes milestones for Alpha, Beta, and GA, with issue types tailored to launch tasks.
   - **Service Desk** -- Configured with SLA policies, intake forms, and a triage workflow.
   - **Marketing Campaign** -- Includes milestones for planning, execution, and review phases.
4. Enter the project name and other details.
5. Click **Create**.

[Screenshot: New project dialog with template selection]

### How Templates Seed Projects

When you select a template, Friday automatically creates:

- **Issue Types** -- The set of issue types appropriate for the template (e.g., Bug, Story, Task for Software Development).
- **Workflows** -- Status definitions and allowed transitions. Each issue type can have its own workflow or share a common one.
- **Milestones** -- Pre-defined milestones with placeholder dates that you can adjust after project creation.
- **Labels** -- A starter set of labels relevant to the project type.
- **SLA Policies** -- For templates that include SLA tracking (such as Service Desk), policies are pre-configured with sensible defaults.
- **Automations** -- Some templates include starter automation rules (e.g., auto-assign triaged issues in Service Desk).

You can modify any of these after the project is created. Templates are a starting point, not a constraint.

### Customizing After Creation

After creating a project from a template, review the seeded configuration under **Project Settings**:

- Adjust milestone dates to match your actual timeline.
- Add or remove issue types as needed.
- Modify workflow transitions to match your team's process.
- Update automation rules or create new ones.
- Configure integrations specific to this project.

---

**Next Steps**

- Start tracking time and budgets with the [Tracking & Dashboards Guide](tracking.md).
- Set up team collaboration with the [Collaboration Guide](collaboration.md).
- Explore automation and integrations with the [Advanced Features Guide](advanced.md).
