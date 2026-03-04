# Claude Code Custom Commands (Skills)

This directory holds custom skill files for Claude Code. Each `.md` file becomes a slash command you can invoke during any session.

## How It Works

| You create | You invoke with |
|------------|----------------|
| `review.md` | `/project:review` |
| `test.md` | `/project:test <args>` |
| `backend/add-model.md` | `/project:backend/add-model` |

When invoked, Claude reads the markdown file and follows its instructions. Since this directory is committed to the repo, skills are available in every environment (local, cloud, CI).

## Adding a New Skill

1. Create a `.md` file in this directory (or a subdirectory)
2. Write instructions in imperative form -- tell Claude what to do
3. Use `$ARGUMENTS` as a placeholder for user-provided input

### Example: `deploy-checklist.md`

```markdown
Run through this pre-deploy checklist for: $ARGUMENTS

1. Check for uncommitted changes
2. Run `make test-backend` and `make test-frontend`
3. Verify all migrations are applied: `make check-migrations`
4. Review any TODO/FIXME comments in changed files
5. Summarize findings
```

Then invoke it: `/project:deploy-checklist the auth feature`

## Tips for Effective Skills

- **Be specific**: Reference actual file paths and patterns from this project
- **Include examples**: Show the expected output format or code style
- **Keep it focused**: One skill = one task. Compose multiple skills for complex workflows
- **Use `$ARGUMENTS`**: Makes skills reusable across different targets

## Subdirectories

Subdirectories are supported and namespace the command:

```
commands/
  backend/
    add-model.md      -> /project:backend/add-model
    add-endpoint.md   -> /project:backend/add-endpoint
  frontend/
    add-component.md  -> /project:frontend/add-component
```
