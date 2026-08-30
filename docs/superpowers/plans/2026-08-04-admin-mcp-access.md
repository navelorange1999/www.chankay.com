# Admin MCP Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable full CRUD capabilities for the Posts, Pages, Tags, and Series Payload MCP collections while keeping Media read-only.

**Architecture:** Define one reusable `adminMcpAccess` literal in the existing MCP collection configuration and assign it only to the four editorial collections. Verify the public configuration object with a focused Vitest test so future changes cannot accidentally remove editorial CRUD or grant Media write access.

**Tech Stack:** TypeScript, Payload CMS MCP plugin, Vitest, pnpm

---

### Task 1: Lock the MCP capability boundary with a failing test

**Files:**

- Create: `apps/admin/src/plugins/mcp/__tests__/collections.test.ts`
- Test: `apps/admin/src/plugins/mcp/__tests__/collections.test.ts`

- [x] **Step 1: Write the failing capability test**

```ts
import { describe, expect, it } from "vitest"

import { mcpCollections } from "../collections"

const adminAccess = {
  find: true,
  create: true,
  update: true,
  delete: true,
}

describe("MCP collection access", () => {
  it.each(["posts", "pages", "tags", "series"] as const)(
    "enables full CRUD for %s",
    (collection) => {
      expect(mcpCollections[collection].enabled).toEqual(adminAccess)
    }
  )

  it("keeps media read-only", () => {
    expect(mcpCollections.media.enabled).toEqual({
      find: true,
      create: false,
      update: false,
      delete: false,
    })
  })
})
```

- [x] **Step 2: Run the focused test and verify it fails**

Run:

```bash
env PATH=/Users/navelorange1999/.nvm/versions/node/v22.13.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin pnpm --filter admin test:run -- src/plugins/mcp/__tests__/collections.test.ts
```

Expected: FAIL for the four editorial collections because `create`, `update`, and `delete` are currently `false`; the Media assertion passes.

### Task 2: Enable editorial CRUD and verify the boundary

**Files:**

- Modify: `apps/admin/src/plugins/mcp/collections.ts`
- Test: `apps/admin/src/plugins/mcp/__tests__/collections.test.ts`

- [x] **Step 1: Add the reusable admin capability literal**

Insert this immediately after `readOnlyMcpAccess`:

```ts
const adminMcpAccess = {
  find: true,
  create: true,
  update: true,
  delete: true,
} as const
```

- [x] **Step 2: Apply admin access only to editorial collections**

Update `mcpCollections` so its capability assignments are exactly:

```ts
export const mcpCollections = {
  posts: {
    description: "Blog posts and long-form article content.",
    enabled: adminMcpAccess,
  },
  pages: {
    description: "Structured website pages with nested layout blocks and SEO settings.",
    enabled: adminMcpAccess,
  },
  tags: {
    description: "Taxonomy tags used to categorize and filter posts.",
    enabled: adminMcpAccess,
  },
  series: {
    description: "Editorial series metadata, ordering, and status information.",
    enabled: adminMcpAccess,
  },
  media: {
    description: "Uploaded and generated media assets referenced across the site.",
    enabled: readOnlyMcpAccess,
  },
} as const
```

- [x] **Step 3: Run the focused test and verify it passes**

Run:

```bash
env PATH=/Users/navelorange1999/.nvm/versions/node/v22.13.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin pnpm --filter admin test:run -- src/plugins/mcp/__tests__/collections.test.ts
```

Expected: PASS with five capability cases passing.

- [x] **Step 4: Run the admin TypeScript check**

Run:

```bash
env PATH=/Users/navelorange1999/.nvm/versions/node/v22.13.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin pnpm --filter admin check-types
```

Expected: exit code 0 with no TypeScript errors.

- [x] **Step 5: Review the final diff for unintended permission expansion**

Run:

```bash
git diff --check
git diff -- apps/admin/src/plugins/mcp/collections.ts apps/admin/src/plugins/mcp/__tests__/collections.test.ts
```

Expected: no whitespace errors; only the four editorial collections gain `create`, `update`, and `delete`, while Media stays read-only.

- [x] **Step 6: Commit the implementation**

```bash
git add apps/admin/src/plugins/mcp/collections.ts apps/admin/src/plugins/mcp/__tests__/collections.test.ts
git commit -m "feat(admin): enable MCP CRUD for editorial collections"
```
