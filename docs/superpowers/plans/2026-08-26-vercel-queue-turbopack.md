# Vercel Queue Turbopack Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the Payload admin page in local Turbopack development by preventing Turbopack from bundling `@vercel/queue`.

**Architecture:** Keep the existing queue route and dispatcher unchanged. Configure Next.js to treat the Node-oriented Queue SDK as an external server package, and protect that compatibility boundary with a focused configuration test.

**Tech Stack:** Next.js 15.4.11, Turbopack, Vercel Queue 0.1.4, Vitest, pnpm

---

## File Map

- Create `apps/admin/src/config/__tests__/nextConfig.test.ts`: imports the effective Next.js configuration and verifies the Queue SDK externalization contract.
- Modify `apps/admin/next.config.js`: lists `@vercel/queue` under `serverExternalPackages` while preserving the existing Turbopack root.

### Task 1: Protect the Queue SDK from Turbopack bundling

**Files:**

- Create: `apps/admin/src/config/__tests__/nextConfig.test.ts`
- Modify: `apps/admin/next.config.js`

- [ ] **Step 1: Write the failing configuration test**

```ts
import { describe, expect, it } from "vitest"

type NextConfig = {
  serverExternalPackages?: string[]
}

describe("admin Next.js config", () => {
  it("loads Vercel Queue outside the Turbopack server bundle", async () => {
    const { default: nextConfig } = (await import("../../../next.config.js")) as {
      default: NextConfig
    }

    expect(nextConfig.serverExternalPackages).toContain("@vercel/queue")
  })
})
```

- [ ] **Step 2: Run the focused test and verify the red state**

Run:

```bash
PATH=/Users/navelorange1999/.nvm/versions/node/v22.13.0/bin:$PATH pnpm --filter admin exec vitest run src/config/__tests__/nextConfig.test.ts
```

Expected: FAIL because `nextConfig.serverExternalPackages` does not contain `@vercel/queue`.

- [ ] **Step 3: Add the minimal Next.js configuration**

Add the following property to the existing `nextConfig` object in `apps/admin/next.config.js`:

```js
serverExternalPackages: ["@vercel/queue"],
```

Keep the existing `turbopack.root`, React Compiler, and TypeScript configuration unchanged.

- [ ] **Step 4: Run the focused test and verify the green state**

Run:

```bash
PATH=/Users/navelorange1999/.nvm/versions/node/v22.13.0/bin:$PATH pnpm --filter admin exec vitest run src/config/__tests__/nextConfig.test.ts
```

Expected: one test file and one test pass.

- [ ] **Step 5: Run the complete admin regression suite**

Run:

```bash
PATH=/Users/navelorange1999/.nvm/versions/node/v22.13.0/bin:$PATH pnpm --filter admin test:run
PATH=/Users/navelorange1999/.nvm/versions/node/v22.13.0/bin:$PATH pnpm --filter admin check-types
PATH=/Users/navelorange1999/.nvm/versions/node/v22.13.0/bin:$PATH pnpm --filter admin build
```

Expected: all tests pass, TypeScript exits successfully, and the production build completes. Existing non-blocking Vercel Queue and region warnings may remain in the Webpack production build.

- [ ] **Step 6: Verify local Turbopack behavior**

Restart the admin development server so Next.js reloads `next.config.js`, then request:

```bash
curl --fail-with-body --silent --show-error http://localhost:3001/admin
```

Expected: the route no longer returns the `Can't resolve './ROOT/apps/admin' <dynamic>` compilation error. An authentication redirect or rendered admin response is acceptable.

- [ ] **Step 7: Commit the fix**

```bash
git add apps/admin/next.config.js apps/admin/src/config/__tests__/nextConfig.test.ts
git commit -m "fix(admin): externalize Vercel Queue from Turbopack"
```

Expected: the commit contains only the Next.js configuration and its focused regression test.
