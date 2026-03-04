# Tracking, Dashboards & Reports

This guide covers how to track time and budgets, use the built-in dashboards, generate reports, and plan resource capacity in Friday.

---

## Time Tracking

Friday lets every team member log time directly against issues so project managers always have accurate effort data.

### Logging Time on an Issue

1. Open any issue from your project board or backlog.
2. In the right-hand detail panel, find the **Time Tracking** section.
3. Click **Log Time**.
4. Enter the hours spent, the date the work was performed, and an optional description of what you did.
5. Click **Save**.

The logged entry appears in the issue's activity timeline and is immediately reflected in time reports.

[Screenshot: Log Time dialog on an issue]

### Weekly Timesheet View

For a more structured approach, navigate to **Resources > Timesheet**.

- The timesheet displays the current week with one column per day.
- Each row represents an issue you have logged time against (or that is assigned to you).
- Type hours directly into any cell to log time.
- Use the arrow buttons at the top to move between weeks.
- The bottom row shows daily totals and a weekly total.

[Screenshot: Weekly timesheet grid]

### Time Reports

To review logged time across the team, go to **Reports > Time Logged**. You can filter by project, team member, date range, and issue type. The report shows a breakdown table and a stacked bar chart of hours per day. Export the data as CSV or PDF using the buttons in the top-right corner.

---

## Budget Management

Friday provides project-level budget tracking so you can monitor spend against plan in real time.

### Setting a Project Budget

1. Navigate to **Projects** and open the project you want to configure.
2. Go to **Settings > Budget**.
3. Enter the total budget amount and select the currency.
4. Optionally set a start and end date for the budget period.
5. Click **Save**.

### Recording Cost Entries

Cost entries can be created manually or derived from logged time (using each member's cost rate, configured under **Resources > Team > Cost Rates**).

To add a manual cost entry:

1. Open the project and go to the **Budget** tab.
2. Click **Add Cost Entry**.
3. Fill in the amount, category (Labor, Software, Hardware, Travel, Other), date, and description.
4. Click **Save**.

### Burn Chart

The **Budget Burn Chart** is displayed at the top of the Budget tab. It plots cumulative actual spend against the planned budget line over time. A steeper actual line means you are spending faster than planned.

[Screenshot: Budget burn chart]

### Threshold Alerts

Friday automatically monitors budget consumption and sends notifications at three levels:

- **80%** -- An amber warning is shown on the project dashboard and a notification is sent to the project manager.
- **90%** -- A red warning appears and notifications go to the project manager and project admin.
- **100%** -- The budget is flagged as exceeded. The project's RAG status for budget automatically turns red.

You can customize these thresholds under **Project Settings > Budget > Alert Thresholds**.

---

## Personal Dashboard

Your Personal Dashboard is the first thing you see when you open Friday. It is designed to answer the question: "What should I work on right now?"

Access it from **Home** in the left navigation.

[Screenshot: Personal Dashboard]

### My Open Issues

A list of all issues currently assigned to you, grouped by project. Each card shows the issue title, priority, status, and due date. Click any issue to open it.

### Overdue Items

Issues past their due date are highlighted in red at the top of the dashboard. These demand immediate attention.

### Recently Assigned

A feed of issues that were assigned to you in the last seven days, so you never miss new work.

### Activity Feed

A chronological stream of recent activity on issues you are involved in -- comments, status changes, attachments, and time logged by collaborators.

---

## Project Dashboard

Each project has a dedicated dashboard that provides a health overview at a glance. Open any project and click **Dashboard** in the project navigation.

[Screenshot: Project Dashboard]

### RAG Status

The top of the dashboard displays a RAG (Red/Amber/Green) status indicator for three dimensions: **Schedule**, **Budget**, and **Scope**. Project managers can set these manually, or Friday can calculate them automatically based on milestone dates, budget burn, and issue completion rates.

### Progress Metrics

Key numbers are shown in summary cards: total issues, completed issues, completion percentage, and average cycle time.

### Milestone Timeline

A horizontal timeline shows upcoming milestones with their target dates. Milestones that are on track appear in green; those at risk appear in amber; overdue milestones appear in red.

### Burn-Up Chart

The burn-up chart plots the total scope (top line) and completed work (rising line) over time. When the two lines converge, the project is approaching completion. A widening gap indicates scope is growing faster than delivery.

### Budget Overview

A compact budget summary card shows total budget, amount spent, percentage consumed, and the current burn rate. Click the card to drill into the full Budget tab.

---

## Portfolio Dashboard

The Portfolio Dashboard gives leadership a single view across all active projects. Navigate to **Executive > Portfolio**.

[Screenshot: Portfolio Dashboard]

### Multi-Project Overview

A table lists every active project with columns for project name, project manager, start date, target end date, completion percentage, and RAG status.

### RAG Rollup

Aggregate RAG indicators summarize portfolio health: how many projects are green, amber, or red for schedule, budget, and scope.

### Budget Summary

A summary row shows total portfolio budget, total spend, and remaining budget across all projects.

### Sparklines

Each project row includes a small sparkline chart showing its completion trend over the past 30 days, so you can spot stalling projects at a glance.

### CSV Export

Click **Export CSV** at the top of the portfolio table to download the full dataset for use in spreadsheets or external reporting tools.

---

## Executive Dashboard

The Executive Dashboard is designed for senior leaders who need a high-level view without the operational detail. Navigate to **Executive > Overview**.

[Screenshot: Executive Dashboard]

### Portfolio Health

A donut chart shows the proportion of projects by RAG status, giving an instant read on overall health.

### Earned Value Management Metrics

Summary cards display portfolio-wide EVM metrics including Cost Performance Index (CPI), Schedule Performance Index (SPI), and Estimate at Completion (EAC). See the EVM section below for definitions.

### Utilization

A bar chart shows team utilization rates across the organization -- how much of each team's available capacity is allocated to project work.

### Risk Exposure

A summary of the top risks across all projects, ranked by severity. Each risk shows its probability, impact, and the project it belongs to.

---

## Custom Dashboards

Friday allows you to build your own dashboards tailored to your role or reporting needs.

### Creating a Custom Dashboard

1. Navigate to **Home > Dashboards**.
2. Click **New Dashboard**.
3. Give it a name and optional description.
4. Click **Create**.

### Drag-and-Drop Widget Layout

The dashboard opens in edit mode with a grid canvas. Click **Add Widget** to choose from the widget library, then drag it onto the canvas. Resize widgets by dragging their edges. Rearrange by dragging the widget header.

[Screenshot: Custom dashboard in edit mode]

### Available Widget Types

- **Issue List** -- Filtered list of issues (by project, status, assignee, label).
- **Bar Chart** -- Issues by status, priority, or type.
- **Pie Chart** -- Distribution of any issue field.
- **Burn-Up / Burn-Down** -- Scope and completion over time.
- **Budget Gauge** -- Budget consumption as a radial gauge.
- **Milestone Timeline** -- Visual timeline of milestones.
- **Metric Card** -- Single number with label (e.g., open issues, overdue count).
- **Activity Feed** -- Recent activity stream filtered by project or team.
- **Sparkline Table** -- Tabular data with inline trend charts.

Click **Save** when you are finished arranging widgets. You can return to edit mode at any time.

---

## Reports

Friday includes a library of pre-built reports. Navigate to **Reports** in the left navigation.

### Pre-Built Report Types

| Report | Description |
|--------|-------------|
| Issues by Status | Breakdown of issues across workflow statuses with trend line |
| Issues by Assignee | Workload distribution across team members |
| Time Logged | Hours logged per person, project, or date range |
| Budget Summary | Spend vs. plan across projects |
| SLA Compliance | Percentage of issues meeting response and resolution targets |
| Milestone Status | All milestones with current health and forecasted completion |

### Parameterized Filters

Every report supports filters at the top of the page. Common filters include project, date range, assignee, issue type, priority, and label. Adjust filters and click **Run Report** to refresh the data.

### Exporting Reports

Click **Export** in the top-right corner of any report to download it as CSV (raw data) or PDF (formatted with charts). PDF exports include your applied filters and a generation timestamp.

---

## Earned Value Management (EVM)

EVM provides an objective measure of project performance by comparing planned progress with actual progress and actual cost.

Friday calculates four core EVM metrics at both the project and portfolio level.

### Planned Value (PV)

The authorized budget assigned to scheduled work. This represents how much work should have been completed by a given date according to the project plan.

### Earned Value (EV)

The value of work actually completed to date. Friday calculates this based on the percentage of issues completed relative to the total scope, multiplied by the total budget.

### Actual Cost (AC)

The total cost incurred for the work completed to date, drawn from time log cost rates and manual cost entries.

### Schedule Variance (SV) and Cost Variance (CV)

- **SV = EV - PV** -- Positive means ahead of schedule; negative means behind.
- **CV = EV - AC** -- Positive means under budget; negative means over budget.

These metrics are displayed on the Project Dashboard (EVM card) and the Executive Dashboard. Hover over any metric to see a tooltip with the formula and current values.

[Screenshot: EVM metrics on a project dashboard]

---

## Resource Planning

Navigate to **Resources > Planning** to manage team capacity and allocation.

### Team Capacity Overview

The capacity view shows each team member's total available hours per week (based on their work schedule) alongside their currently allocated hours.

### Utilization Percentages

A utilization bar beside each person's name shows what percentage of their capacity is allocated. Green indicates healthy utilization (60-85%), amber indicates over-allocation risk (85-95%), and red indicates over-allocation (above 95%).

### Allocation Forecasting

Switch to the **Forecast** tab to see a forward-looking view of resource allocation based on issue due dates and estimated effort. This helps you spot capacity crunches weeks before they happen.

### Capacity Heatmaps

The **Heatmap** view displays a calendar grid for each team or department. Each cell is color-coded by utilization level for that day or week. Dark red cells indicate over-allocation; pale green cells indicate available capacity.

[Screenshot: Resource capacity heatmap]

Use the heatmap to make informed decisions about when to schedule new work or when to redistribute tasks across the team.

---

**Next Steps**

- Learn about collaboration tools in the [Collaboration Guide](collaboration.md).
- Explore automation and integrations in the [Advanced Features Guide](advanced.md).
- Set up roles and permissions in the [Administration Guide](administration.md).
