# Testing and Operations

> Last Updated: March 12, 2026

## Testing

Vitest is configured in `apps/admin`.

Example:

```typescript
import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { Component } from "./Component"

describe("Component", () => {
	it("renders correctly", () => {
		const { getByText } = render(<Component />)
		expect(getByText("Expected text")).toBeInTheDocument()
	})
})
```

Common commands:

```bash
pnpm test
pnpm test:run
pnpm --filter admin test:ui
```

## Git Commit Workflow

Use Commitizen for conventional commits:

```bash
pnpm cz
```

Commit format:

```text
type(scope): subject

body

footer
```

Common commit types:

- `feat`
- `fix`
- `docs`
- `style`
- `refactor`
- `test`
- `chore`

## Quick Commands

```bash
# Development
pnpm dev                  # Starts the default app dev graph
pnpm dev:www
pnpm dev:admin
pnpm dev:site-shell

# Build
pnpm build

# Quality
pnpm lint
pnpm check-types
pnpm format

# Testing
pnpm test
pnpm test:run

# CMS
pnpm gen
pnpm --filter admin migrate:status
pnpm --filter admin migrate
```

The admin migration scripts build their workspace dependencies before invoking the Payload CLI.
Use these package scripts instead of calling `payload migrate*` directly so a fresh checkout does
not depend on pre-existing package build artifacts.

To explicitly select a database configuration, pass an environment filename relative to
`apps/admin`:

```bash
pnpm --filter admin migrate:status -- --env-file .env.prod
pnpm --filter admin migrate -- --env-file .env.prod
pnpm --filter admin migrate:status -- --env-file .env.prod
```

The `--` separator is required: pnpm 11 otherwise consumes `--env-file` as a Node.js startup option
before running the package script, resolving the file from the invoking directory instead of
`apps/admin`. Adding `run` alone does not prevent this. With the separator, the migration runner
receives the option and resolves the file relative to `apps/admin`.

The same option is supported by `migrate:down` and `migrate:create`. The selected file must exist
inside `apps/admin` and contain a complete MongoDB `DATABASE_URI`; missing files, empty connections,
and unresolved variable references fail before Payload starts. Values in the selected file override
the invoking terminal's variables. Other settings retain Payload's normal environment loading.
Without `--env-file`, the existing Payload loading behavior is unchanged. Use Node.js 22.13 or newer.

Check status separately for each database before migrating. `migrate` runs all pending migrations
for the selected database, so confirm the pending list contains only the intended changes. A filename
such as `.env.prod` is a selection label, not proof that its connection points to production.
Never commit real environment files or share connection strings in logs or chat. Agents must not
execute commands that load real environment files; an operator runs those commands locally.

## Important File Locations

- UI components: `packages/ui/src/components/`
- Static demo shell: `packages/site-shell/src/`
- Payload collections: `apps/admin/src/collections/`
- Payload globals: `apps/admin/src/globals/`
- Frontend routes: `apps/www/src/app/(frontend)/`
- API routes: `apps/www/src/app/api/`
- Generated types: `packages/typescript-config/typings/`
- CI and deployment workflows: `.github/workflows/`

## Delivery Checklist

Before finishing a task:

1. Validate the affected app with the narrowest useful command.
2. Keep documentation updates in the relevant topic document.
3. Avoid creating task summary files.
4. Preserve consistency with existing patterns.
