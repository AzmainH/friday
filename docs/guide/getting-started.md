# Getting Started with Friday

## Welcome to Friday

Friday is an enterprise project management platform designed to help teams plan, track, and deliver projects with confidence. Whether you are managing a single product backlog or coordinating complex cross-functional programs, Friday gives you the tools to stay organized, aligned, and on schedule.

Friday brings together issue tracking, Gantt scheduling, resource management, risk registers, roadmaps, and executive reporting in one unified workspace. It is built for teams that need structure without sacrificing flexibility.

This guide walks you through your first steps in Friday, from understanding how the application is organized to creating your first project.

---

## Understanding the Hierarchy

Friday organizes work into three levels. Understanding this hierarchy will help you navigate the application and set up your workspace effectively.

### Organization

The Organization is the top-level container. It represents your company or business unit. There is one Organization per Friday instance. Organization-level settings include:

- User management and role assignments
- Global permissions and security policies
- Billing and subscription details
- System-wide custom field definitions
- Default templates and workflows

Your Organization is managed by users with the System Admin role, typically IT administrators or PMO leads.

### Workspace

Workspaces sit inside the Organization and act as logical groupings for related projects. Think of a Workspace as a department, division, or program area. Examples might include:

- "Engineering" for all software development projects
- "Marketing Campaigns" for seasonal campaign projects
- "Client Delivery" for consulting engagements

Each Workspace has its own set of members and can define default settings that new projects within it will inherit.

### Project

A Project is where the actual work happens. Each Project lives inside a Workspace and contains issues, milestones, timelines, documents, and all the day-to-day tracking your team needs. Projects can use different methodologies (Kanban, Scrum, Waterfall) and have their own workflows, issue types, and custom fields.

The hierarchy looks like this:

**Organization > Workspace > Project > Issues, Milestones, Documents, etc.**

---

## Your Home Page

When you log in to Friday, the Home page is the first thing you see. It is your personal command center, designed to surface the information that matters most to you right now.

[Screenshot: Home Page Overview]

### Quick Actions

At the top of the Home page, you will find the Quick Actions bar. This gives you one-click access to the things you do most often:

- **New Issue** — Create an issue in any project you belong to
- **New Project** — Launch the project creation wizard
- **New Document** — Start a blank document in any project
- **Log Time** — Record a time entry against a recent issue

### My Issues

The My Issues widget shows all issues currently assigned to you, grouped by project. Each issue displays its status, priority, and due date. You can click any issue to open it directly, or use the status dropdown to update it without leaving the Home page.

Issues approaching their due date are highlighted to help you prioritize your day.

### Overdue Items

This widget pulls together everything that has slipped past its due date: issues, milestones, and deliverables. Items are sorted by how overdue they are, with the most urgent at the top. Each item includes a direct link so you can take action immediately.

### Recent Activity

The Recent Activity feed shows the latest updates across all your projects. This includes issue status changes, new comments, document edits, and team member additions. It is a quick way to stay informed about what your colleagues are working on without checking each project individually.

### Favorites

The Favorites widget gives you fast access to projects, issues, documents, or views that you have starred. To add something to your favorites, click the star icon that appears on projects, issues, and other items throughout the application.

---

## Creating Your First Project

Friday uses a guided five-step wizard to help you set up new projects. You can launch it from the Quick Actions bar on the Home page, or from the Projects section in the sidebar.

### Step 1: Name and Key

Give your project a name and a short key. The key is a unique identifier (for example, "WEB" or "MKT") that Friday uses as a prefix for all issues in the project. Issue keys look like WEB-101 or MKT-42.

- **Project Name** — A descriptive name your team will recognize
- **Project Key** — 2 to 5 uppercase letters, must be unique within the Workspace
- **Workspace** — Select which Workspace this project belongs to
- **Description** — An optional summary of the project's purpose

[Screenshot: Project Wizard Step 1]

### Step 2: Template Selection

Choose a template to pre-configure your project with appropriate workflows, issue types, and settings. Friday includes five built-in templates:

- **Blank** — A clean slate with minimal configuration. Best for teams that want to build their own workflow from scratch.
- **Standard PM** — A general-purpose template with common issue types (Task, Bug, Feature), a standard workflow (To Do, In Progress, In Review, Done), and a Kanban board. Good for most teams.
- **Waterfall** — Designed for sequential, phase-based projects. Includes phase milestones, gate approvals, and a Gantt-first layout. Ideal for construction, manufacturing, or regulated industries.
- **Consulting** — Tailored for client-facing engagements. Includes deliverable tracking, time logging defaults, and client-friendly reporting views.
- **Product** — Built for product development teams using agile methods. Includes sprints, a backlog, story points, epics, and a burndown chart.

You can customize any template after project creation, so do not worry about picking the perfect one right away.

### Step 3: Team Members

Add team members to the project. You can search for existing users in your Organization or invite new people by email. For each member, assign a project role:

- **Admin** — Full control over project settings and all content
- **Manager** — Can manage issues, milestones, and team assignments
- **Member** — Can create and update issues assigned to them
- **Viewer** — Read-only access to the project
- **Guest** — Limited read-only access, typically for external stakeholders

You can always adjust roles later in project settings.

### Step 4: Milestones

Set up your initial milestones. Milestones are key dates or deliverables that mark significant points in your project timeline. For each milestone, provide:

- A name (for example, "Phase 1 Complete" or "Beta Launch")
- A target date
- An optional description

If you are not ready to define milestones yet, you can skip this step and add them later.

### Step 5: Review

Review your project configuration. Friday shows a summary of everything you have set up: name, key, template, team members, and milestones. If anything looks off, you can go back to any previous step to make changes.

Click **Create Project** to finish. Friday will set up your project and take you directly to its dashboard.

[Screenshot: Project Wizard Review Step]

---

## Navigating Friday

Friday's navigation is designed to give you quick access to everything without getting lost. The sidebar on the left is your primary navigation tool.

### Primary Navigation

The sidebar contains seven primary navigation items that are always visible:

1. **Home** — Your personal dashboard with assigned issues, overdue items, and activity
2. **Projects** — Browse and manage all projects in your Workspace
3. **Planning** — Access roadmaps, scenario planning, and cross-project views
4. **Resources** — Team workload, capacity planning, and time tracking
5. **Executive** — High-level dashboards, portfolio health, and reports
6. **Knowledge** — Wiki, documents, and shared knowledge base
7. **Settings** — Organization, Workspace, and personal settings

### Project-Contextual Navigation

When you navigate into a specific project, the sidebar expands to show project-specific items. These include:

- **Dashboard** — Project overview with status, progress, and activity
- **Board** — Kanban board view of issues
- **Table** — Spreadsheet-style issue list
- **Timeline** — Gantt chart view
- **Backlog** — Unscheduled issues and sprint planning
- **Sprints** — Active and past sprints with burndown
- **Milestones** — Key dates and deliverables
- **Roadmap** — Project-level roadmap
- **Documents** — Project wiki and files
- **Time Tracking** — Time entries and reports
- **Risks** — Risk register and heat map
- **Reports** — Project-specific reports
- **Members** — Team and role management
- **Settings** — Project configuration

And several more depending on the template and features enabled.

### Collapsible Sidebar

If you need more screen space, click the collapse button at the bottom of the sidebar to minimize it to icons only. Click again to expand. The sidebar state is remembered across sessions.

[Screenshot: Sidebar Navigation]

---

## Keyboard Shortcuts

Friday supports keyboard shortcuts to help you work faster.

### Command Palette

Press **Ctrl+K** (or **Cmd+K** on Mac) to open the Command Palette. This is the fastest way to navigate Friday. From the palette you can:

- Search for any project, issue, or document by name or key
- Jump to any page in the application
- Execute common actions like creating an issue or switching projects
- Search for team members

Start typing and Friday will show matching results instantly.

### Shortcuts Help

Press **?** from any page to open the keyboard shortcuts reference panel. This shows all available shortcuts for the current context.

### Common Shortcuts

- **Ctrl+K** — Open Command Palette
- **?** — Show keyboard shortcuts
- **N** — New issue (when on a project page)
- **B** — Switch to Board view
- **T** — Switch to Table view
- **G** — Switch to Timeline (Gantt) view

---

## Dark and Light Mode

Friday supports both dark and light themes. By default, the application uses dark mode, which is easier on the eyes during long working sessions.

To toggle between themes, use the theme switch in the top bar. Your preference is saved to your profile and persists across sessions and devices.

Both themes are fully supported across all views and components, so choose whichever is most comfortable for you.

[Screenshot: Theme Toggle in Top Bar]

---

## Next Steps

Now that you are familiar with the basics, here are some recommended next steps:

- **Create your first project** using the wizard described above
- **Explore the Projects guide** to learn about dashboards, team management, and settings
- **Read the Issues and Workflows guide** to understand how to create, track, and manage work
- **Check out the Planning guide** for milestones, roadmaps, sprints, and risk management

Welcome to Friday. Let us get to work.
