# Issues and Workflows

## Overview

Issues are the fundamental unit of work in Friday. Every task, bug, feature request, and deliverable is tracked as an issue. This guide covers how to create, manage, and organize issues, as well as how to configure workflows and use Friday's powerful views to stay on top of your work.

---

## Creating Issues

### Full Create Form

To create a new issue, click the **New Issue** button in the project sidebar or use the keyboard shortcut **N** while inside a project. The full create form opens as a panel and includes all available fields.

At minimum, you need to provide:

- **Summary** — A clear, concise title for the issue
- **Issue Type** — The kind of work (Task, Bug, Feature, Story, etc.)

All other fields are optional at creation time and can be filled in later. The form remembers your most recently used project and issue type to speed up repeat entries.

[Screenshot: Full Issue Create Form]

### Quick Create from Board

When working in the Board view, you can create issues directly in a specific status column. Click the **+** button at the bottom of any column to open an inline create form. Type a summary and press Enter. The issue is created immediately in the status that column represents.

Quick create is perfect for capturing ideas during standup meetings or brainstorming sessions when speed matters more than detail.

---

## Issue Fields

Every issue in Friday has a set of standard fields. Depending on your project configuration, you may also see custom fields.

### Summary

The issue title. Keep it short and descriptive. Good summaries describe what needs to happen: "Add email validation to signup form" is better than "Signup issue."

### Type

The issue type categorizes the kind of work. Default types include:

- **Task** — A unit of work that needs to be completed
- **Bug** — A defect or error that needs to be fixed
- **Feature** — A new capability or enhancement
- **Story** — A user-facing feature described from the user's perspective (agile projects)
- **Epic** — A large body of work that can be broken into smaller issues

Your project may have additional custom issue types configured by your project admin.

### Status

The current state of the issue within the project workflow. See the Workflows section below for details.

### Priority

How urgent or important the issue is. Friday uses four priority levels:

- **Critical** — Must be resolved immediately. Blocks other work or affects production systems.
- **High** — Should be resolved soon. Important for the current milestone or sprint.
- **Medium** — Normal priority. Should be completed within the planned timeframe.
- **Low** — Nice to have. Can be deferred if higher-priority work needs attention.

Priority is displayed with a colored indicator throughout the application, making it easy to spot urgent items at a glance.

### Assignee

The team member responsible for completing the issue. Each issue can have one assignee. If work is shared, consider breaking the issue into subtasks with different assignees.

### Labels

Tags that help categorize and filter issues. Labels are defined at the project level and can represent anything: technology area, team, work type, or department. An issue can have multiple labels.

### Components

The part of the project this issue relates to. Components help organize large projects into functional areas. For example, a web application project might have components for "Frontend," "Backend," "Database," and "API."

### Version

The release or iteration this issue is targeted for. Assigning issues to versions helps you track what will ship in each release.

### Milestone

The milestone this issue contributes to. Milestones represent key project dates or deliverables. Linking issues to milestones helps track progress toward important deadlines.

### Start Date and Due Date

Optional date fields that define when work on the issue should begin and when it should be completed. These dates are used in the Timeline view and by the auto-scheduling engine.

### Story Points

A relative estimate of effort, commonly used in agile projects. Story points help teams plan sprints and measure velocity. Typical scales include Fibonacci (1, 2, 3, 5, 8, 13, 21) or T-shirt sizes (S, M, L, XL).

### Percent Complete

A numeric field from 0 to 100 representing how much of the work is done. This is particularly useful in Waterfall or hybrid projects where partial completion is meaningful.

### Description

A rich text field for detailed information about the issue. The description editor supports:

- Headings, bold, italic, and strikethrough
- Bulleted and numbered lists
- Tables
- Links and embedded images
- Mentions of team members using @name
- References to other issues using the issue key (e.g., WEB-42)
- File attachments

[Screenshot: Rich Text Description Editor]

---

## Custom Fields

When standard fields are not enough, custom fields let you capture project-specific data on every issue.

### Available Field Types

Friday supports a wide range of custom field types:

- **Text** — A single-line text input for short values
- **Text Area** — A multi-line text input for longer content
- **Number** — A numeric value, with optional min/max constraints
- **Date** — A date picker
- **Date Time** — A date and time picker
- **Select** — A dropdown with predefined options (choose one)
- **Multi-Select** — A dropdown where multiple options can be selected
- **Checkbox** — A simple yes/no toggle
- **URL** — A validated web address
- **Email** — A validated email address
- **Phone** — A phone number field
- **Currency** — A numeric value with currency symbol
- **Percentage** — A numeric value displayed as a percentage
- **User** — A reference to a team member
- **Rating** — A star rating (1 to 5)

### Configuring Custom Fields

Project Admins can add custom fields from **Project Settings > Custom Fields**. When creating a custom field, you specify:

- The field name
- The field type
- Whether it is required or optional
- A default value (optional)
- For Select and Multi-Select types, the list of available options

Custom fields appear on the issue create and edit forms alongside standard fields. They are also available as columns in the Table view and as filter criteria.

---

## Workflows

Workflows define the lifecycle of an issue, from creation through completion. Each workflow consists of statuses organized into categories and transitions that control how issues move between statuses.

### Status Categories

Friday organizes statuses into five categories. Each category has a meaning that drives behavior throughout the application:

**To Do** — The issue has been created but work has not started. Issues in this category are included in backlog counts and are available for sprint planning.

**In Progress** — The issue is actively being worked on. Issues in this category count toward work-in-progress limits and appear in active sprint metrics.

**In Review** — The work is done and is waiting for review or approval. This category is useful for teams with code review, QA, or stakeholder approval steps.

**Done** — The issue is complete. Issues in this category are excluded from active work counts and contribute to completion metrics.

**Blocked** — The issue cannot proceed due to a dependency, external factor, or decision that needs to be made. Blocked issues are highlighted on the Board view to draw attention.

### Transitions

Transitions define which status changes are allowed. For example, you might configure your workflow so that:

- Issues can move from To Do to In Progress (starting work)
- Issues can move from In Progress to In Review (submitting for review)
- Issues can move from In Review to Done (approved) or back to In Progress (needs changes)
- Any issue can move to Blocked from any status
- Blocked issues can return to their previous status

Transitions help enforce your team's process and prevent issues from skipping important steps.

### Customizing Workflows

To customize a workflow, go to **Project Settings > Workflows**. You can:

- Add new statuses within any category
- Remove statuses that your team does not use
- Define or restrict transitions between statuses
- Set a default status for new issues (typically the first To Do status)

[Screenshot: Workflow Configuration]

---

## Board View (Kanban)

The Board view displays your issues as cards organized into columns by status. It provides a visual overview of work in progress and makes it easy to update issues by dragging and dropping.

### Columns

Each column represents a status in your workflow. Columns are arranged left to right following the natural progression from To Do through Done. The number of issues in each column is displayed in the column header.

### Drag-and-Drop

To change an issue's status, simply drag its card from one column to another. The status updates automatically. This is the fastest way to move issues through your workflow during standups or daily work.

### Swimlanes

You can group cards into horizontal swimlanes based on different criteria:

- **Assignee** — One row per team member, making it easy to see who is working on what
- **Priority** — Rows for Critical, High, Medium, and Low
- **Issue Type** — Rows for each type of work
- **None** — A flat list with no grouping

Switch swimlanes using the dropdown in the Board view toolbar.

[Screenshot: Board View with Swimlanes]

---

## Table View

The Table view presents issues in a spreadsheet-style layout with rows and columns. It is ideal for working with many issues at once and for teams that prefer a structured, data-dense format.

### Inline Editing

Most fields can be edited directly in the table. Click on any cell to modify its value. Changes are saved automatically. This makes bulk updates fast and intuitive.

### Column Configuration

Customize which columns are visible by clicking the **Columns** button in the toolbar. You can show or hide any standard or custom field. Drag column headers to reorder them. Column widths are adjustable.

Your column configuration is saved per user, so each team member can set up the Table view to suit their needs.

### Bulk Actions

Select multiple issues using the checkboxes in the first column, then use the bulk action bar that appears at the top of the table. Available bulk actions include:

- **Change Status** — Move all selected issues to a new status
- **Assign** — Set the assignee for all selected issues
- **Add Labels** — Apply one or more labels to all selected issues
- **Set Priority** — Change the priority of all selected issues
- **Set Milestone** — Assign all selected issues to a milestone
- **Delete** — Remove all selected issues (requires confirmation)

[Screenshot: Table View with Bulk Action Bar]

---

## Timeline View (Gantt)

The Timeline view displays issues on a Gantt chart, showing start dates, due dates, and dependencies. It is the primary view for schedule-driven projects.

### Dependencies

You can create dependencies between issues to indicate that one must finish before another can start. On the Gantt chart, dependencies are shown as arrows connecting issue bars.

To add a dependency, click on an issue bar and drag the connector to the dependent issue. You can also set dependencies from the issue detail page under the **Dependencies** section.

Friday supports four dependency types:

- Finish to Start (most common) — Issue B cannot start until Issue A finishes
- Start to Start — Issue B cannot start until Issue A starts
- Finish to Finish — Issue B cannot finish until Issue A finishes
- Start to Finish — Issue B cannot finish until Issue A starts

### Date Ranges

Each issue bar spans from its start date to its due date. If only a due date is set, the bar appears as a single point. Issues without dates are shown in a separate list below the chart.

### Critical Path

Friday can calculate and highlight the critical path, which is the longest chain of dependent issues that determines the earliest possible project completion date. Any delay in a critical path issue will delay the entire project. Enable critical path highlighting from the Timeline toolbar.

[Screenshot: Timeline View with Dependencies]

---

## Filtering and Sorting

Friday provides powerful filtering and sorting tools across all views.

### Filtering

Use the filter bar at the top of any view to narrow down the issues displayed. You can filter by:

- **Status** — Show only issues in specific statuses or status categories
- **Issue Type** — Show only specific types of work
- **Assignee** — Show issues assigned to specific people, or unassigned issues
- **Priority** — Show only issues at certain priority levels
- **Milestone** — Show issues linked to a specific milestone
- **Labels** — Show issues with specific labels
- **Components** — Show issues in specific components
- **Version** — Show issues targeted for a specific release
- **Date Range** — Show issues with start or due dates within a range
- **Custom Fields** — Filter on any custom field value

Multiple filters can be combined. For example, show all High-priority Bugs assigned to you that are In Progress.

### Sorting

Click any column header in the Table view to sort by that field. Click again to reverse the sort order. You can also sort from the toolbar in Board and Timeline views.

### Saved Views

After configuring filters and sort orders, you can save the view for quick access later. Click **Save View** in the toolbar, give it a name, and it will appear in your project sidebar. Saved views can be private (visible only to you) or shared with the team.

---

## Issue Detail

Click on any issue from any view to open its detail page. The detail page shows all information about the issue and provides tools for collaboration.

### Description Editor

The description area uses a full rich text editor. See the Description section under Issue Fields above for supported formatting options.

### Comments

The comments section sits below the description. Team members can add comments to discuss the issue, ask questions, or provide updates. Comments support the same rich text formatting as descriptions.

Use **@mentions** to notify specific team members. Type @ followed by their name, and they will receive a notification. You can also reference other issues by typing the issue key (e.g., WEB-42), which creates a clickable link.

### Activity Log

The activity log shows a chronological history of every change made to the issue: status updates, field changes, assignee changes, and more. Each entry shows who made the change and when. This provides a complete audit trail.

### Time Entries

If time tracking is enabled, the Time Entries section shows all time logged against this issue. You can add new time entries with a date, duration, and optional description.

### Linked Issues

You can link related issues together to show relationships. Link types include:

- **Blocks / Is blocked by** — Dependency relationships
- **Relates to** — General association
- **Duplicates / Is duplicated by** — Duplicate issue tracking
- **Parent / Child** — Hierarchy relationships

### Child Issues and Subtasks

Break large issues into smaller pieces by creating child issues (subtasks). The parent issue displays a progress bar showing how many children are complete. Child issues inherit the parent's project and can have their own assignee, status, and fields.

[Screenshot: Issue Detail Page]

---

## Bulk Operations

When you need to update many issues at once, Friday's bulk operations save significant time.

### Selecting Multiple Issues

In the Table view, use the checkboxes in the first column to select individual issues. Use the checkbox in the header row to select all visible issues on the current page. Hold Shift and click to select a range.

In the Board view, hold Ctrl (or Cmd on Mac) and click multiple cards to select them.

### Available Bulk Actions

Once multiple issues are selected, the bulk action bar appears:

- **Change Status** — Transition all selected issues to a chosen status
- **Assign** — Set a single assignee for all selected issues
- **Add Labels** — Apply labels to all selected issues without removing existing labels
- **Remove Labels** — Remove specific labels from all selected issues
- **Set Priority** — Change priority for all selected issues
- **Set Milestone** — Assign a milestone to all selected issues
- **Move to Sprint** — Add all selected issues to a sprint
- **Delete** — Permanently remove all selected issues (requires confirmation)

Bulk operations respect workflow rules. If a transition is not allowed for a particular issue, that issue will be skipped and you will see a notification explaining why.

---

## Tips for Effective Issue Management

- **Write clear summaries.** A good summary tells the reader what needs to happen without opening the issue. Front-load the important words.
- **Use priority consistently.** Agree as a team on what each priority level means. If everything is Critical, nothing is.
- **Keep descriptions up to date.** As requirements evolve, update the description rather than burying changes in comments.
- **Link related issues.** Dependencies and relationships help everyone understand how work connects.
- **Use bulk operations for grooming.** During backlog grooming or sprint planning, bulk operations let you triage quickly.
- **Save your views.** If you find yourself applying the same filters repeatedly, save the view.

---

## Next Steps

- **Explore the Planning guide** to learn about milestones, sprints, roadmaps, and scheduling
- **Visit the Projects guide** to understand dashboards, team management, and settings
- **Try the Board, Table, and Timeline views** in your project to find the one that works best for your team
