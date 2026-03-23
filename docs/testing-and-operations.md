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
pnpm dev
pnpm dev:www
pnpm dev:admin

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
```

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
