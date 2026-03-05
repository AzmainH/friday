# Collaboration & Communication

This guide covers Friday's collaboration features: the wiki knowledge base, decision logs, stakeholder management, RACI matrices, commenting, and notifications.

---

## Wiki / Knowledge Base

Friday includes a built-in wiki so your team can document processes, decisions, architecture, and anything else that matters -- right alongside your project work.

### Navigating to the Wiki

Click **Knowledge** in the left navigation. You will see a list of wiki spaces. Each workspace can have its own wiki space, and projects can have dedicated spaces as well.

### Creating a Wiki Space

1. From the Knowledge page, click **New Space**.
2. Enter a space name (e.g., "Engineering Handbook" or "Product Requirements").
3. Optionally add a description and an icon.
4. Click **Create Space**.

The new space appears in the sidebar under Knowledge.

[Screenshot: Wiki space list]

### Adding Pages

1. Open a wiki space.
2. Click **New Page** in the top-right corner.
3. Enter a page title.
4. Begin writing in the editor area below the title.
5. Your work is saved automatically as you type.

### Page Hierarchy and Tree

Pages can be nested to create a structured table of contents.

- To create a child page, open a parent page and click the **+** icon next to its name in the sidebar tree.
- To rearrange pages, drag and drop them in the sidebar tree. You can move a page under a different parent or reorder pages at the same level.
- The page tree is displayed in the left panel of the Knowledge section, giving you an expandable outline of all content.

[Screenshot: Wiki page tree with nested pages]

---

## Wiki Features

The wiki editor is powered by TipTap and provides a rich authoring experience.

### Slash Commands

Type **/** anywhere in the editor to open the slash command menu. From here you can quickly insert:

- Headings (H1, H2, H3)
- Bullet lists and numbered lists
- Task lists (checkboxes)
- Tables
- Images
- Code blocks
- Callout boxes (info, warning, success, error)
- Horizontal rules
- Block quotes

Start typing after the slash to filter the menu. Press Enter or click to insert the selected block.

### @Mentions

Type **@** followed by a team member's name to mention them. The mentioned person receives a notification with a link to the page. Mentions appear as highlighted chips in the text.

### Image Upload

Drag and drop an image directly into the editor, or use the slash command menu to insert an image. You can also paste images from your clipboard. Uploaded images are stored in Friday and served alongside the page.

### Tables

Insert a table via the slash command menu. Once inserted, use the toolbar that appears above the table to add or remove rows and columns, merge cells, or toggle header rows.

### Code Blocks

Insert a code block via the slash command menu. Select a language from the dropdown for syntax highlighting. Code blocks are useful for documenting API examples, configuration snippets, or technical references.

### Version History

Every page maintains a version history. Click the **clock icon** in the page toolbar to view previous versions. Each entry shows who made the change, when, and a summary of what changed.

### Restoring a Previous Version

From the version history panel:

1. Click on any previous version to preview it.
2. If you want to revert, click **Restore This Version**.
3. The current page content is replaced with the selected version, and a new version entry is created so nothing is lost.

[Screenshot: Version history panel]

---

## Decision Log

The Decision Log helps teams record and track important decisions so they are never lost in meeting notes or chat threads.

### Accessing the Decision Log

Open any project and navigate to **Planning > Decisions**.

### Recording a Decision

1. Click **New Decision**.
2. Fill in the decision form:
   - **Title** -- A short summary of the decision.
   - **Status** -- Choose from Proposed, Decided, Superseded, or Deferred.
   - **Description** -- Full context, options considered, and rationale.
   - **Decision Date** -- When the decision was made (or proposed).
   - **Decision Makers** -- Who was involved.
3. Click **Save**.

### Decision Statuses

| Status | Meaning |
|--------|---------|
| Proposed | Under discussion, not yet finalized |
| Decided | Approved and in effect |
| Superseded | Replaced by a newer decision |
| Deferred | Postponed for future consideration |

### Linking Decisions to Issues

When recording or editing a decision, use the **Linked Issues** field to connect the decision to one or more issues. This creates a two-way link: the decision appears on the issue detail page, and the issue appears on the decision page.

This is valuable when you need to understand why a particular approach was taken on an issue.

[Screenshot: Decision log with linked issues]

---

## Stakeholder Management

Friday includes stakeholder tracking to help project managers identify and manage the people who influence or are affected by the project.

### Adding Stakeholders

1. Open a project and navigate to **Planning > Stakeholders**.
2. Click **Add Stakeholder**.
3. Enter the stakeholder's name, role, organization (if external), and contact information.
4. Set their **Interest Level** (Low, Medium, High) and **Influence Level** (Low, Medium, High).
5. Click **Save**.

### Interest vs. Influence Levels

- **Interest** measures how much the stakeholder cares about the project outcome.
- **Influence** measures how much power the stakeholder has to affect the project.

These two dimensions determine the engagement strategy:

| | Low Influence | High Influence |
|---|---|---|
| **High Interest** | Keep informed | Manage closely |
| **Low Interest** | Monitor | Keep satisfied |

### Stakeholder Matrix

The **Matrix View** button at the top of the stakeholder list displays stakeholders on a 2x2 grid of interest versus influence. This visual makes it easy to see at a glance who needs the most attention.

[Screenshot: Stakeholder matrix grid]

---

## RACI Matrix

The RACI matrix clarifies roles and responsibilities for deliverables or major issues, preventing confusion about who does what.

### What RACI Means

| Letter | Role | Description |
|--------|------|-------------|
| R | Responsible | The person who does the work |
| A | Accountable | The person who makes the final decision and is answerable for the outcome |
| C | Consulted | People whose input is sought before a decision or action |
| I | Informed | People who are kept up to date on progress or decisions |

### Setting RACI per Issue or Deliverable

1. Open a project and navigate to **Planning > RACI**.
2. The matrix displays issues or deliverables as rows and team members as columns.
3. Click any cell to assign a RACI role. Select R, A, C, or I from the dropdown.
4. Each row should have exactly one A (Accountable) and at least one R (Responsible).

[Screenshot: RACI matrix with roles assigned]

### Best Practices

- Keep the matrix focused on key deliverables or high-impact issues rather than every minor task.
- Review and update the RACI matrix during sprint planning or milestone reviews.
- Use the matrix to resolve disagreements about ownership early in the project.

---

## Comments and @Mentions

Comments are the primary way to discuss issues, share updates, and ask questions within Friday.

### Adding Comments on Issues

1. Open any issue.
2. Scroll to the **Comments** section at the bottom of the issue detail panel.
3. Type your comment in the text area.
4. Click **Post Comment**.

Comments support rich text formatting including bold, italic, bullet lists, numbered lists, links, and inline code.

### @Mentioning Team Members

Type **@** followed by a person's name in any comment. A dropdown will appear with matching team members. Select the person to mention them.

When you mention someone:

- They receive a notification with a direct link to the comment.
- Their name appears as a highlighted chip in the comment text.
- The issue is added to their activity feed.

### Rich Text Support in Comments

The comment editor supports the same TipTap formatting as the wiki. Use the toolbar above the text area or keyboard shortcuts:

- Bold: select text and press Ctrl+B (or Cmd+B on Mac)
- Italic: Ctrl+I
- Link: Ctrl+K
- Bullet list: type "- " at the start of a line
- Numbered list: type "1. " at the start of a line

You can also drag and drop images into comments.

[Screenshot: Comment with rich text and @mention]

---

## Notifications

Friday keeps you informed about activity relevant to your work through an in-app notification system.

### Notification Bell

The notification bell icon is located in the top-right corner of the application header. A red badge shows the count of unread notifications.

Click the bell to open the notification panel, which displays a chronological list of notifications.

[Screenshot: Notification panel]

### Notification Types

You will receive notifications for the following events:

- **Assigned to you** -- An issue has been assigned to you.
- **Mentioned** -- Someone @mentioned you in a comment or wiki page.
- **Comment on your issue** -- A new comment was added to an issue you created or are assigned to.
- **Status change** -- An issue you are watching changed status.
- **Approaching deadline** -- An issue assigned to you is due within 48 hours.
- **Approval requested** -- An approval step requires your action.
- **Budget threshold** -- A project you manage has hit a budget alert level.

### Marking as Read

- Click on any notification to open the related item and automatically mark it as read.
- Click the **checkmark** icon on a notification to mark it as read without navigating away.
- Click **Mark All as Read** at the top of the panel to clear all unread notifications.

### Notification Preferences

Navigate to **Settings > Notifications** to customize which events trigger notifications for you.

For each notification type, you can choose:

- **In-app** -- Receive the notification in Friday's notification panel (enabled by default).
- **Email** -- Receive an email notification (configurable per event type).
- **Off** -- Disable the notification entirely.

You can also set a **Quiet Hours** window during which email notifications are suppressed.

[Screenshot: Notification preferences settings]

---

**Next Steps**

- Track time and budgets with the [Tracking & Dashboards Guide](tracking.md).
- Automate workflows in the [Advanced Features Guide](advanced.md).
- Configure users and roles in the [Administration Guide](administration.md).
