# Planning

## Overview

Friday's planning tools help you look beyond individual issues and think about the bigger picture. From milestones and sprints to roadmaps and risk registers, the Planning section gives project managers and team leads the tools to plan ahead, track progress against targets, and respond to change with confidence.

Access planning features from the **Planning** item in the main sidebar for cross-project views, or from within a specific project for project-level planning.

---

## Milestones

Milestones mark significant points in your project timeline. They represent key dates, deliverables, or decision points that the team is working toward.

### Creating Milestones

To create a milestone, navigate to **Milestones** in your project sidebar and click **New Milestone**. Provide:

- **Name** — A descriptive name like "Beta Release" or "Phase 2 Kickoff"
- **Target Date** — The date this milestone should be achieved
- **Description** — Optional context about what the milestone represents and its acceptance criteria

You can also create milestones during the project creation wizard or from the Timeline view by clicking on the milestone row.

### Milestone Timeline View

The milestone timeline shows all milestones on a horizontal timeline, arranged by target date. Each milestone displays:

- Its name and target date
- The number of linked issues and how many are complete
- A progress bar showing completion percentage
- A status indicator (on track, at risk, overdue)

Click any milestone to see its linked issues and details.

[Screenshot: Milestone Timeline View]

### Linking Issues to Milestones

Assign issues to milestones from the issue create or edit form using the Milestone field. You can also drag issues onto milestones in certain views. As linked issues are completed, the milestone's progress bar updates automatically.

---

## Gate Approvals

Gate approvals add formal checkpoints to your milestones. They are commonly used in Waterfall and regulated projects where work cannot proceed to the next phase without explicit sign-off.

### Setting Up Gates

To add a gate approval to a milestone, open the milestone detail page and click **Add Gate**. Configure:

- **Gate Name** — For example, "Design Review" or "Client Sign-off"
- **Approvers** — One or more team members who must approve
- **Approval Rule** — Whether all approvers must approve, or just a majority
- **Required Artifacts** — Documents or deliverables that must be attached before approval can be requested

### Approval Workflow

When a milestone with a gate is approaching, the project manager submits it for approval. Each approver receives a notification and can:

- **Approve** — The gate condition is met
- **Reject** — The gate condition is not met, with a reason
- **Request Changes** — Approve conditionally, pending specific modifications

The milestone cannot be marked complete until all gate conditions are satisfied. This creates a clear audit trail of who approved what and when.

[Screenshot: Gate Approval Panel]

---

## Baselines

Baselines capture a snapshot of your project plan at a specific point in time. By comparing baselines against the current state, you can measure schedule and scope variance to understand how your project has evolved.

### Taking a Baseline

To capture a baseline, navigate to **Project Settings > Baselines** and click **Take Baseline**. Give it a name (for example, "Approved Plan" or "Sprint 3 Start") and Friday will record the current state of all issues, milestones, dates, and estimates.

You can take multiple baselines throughout the project lifecycle. Common times to baseline include:

- After initial planning is approved
- At the start of each phase or sprint
- Before and after significant scope changes
- At major milestone completions

### Comparing Baseline vs Actual

Open the baseline comparison from the project Dashboard or from **Planning > Baselines**. Friday shows a side-by-side comparison including:

- **Schedule Variance** — How much dates have shifted from the baseline. Issues that have slipped are highlighted.
- **Scope Variance** — Issues added or removed since the baseline was taken.
- **Effort Variance** — Changes in story points or estimated hours compared to the original plan.

The comparison view uses color coding to make variances easy to spot. Green indicates items ahead of or on plan, amber indicates minor slippage, and red indicates significant deviation.

[Screenshot: Baseline Comparison View]

---

## Roadmaps

Roadmaps provide a high-level, cross-project view of what your organization is working on and when. They are useful for communicating plans to leadership, aligning teams, and identifying scheduling conflicts across projects.

### Accessing Roadmaps

Navigate to **Planning > Roadmaps** from the main sidebar. This takes you to the cross-project roadmap view.

### Creating a Roadmap

Click **New Roadmap** and provide a name and optional description. A roadmap is a container that groups multiple projects or initiatives onto a single timeline.

### Adding Projects to a Roadmap

Once a roadmap is created, click **Add Project** to include projects. Each project appears as a bar on the Gantt-style timeline, spanning from its start date to its target end date. You can also add standalone items that are not tied to a project, such as external events, budget cycles, or organizational milestones.

### Gantt View

The roadmap Gantt view displays projects and milestones on a scrollable timeline. You can zoom in to see weeks or out to see quarters and years. Key features include:

- Color-coded project bars based on RAG status
- Milestone diamonds on the timeline
- Dependency arrows between projects
- Progress indicators showing completion percentage

Drag project bars to adjust dates directly on the timeline. Changes are reflected in the underlying project schedules.

[Screenshot: Cross-Project Roadmap]

---

## Scenario Planning

Scenario planning lets you explore "what-if" questions without affecting your live project data. Create alternative versions of your plan, adjust variables, and compare outcomes side by side.

### Creating a Scenario

From **Planning > Scenarios**, click **New Scenario**. Give it a name and select which projects to include. Friday creates a copy of the current plan that you can modify independently.

### Modifying a Scenario

Within a scenario, you can:

- Change issue dates and durations
- Add or remove issues
- Adjust resource allocations
- Modify milestones and dependencies
- Change project start and end dates

None of these changes affect your live project data.

### Comparing Scenarios

Select two or more scenarios and click **Compare**. Friday shows them side by side with key metrics:

- Total project duration
- Resource utilization
- Cost estimates
- Milestone dates
- Critical path differences

This helps you evaluate trade-offs. For example, you might compare "Add two developers" against "Reduce scope" to see which approach better meets your deadline.

### Applying a Scenario

If you decide to adopt a scenario, click **Apply to Live Plan**. Friday will update the actual project data to match the scenario. This action requires Project Admin permissions and logs a change for audit purposes.

[Screenshot: Scenario Comparison View]

---

## Auto-Scheduling

Friday's scheduling engine can automatically calculate optimal start and end dates for your issues based on dependencies, resource availability, and project constraints.

### How It Works

The auto-scheduler considers three factors:

**Dependencies** — Issues that depend on other issues cannot start until their predecessors are complete. The scheduler respects all four dependency types (Finish-to-Start, Start-to-Start, Finish-to-Finish, Start-to-Finish).

**Capacity** — The scheduler checks each assignee's available capacity across all projects. If a team member is allocated to multiple projects, the scheduler accounts for their split time to avoid overcommitting anyone.

**Critical Path** — The scheduler identifies the critical path and prioritizes scheduling those issues first. This ensures the project completion date is as early as possible given the constraints.

### Running Auto-Schedule

Navigate to the Timeline view and click **Auto-Schedule** in the toolbar. Friday will calculate dates and present a preview showing:

- Proposed start and end dates for each issue
- The calculated critical path
- Any resource conflicts or overallocations detected
- The projected project completion date

Review the preview and click **Apply** to accept the proposed schedule, or **Cancel** to discard it.

### Manual Overrides

After auto-scheduling, you can manually adjust any dates. If you run auto-schedule again, Friday will respect manually pinned dates and schedule around them.

[Screenshot: Auto-Schedule Preview]

---

## Sprints

Sprints are time-boxed iterations used in agile projects. Friday supports full sprint management, from planning through retrospective.

### Creating a Sprint

Navigate to **Sprints** in your project sidebar and click **New Sprint**. Provide:

- **Sprint Name** — For example, "Sprint 12" or "March Iteration"
- **Start Date** — When the sprint begins
- **End Date** — When the sprint ends (typically 1 to 4 weeks after start)
- **Sprint Goal** — An optional description of what the team aims to achieve

### Managing the Backlog

The backlog is a prioritized list of issues that are not yet assigned to a sprint. To access it, go to **Backlog** in the project sidebar.

Drag issues to reorder them by priority. The most important items should be at the top. During sprint planning, you will pull items from the top of the backlog into the upcoming sprint.

### Adding Issues to a Sprint

During sprint planning, drag issues from the backlog into the sprint panel. Friday shows a capacity indicator based on story points. As you add issues, the capacity bar fills, helping you avoid overcommitting.

You can also assign issues to a sprint from the issue detail page or by using bulk operations in the Table view.

### Starting a Sprint

When the team is ready, click **Start Sprint**. This activates the sprint and begins tracking progress. Active sprints appear prominently in the project sidebar.

Only one sprint can be active at a time per project. If you need to start a new sprint, complete or close the current one first.

### Completing a Sprint

At the end of the sprint, click **Complete Sprint**. Friday will show a summary of what was accomplished:

- Issues completed during the sprint
- Issues not completed (you choose whether to move them to the backlog or the next sprint)
- Story points delivered versus planned
- Sprint velocity

### Burndown Chart

The burndown chart shows how much work remains in the active sprint over time. The ideal burndown is a straight line from the total story points at sprint start to zero at sprint end.

The actual burndown reflects real progress. If the actual line is above the ideal line, the team may not complete all planned work. If it is below, the team is ahead of plan.

Access the burndown chart from the Sprint detail page.

[Screenshot: Sprint Burndown Chart]

---

## Risk Management

Friday includes a built-in risk management system that helps you identify, assess, and respond to project risks before they become problems.

### Risk Register

The risk register is a structured list of all identified risks for a project. Navigate to **Risks** in the project sidebar to access it.

Each risk entry includes:

- **Title** — A clear description of the risk
- **Description** — Detailed explanation and context
- **Category** — The area of impact (Schedule, Budget, Scope, Resource, Technical, External)
- **Probability** — How likely the risk is to occur (Very Low, Low, Medium, High, Very High)
- **Impact** — How severe the consequences would be if it occurs (Very Low, Low, Medium, High, Very High)
- **Risk Score** — Automatically calculated as Probability multiplied by Impact
- **Owner** — The person responsible for monitoring and responding to this risk
- **Status** — Open, Mitigating, Resolved, or Accepted

### Risk Responses

For each risk, you can define one or more response strategies:

- **Mitigate** — Take action to reduce the probability or impact
- **Avoid** — Change plans to eliminate the risk entirely
- **Transfer** — Shift the impact to a third party (insurance, outsourcing)
- **Accept** — Acknowledge the risk and prepare a contingency plan
- **Escalate** — Raise the risk to a higher authority for decision

Each response includes a description of the planned action, an owner, and a due date.

### Risk Matrix and Heat Map

The risk matrix (also called a heat map) provides a visual summary of all project risks plotted on a grid. The horizontal axis represents impact and the vertical axis represents probability. Each cell is color-coded:

- **Green** — Low risk (low probability, low impact)
- **Yellow** — Moderate risk (needs monitoring)
- **Orange** — High risk (needs active mitigation)
- **Red** — Critical risk (requires immediate action)

Risks appear as dots on the grid. Click any dot to view the risk details. The heat map gives leadership a quick visual summary of the project's risk profile.

[Screenshot: Risk Matrix Heat Map]

---

## Cross-Project Dependencies

When work in one project depends on deliverables from another project, Friday lets you track these cross-project dependencies to prevent surprises.

### Creating Cross-Project Dependencies

From the issue detail page, go to the **Dependencies** section and click **Add Dependency**. In the search dialog, you can search across all projects you have access to. Select the issue in the other project that this issue depends on (or that depends on this issue).

Cross-project dependencies are visible in both projects, so both teams stay informed.

### Tracking Dependencies in Roadmaps

Cross-project dependencies appear as arrows on the Roadmap Gantt view, connecting items across project bars. This makes it easy to identify when a delay in one project could cascade into another.

### Dependency Alerts

Friday monitors cross-project dependencies and sends notifications when:

- A predecessor issue is delayed past its due date
- A predecessor issue is moved to a different milestone or sprint
- A predecessor issue is reassigned or deprioritized

These alerts help teams communicate proactively about changes that could affect dependent work.

---

## Tips for Effective Planning

- **Start with milestones.** Define your key dates first, then work backward to plan the issues needed to reach each milestone.
- **Baseline early and often.** Take your first baseline as soon as the plan is approved. Take additional baselines at major decision points so you can measure drift.
- **Use auto-scheduling as a starting point.** Let the engine do the initial calculation, then fine-tune manually where you have local knowledge the system does not.
- **Review risks weekly.** A risk register is only useful if it stays current. Spend five minutes each week reviewing and updating risk statuses.
- **Keep the roadmap honest.** Update project dates on the roadmap as plans change. An outdated roadmap is worse than no roadmap at all.
- **Plan sprints collaboratively.** Involve the team in deciding what goes into each sprint. Commitment increases when people have a voice in the plan.
- **Track cross-project dependencies early.** The sooner you identify inter-team dependencies, the easier they are to coordinate.

---

## Next Steps

- **Review the Issues and Workflows guide** to master day-to-day issue management
- **Explore the Projects guide** for dashboard configuration and team management
- **Visit the Resources section** in Friday to understand team workload and capacity across projects
- **Check the Executive section** for portfolio-level dashboards and reports
