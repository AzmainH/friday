# Advanced Features

This guide covers Friday's automation engine, intake forms, approval workflows, integrations, AI features, command palette, recurring tasks, and SLA tracking.

---

## Automations

Automations let you eliminate repetitive manual work by creating rules that respond to events in your projects.

### How Automations Work

Every automation rule follows a three-part structure:

- **WHEN** -- The trigger event that starts the rule.
- **IF** -- An optional condition that must be true for the rule to proceed.
- **THEN** -- The action that Friday performs automatically.

### Creating an Automation Rule

1. Open a project and navigate to **Settings > Automations**.
2. Click **New Rule**.
3. Select a trigger from the WHEN dropdown.
4. Optionally add one or more conditions in the IF section.
5. Select an action from the THEN dropdown and configure its parameters.
6. Give the rule a descriptive name (e.g., "Auto-assign bug reports to QA lead").
7. Click **Save and Enable**.

[Screenshot: Automation rule builder]

### Available Triggers

| Trigger | Fires When |
|---------|------------|
| Status Changed | An issue moves to a specific status |
| Issue Created | A new issue is created in the project |
| Issue Assigned | An issue is assigned or reassigned |
| Label Added | A specific label is added to an issue |
| Due Date Approaching | An issue's due date is within a specified number of days |
| Comment Added | A comment is posted on an issue |
| Priority Changed | An issue's priority is updated |
| Sprint Started | A sprint begins |
| Sprint Ended | A sprint is completed |

### Available Conditions

Conditions let you filter which issues the rule applies to. You can combine multiple conditions with AND logic.

- Issue type equals (e.g., Bug, Task, Story)
- Priority equals or is above a threshold
- Assignee is or is not a specific person
- Label contains a specific value
- Issue is in a specific sprint
- Custom field matches a value

### Available Actions

| Action | What It Does |
|--------|--------------|
| Set Field | Change any issue field (status, priority, assignee, due date, etc.) |
| Add Label | Apply a label to the issue |
| Remove Label | Remove a label from the issue |
| Send Notification | Notify a specific person or role |
| Add Comment | Post an automated comment on the issue |
| Move to Sprint | Move the issue into a specified sprint |
| Create Sub-Issue | Automatically create a child issue |

### Example Rules

- WHEN status changes to "Done", THEN add label "Completed" and send notification to project manager.
- WHEN issue is created with type "Bug", IF priority is Critical, THEN assign to QA lead and add label "Urgent".
- WHEN due date is within 2 days, IF status is not "Done", THEN send notification to assignee.

---

## Intake Forms

Intake forms allow people outside your project team -- or even outside your organization -- to submit requests that automatically become triaged issues.

### Creating an Intake Form

1. Open a project and navigate to **Settings > Intake Forms**.
2. Click **New Form**.
3. Enter a form title and optional description that will appear at the top of the form.
4. Add fields to the form by clicking **Add Field**.

### Form Fields

Each field maps to an issue attribute. Available field types:

- **Short Text** -- Single-line text input (maps to issue title or a custom field).
- **Long Text** -- Multi-line text area (maps to issue description).
- **Dropdown** -- Select from predefined options (maps to priority, type, or custom field).
- **Email** -- Captures the requester's email address.
- **File Upload** -- Allows attachment of files up to 10 MB each.
- **Date** -- Date picker for requested deadlines.

Mark fields as required or optional. Drag fields to reorder them.

### Shareable Public URL

After saving the form, Friday generates a unique public URL. Share this link with anyone who needs to submit requests. No login is required to fill out the form.

Click **Copy Link** to copy the URL to your clipboard.

[Screenshot: Intake form with public URL]

### Rate Limiting

To prevent abuse, intake forms are rate-limited to 30 submissions per minute per form. Submissions that exceed this limit receive a friendly message asking the user to try again shortly.

### What Happens After Submission

When someone submits an intake form:

1. Friday creates a new issue in the project with the status "Triage".
2. The form fields populate the corresponding issue attributes.
3. The project's default automation rules (if any) apply to the new issue.
4. Project members with the appropriate notification settings are alerted.

---

## Approval Workflows

Approval workflows add formal sign-off steps to your issues, ensuring that work is reviewed before it progresses.

### Setting Up Approval Steps

1. Open an issue.
2. In the detail panel, click **Add Approval Step**.
3. Select the approver (a team member).
4. Optionally add a description of what is being approved.
5. Click **Add**.

You can add multiple approval steps to create a chain of approvals.

### Approve or Reject Flow

When an issue has pending approval steps:

- The designated approver receives a notification.
- The approver opens the issue and sees the approval request in the **Approvals** section.
- They click **Approve** or **Reject**.
- If rejected, they can add a comment explaining why.

### Blocking Status Transitions

Approval steps can be configured to block status transitions. For example, you can require that an issue cannot move from "In Review" to "Done" until all approval steps are approved.

If someone attempts to change the status while an approval is pending, Friday displays a message: "This issue requires approval before it can move to the next status."

[Screenshot: Approval step on an issue]

---

## Integrations

Friday connects with the tools your team already uses to keep everything in sync.

### GitHub Integration

Link your GitHub repositories to a Friday project to synchronize development activity.

**Setup:**

1. Navigate to **Settings > Integrations > GitHub**.
2. Click **Connect GitHub** and authorize Friday.
3. Select the repositories you want to link to this project.

**Features:**

- **Link repos** -- Associate one or more GitHub repositories with a Friday project.
- **Sync issues** -- Reference Friday issue numbers in commit messages or PR descriptions (e.g., "Fixes FRIDAY-42") to automatically link them.
- **Status updates** -- When a linked PR is merged, Friday can automatically move the associated issue to a configured status.

### Slack Integration

Send Friday notifications to Slack channels so your team stays informed without switching tools.

**Setup:**

1. Navigate to **Settings > Integrations > Slack**.
2. Click **Connect Slack** and authorize the Friday app in your Slack workspace.
3. Map Friday projects to Slack channels.

**Features:**

- Choose which events post to Slack: issue created, status changed, comment added, sprint started, or milestone reached.
- Notifications include a direct link back to the relevant item in Friday.

### Webhooks

For custom integrations, Friday supports outgoing webhooks that send HTTP callbacks to any URL you specify.

**Setup:**

1. Navigate to **Settings > Integrations > Webhooks**.
2. Click **New Webhook**.
3. Enter the target URL and select which events should trigger the webhook.
4. Optionally add a secret token for request verification.
5. Click **Save**.

Friday sends a JSON payload to your URL whenever the selected events occur. The payload includes the event type, timestamp, and the full object data.

[Screenshot: Webhook configuration]

---

## AI Features

Friday includes AI-powered capabilities to help teams work smarter.

### Issue Summarization

For long issues with extensive comment threads, click the **Summarize** button in the issue toolbar. Friday's AI reads the issue description and all comments, then generates a concise summary highlighting the key points, decisions, and open questions.

### Risk Prediction

On the Project Dashboard, the **AI Risk Insights** card highlights issues that the AI predicts are at risk of missing their due dates. Predictions are based on historical patterns including issue complexity, assignee workload, and past delivery performance.

### Smart Scheduling Suggestions

When planning a sprint, click **AI Suggest** in the sprint planning view. Friday analyzes team capacity, issue estimates, dependencies, and past velocity to recommend which issues to include in the sprint and flag potential over-commitments.

### Accessing AI Features

AI features are available in two ways:

- **AI Copilot Panel** -- Click the AI icon in the bottom-right corner of any page to open the copilot panel. Ask questions about your project data in natural language.
- **Issue Actions** -- Use the AI-related actions in the issue toolbar (Summarize, Predict Risk, Suggest Schedule).

[Screenshot: AI copilot panel]

---

## Command Palette

The command palette provides fast keyboard-driven navigation across Friday.

### Opening the Command Palette

Press **Ctrl+K** (or **Cmd+K** on Mac) from anywhere in the application.

### What You Can Do

- **Navigate** -- Type a project name, issue ID, or page title to jump directly to it.
- **Search** -- Search across all projects, issues, wiki pages, and team members.
- **Actions** -- Type commands like "Create issue", "Log time", or "New wiki page" to start actions without navigating through menus.
- **Recent items** -- The palette shows your recently visited items when first opened, so you can quickly return to where you were.

Start typing to filter results. Use arrow keys to navigate and Enter to select.

[Screenshot: Command palette with search results]

---

## Recurring Tasks

Recurring tasks automate the creation of issues on a schedule, useful for routine work like weekly reports, monthly reviews, or daily standups.

### Setting Up a Recurring Rule

1. Open a project and navigate to **Settings > Recurring Tasks**.
2. Click **New Recurring Task**.
3. Fill in the issue template: title, description, assignee, priority, labels, and estimated effort.
4. Set the recurrence schedule.
5. Click **Save**.

### Recurrence Schedules

| Schedule | Description |
|----------|-------------|
| Daily | Creates an issue every day (or every N days) |
| Weekly | Creates an issue on specified days of the week |
| Monthly | Creates an issue on a specific day of each month |
| Custom Cron | Define a cron expression for advanced schedules |

For custom cron expressions, Friday uses standard five-field cron syntax. A preview displays the next three scheduled dates so you can verify the pattern.

### How It Works

Friday's background worker checks recurring rules on a regular schedule. When a rule is due, it automatically creates a new issue in the project using the template you defined. The new issue includes a note indicating it was auto-created from a recurring rule.

[Screenshot: Recurring task configuration]

---

## SLA Tracking

SLA (Service Level Agreement) tracking helps teams ensure they meet response and resolution time commitments.

### Defining an SLA Policy

1. Open a project and navigate to **Settings > SLA Policies**.
2. Click **New Policy**.
3. Configure the policy parameters:
   - **Policy Name** -- A descriptive name (e.g., "Critical Bug SLA").
   - **Applies To** -- Filter by issue type, priority, or label.
   - **Response Time Target** -- Maximum time from issue creation to first response (comment or status change).
   - **Resolution Time Target** -- Maximum time from issue creation to reaching a "Done" status.
4. Click **Save**.

### Business Hours Configuration

SLA clocks can run on business hours instead of calendar hours. Configure business hours under **Settings > SLA Policies > Business Hours**.

- Set working days (e.g., Monday through Friday).
- Set working hours (e.g., 9:00 AM to 6:00 PM).
- Select a timezone.
- Add holidays when SLA clocks should pause.

When business hours are configured, SLA timers automatically pause outside working hours and on holidays.

### SLA Status on Issues

Issues covered by an SLA policy display an SLA badge in the issue list and detail view. The badge shows:

- **On Track** (green) -- Plenty of time remaining.
- **At Risk** (amber) -- Less than 25% of the target time remains.
- **Breached** (red) -- The target time has been exceeded.

[Screenshot: Issue list with SLA badges]

### Breach Notifications

When an SLA target is about to breach (at the 75% mark) or has breached, Friday sends notifications to:

- The issue assignee.
- The project manager.
- Any additional recipients configured in the SLA policy.

### SLA Compliance Report

Navigate to **Reports > SLA Compliance** to see aggregate SLA performance. The report shows the percentage of issues that met their response and resolution targets, broken down by time period, issue type, and priority. Use this data in stakeholder reviews to demonstrate service quality.

---

**Next Steps**

- Set up team collaboration with the [Collaboration Guide](collaboration.md).
- Track time and budgets with the [Tracking & Dashboards Guide](tracking.md).
- Configure organization settings in the [Administration Guide](administration.md).
