# Projects

## Overview

Projects are the core of Friday. Each project is a self-contained workspace where your team plans, tracks, and delivers work. This guide covers everything you need to know about creating, configuring, and managing projects in Friday.

---

## Project Templates

When you create a new project, Friday offers five templates to give you a head start. Each template pre-configures issue types, workflows, views, and settings appropriate for a specific methodology or use case.

### Blank

The Blank template gives you an empty project with only the essentials: a single "Task" issue type and a minimal workflow (To Do, In Progress, Done). Use this when you want complete control over your project setup, or when your workflow does not fit neatly into one of the other templates.

**Includes:** Basic task tracking, Board view, Table view.

### Standard PM

The Standard PM template is the most versatile option. It works for a wide range of projects, from internal initiatives to cross-functional programs.

**Includes:** Three issue types (Task, Bug, Feature), a four-stage workflow (To Do, In Progress, In Review, Done), Kanban board, Table view, Timeline view, milestone tracking, and labels.

### Waterfall

The Waterfall template is designed for sequential, phase-based projects where work follows a predictable path from initiation through completion.

**Includes:** Phase-based milestones, gate approvals at phase boundaries, Gantt chart as the default view, deliverable tracking, dependency management, and a baseline comparison feature. Issue types include Task, Deliverable, and Milestone.

### Consulting

The Consulting template is tailored for client-facing engagements where time tracking, deliverable management, and stakeholder visibility are critical.

**Includes:** Time tracking enabled by default, deliverable issue type with client approval workflow, budget tracking, a client-friendly dashboard, and a Viewer role pre-configured for client stakeholders. Issue types include Task, Deliverable, and Meeting.

### Product

The Product template is built for agile product development teams. It supports Scrum out of the box with sprints, backlogs, and velocity tracking.

**Includes:** Sprint management, backlog with prioritization, story points, burndown charts, epics for grouping related work, and a retrospective document template. Issue types include Story, Task, Bug, and Epic.

---

## Creating a Project

### Using the Wizard

The most common way to create a project is through the five-step wizard. You can launch it from:

- The **Quick Actions** bar on the Home page
- The **New Project** button on the Projects page
- The Command Palette (**Ctrl+K**, then type "New Project")

The wizard walks you through Name and Key, Template Selection, Team Members, Milestones, and a final Review step. See the Getting Started guide for a detailed walkthrough of each step.

[Screenshot: New Project Button on Projects Page]

### From Document Import

If you have an existing project brief, statement of work, or requirements document, Friday can help you set up a project from it. Navigate to Projects, click **New Project**, and select the **Import from Document** option. Friday will parse the document to suggest a project name, milestones, and initial issues.

Supported formats include Markdown, Word documents, and PDF files.

---

## Project Dashboard

When you enter a project, the Dashboard is the first view you see. It provides a high-level overview of project health and progress at a glance.

[Screenshot: Project Dashboard]

### RAG Status

At the top of the dashboard, you will see the project's RAG (Red, Amber, Green) status indicator. This gives an immediate visual signal of project health:

- **Green** — The project is on track. Schedule, scope, and budget are within acceptable tolerances.
- **Amber** — The project has risks or minor issues that need attention. One or more areas may be slightly off track.
- **Red** — The project has significant problems. Immediate action is required to get back on track.

Project Managers can set the RAG status manually, or Friday can calculate it automatically based on schedule variance, overdue issues, and budget consumption.

### Progress Metrics

The dashboard displays key progress metrics in easy-to-read cards:

- **Issues Completed** — Percentage and count of issues in Done status
- **Story Points Delivered** — Total story points completed versus planned (if using agile)
- **Schedule Adherence** — Whether the project is ahead, on track, or behind schedule
- **Budget Consumed** — Percentage of budget used versus planned (if budget tracking is enabled)

### Milestone Timeline

A horizontal timeline shows all project milestones with their target dates. Completed milestones are marked with a check. Upcoming milestones show their due date and the number of open issues blocking them. Overdue milestones are highlighted in red.

### Budget Summary

If budget tracking is enabled for the project, a summary card shows:

- Total budget and amount consumed
- Burn rate (spend per week or month)
- Forecasted completion cost
- Variance from plan

### Activity Feed

The bottom of the dashboard contains a chronological feed of recent activity in the project. This includes issue updates, comments, document changes, member additions, and milestone completions. You can filter the feed by activity type.

---

## Managing Your Team

### Adding Members

To add members to a project, navigate to the **Members** section in the project sidebar. Click **Add Member** to search for users in your Organization. You can add multiple members at once.

If someone is not yet in your Organization, you can invite them by email. They will receive an invitation to join Friday and will be added to the project once they accept.

[Screenshot: Add Member Dialog]

### Assigning Roles

Each project member has a role that determines what they can see and do within the project. When adding a member, you select their role from the dropdown. You can change roles at any time from the Members page.

**Admin** — Full control over the project. Admins can modify all settings, delete the project, manage members, and perform any action. Assign this role to project managers and technical leads.

**Manager** — Can create, edit, and delete issues, milestones, and documents. Can assign work to team members and manage sprints. Cannot modify project settings or delete the project.

**Member** — Can create issues, update issues assigned to them, add comments, log time, and edit documents. This is the standard role for team contributors.

**Viewer** — Read-only access to all project content. Viewers can see issues, documents, dashboards, and reports but cannot make changes. Useful for stakeholders who need visibility without editing rights.

**Guest** — Limited read-only access. Guests can see the project dashboard and specific issues they are mentioned on, but cannot browse the full project. Useful for external clients or occasional reviewers.

### Setting Capacity

For each team member, you can set a capacity percentage that indicates how much of their time is allocated to this project. For example, a developer working on two projects might be set to 50% capacity on each.

Capacity settings are used by Friday's resource management and auto-scheduling features. Setting accurate capacity helps the system produce realistic schedules and highlights overallocation before it becomes a problem.

To set capacity, click the percentage value next to a member's name on the Members page and enter the new value.

---

## Project Settings

Project settings allow you to tailor Friday to your team's specific needs. Navigate to **Settings** within your project sidebar to access these options.

### General Settings

The General tab covers basic project information:

- **Project Name** and **Key** — Update the display name (the key cannot be changed after creation)
- **Description** — Update the project summary
- **RAG Status** — Set the current project health indicator
- **Visibility** — Control whether the project is visible to all Organization members or only to project members
- **Start Date** and **Target End Date** — Define the project timeline
- **Budget** — Set the project budget amount and currency

### Issue Types

Configure which issue types are available in the project. Friday supports standard types like Task, Bug, Feature, Story, Epic, and Deliverable. You can also create custom issue types specific to your project.

Each issue type has:

- A name and icon
- A color for visual identification
- A default workflow
- Required and optional fields

### Workflows

Workflows define the statuses an issue can move through and the allowed transitions between them. Each workflow has statuses organized into categories:

- **To Do** — Work not yet started
- **In Progress** — Work actively being done
- **In Review** — Work completed and awaiting review
- **Done** — Work finished and accepted
- **Blocked** — Work that cannot proceed

You can create custom statuses within each category and define which transitions are allowed. For example, you might require that issues move from In Progress to In Review before they can be marked Done.

[Screenshot: Workflow Editor]

### Custom Fields

Add custom fields to capture information specific to your project. See the Issues and Workflows guide for a full list of available field types.

### Labels

Create labels to categorize and filter issues. Labels have a name and a color. Common examples include "frontend," "backend," "design," "documentation," and "urgent."

### Components

Components represent distinct parts of your project, such as modules, subsystems, or functional areas. Assigning issues to components helps organize work and makes it easier to filter and report on specific areas.

### Versions

Versions represent releases, iterations, or deliverable versions. You can assign issues to a version to track what is included in each release. Each version has a name, optional description, start date, and release date.

---

## Archiving Projects

When a project is completed or no longer active, you can archive it to keep your project list clean while preserving all data.

### When to Archive

Consider archiving a project when:

- All milestones and issues are complete
- The project has been delivered to the client or stakeholder
- The project has been cancelled but you want to retain the history
- The project is on hold indefinitely

### How to Archive

Navigate to the project's **Settings > General** page. Scroll to the bottom and click **Archive Project**. Friday will ask you to confirm. Archived projects are removed from the main Projects list but can be found using the "Show Archived" filter.

All data in an archived project is preserved. Team members can still view archived projects in read-only mode.

### Unarchiving

To bring a project back to active status, find it in the Projects list with the "Show Archived" filter enabled. Open the project, go to **Settings > General**, and click **Unarchive Project**. The project will reappear in the active projects list and members will regain their normal editing permissions.

[Screenshot: Archive Project Confirmation]

---

## Tips for Project Success

- **Keep your dashboard current.** Update the RAG status weekly so stakeholders always have an accurate picture of project health.
- **Use templates wisely.** Start with the template closest to your methodology, then customize as needed. You can always add or remove features later.
- **Set capacity realistically.** Overallocating team members leads to missed deadlines. Use the Resources section to monitor workload across projects.
- **Archive completed projects promptly.** A clean project list helps everyone find what they need quickly.
- **Review settings during kickoff.** Spend a few minutes configuring workflows, issue types, and custom fields at the start of a project. Getting this right early saves time later.

---

## Next Steps

- **Learn about Issues and Workflows** to understand how work is tracked day to day
- **Explore the Planning guide** for milestones, sprints, roadmaps, and risk management
- **Visit the Resources section** to understand team capacity and workload management
