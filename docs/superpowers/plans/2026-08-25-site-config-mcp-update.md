# SiteConfig MCP Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a general-purpose `update_site_config` MCP tool that updates the Payload SiteConfig global for an explicitly supported locale.

**Architecture:** Keep the existing read tool unchanged and add one focused update tool beside it. The handler validates the locale and non-empty plain-object patch, delegates business-field validation and hooks to `payload.updateGlobal`, and returns the updated global for read-back verification.

**Tech Stack:** TypeScript, Payload CMS 3.61, `@payloadcms/plugin-mcp`, Zod, Vitest, pnpm workspace

---

### Task 1: Add and register the SiteConfig update tool

**Files:**

- Create: `apps/admin/src/plugins/mcp/site-config/updateTool.ts`
- Create: `apps/admin/src/plugins/mcp/site-config/__tests__/updateTool.test.ts`
- Modify: `apps/admin/src/plugins/mcp/site-config/index.ts`

- [ ] **Step 1: Write the failing handler and registry tests**

Create `apps/admin/src/plugins/mcp/site-config/__tests__/updateTool.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest"

const { updateGlobal } = vi.hoisted(() => ({
  updateGlobal: vi.fn(),
}))

vi.mock("../../shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../shared")>()
  return {
    ...actual,
    getPayloadInstance: vi.fn(async () => ({ updateGlobal })),
  }
})

import { siteConfigTools } from "../index"
import { updateSiteConfigTool } from "../updateTool"

describe("update_site_config MCP tool", () => {
  beforeEach(() => {
    updateGlobal.mockReset()
  })

  it("updates the SiteConfig global for the requested locale", async () => {
    const data = { siteName: "展凯" }
    const siteConfig = { id: "site-config", siteName: "展凯" }
    updateGlobal.mockResolvedValue(siteConfig)

    const result = await updateSiteConfigTool.handler({
      data,
      locale: "zh-CN",
    })

    expect(updateGlobal).toHaveBeenCalledWith({
      data,
      locale: "zh-CN",
      overrideAccess: true,
      slug: "site-config",
    })
    expect(JSON.parse(result.content[0]!.text)).toEqual({
      action: "update_site_config",
      locale: "zh-CN",
      siteConfig,
    })
  })

  it("rejects unsupported locales before calling Payload", async () => {
    await expect(
      updateSiteConfigTool.handler({ data: { siteName: "Test" }, locale: "fr" })
    ).rejects.toThrow("locale must be one of: en, zh-CN")
    expect(updateGlobal).not.toHaveBeenCalled()
  })

  it.each([undefined, null, [], {}, "invalid"])(
    "rejects an invalid SiteConfig patch: %j",
    async (data) => {
      await expect(updateSiteConfigTool.handler({ data, locale: "en" })).rejects.toThrow(
        "data must be a non-empty JSON object"
      )
      expect(updateGlobal).not.toHaveBeenCalled()
    }
  )

  it("propagates Payload validation failures", async () => {
    const validationError = new Error("Payload validation failed")
    updateGlobal.mockRejectedValue(validationError)

    await expect(
      updateSiteConfigTool.handler({ data: { siteUrl: "invalid" }, locale: "en" })
    ).rejects.toBe(validationError)
  })

  it("registers read and update SiteConfig tools", () => {
    expect(siteConfigTools.map((tool) => tool.name)).toEqual([
      "get_site_config",
      "update_site_config",
    ])
  })
})
```

- [ ] **Step 2: Run the focused test and verify the RED state**

Run:

```bash
PATH=/Users/navelorange1999/.nvm/versions/node/v22.13.0/bin:$PATH \
pnpm --filter admin test:run -- src/plugins/mcp/site-config/__tests__/updateTool.test.ts
```

Expected: FAIL because `../updateTool` does not exist and `siteConfigTools` does not expose `update_site_config`.

- [ ] **Step 3: Implement the minimal update tool**

Create `apps/admin/src/plugins/mcp/site-config/updateTool.ts`:

```ts
import type { SiteConfig } from "@repo/typescript-config/typings/payload-types"
import { z } from "zod"

import { SUPPORTED_LOCALES } from "@/config/locales"

import { createTextResult, getPayloadInstance, resolveSupportedLocale } from "../shared"

const siteConfigPatchSchema = z
  .object({})
  .catchall(z.unknown())
  .refine((data) => Object.keys(data).length > 0, "data must be a non-empty JSON object")

const requireSiteConfigPatch = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("data must be a non-empty JSON object")
  }

  const data = value as Record<string, unknown>
  if (Object.keys(data).length === 0) {
    throw new Error("data must be a non-empty JSON object")
  }

  return data
}

export const updateSiteConfigTool = {
  description: "Update the global site configuration document for a specific locale.",
  handler: async (args: Record<string, unknown>) => {
    const locale = resolveSupportedLocale(args.locale)
    if (!locale) {
      throw new Error(`locale must be one of: ${SUPPORTED_LOCALES.join(", ")}`)
    }

    const data = requireSiteConfigPatch(args.data)
    const payload = await getPayloadInstance()
    const siteConfig = (await payload.updateGlobal({
      data: data as Partial<SiteConfig>,
      locale,
      overrideAccess: true,
      slug: "site-config",
    })) as SiteConfig

    return createTextResult({
      action: "update_site_config",
      locale,
      siteConfig,
    })
  },
  name: "update_site_config",
  parameters: {
    data: siteConfigPatchSchema,
    locale: z.string().min(1),
  },
}
```

Modify `apps/admin/src/plugins/mcp/site-config/index.ts`:

```ts
import { getSiteConfigTool } from "./tool"
import { siteConfigResource } from "./resource"
import { updateSiteConfigTool } from "./updateTool"

export const siteConfigResources = [siteConfigResource]
export const siteConfigTools = [getSiteConfigTool, updateSiteConfigTool]
```

- [ ] **Step 4: Run the focused test and verify the GREEN state**

Run:

```bash
PATH=/Users/navelorange1999/.nvm/versions/node/v22.13.0/bin:$PATH \
pnpm --filter admin test:run -- src/plugins/mcp/site-config/__tests__/updateTool.test.ts
```

Expected: PASS for all SiteConfig update-tool tests.

- [ ] **Step 5: Run admin regression verification**

Run:

```bash
PATH=/Users/navelorange1999/.nvm/versions/node/v22.13.0/bin:$PATH pnpm --filter admin test:run
PATH=/Users/navelorange1999/.nvm/versions/node/v22.13.0/bin:$PATH pnpm --filter admin check-types
git diff --check
```

Expected: all admin tests pass, TypeScript exits with code 0, and `git diff --check` prints no errors.

- [ ] **Step 6: Review and commit only the MCP implementation**

Run:

```bash
git diff -- apps/admin/src/plugins/mcp/site-config
git status --short
git add \
  apps/admin/src/plugins/mcp/site-config/updateTool.ts \
  apps/admin/src/plugins/mcp/site-config/__tests__/updateTool.test.ts \
  apps/admin/src/plugins/mcp/site-config/index.ts
git commit -m "feat(admin): add SiteConfig MCP update tool"
```

Expected: the commit contains only the SiteConfig MCP implementation and tests; pre-existing modifications to `package.json` and `packages/typescript-config/typings/payload-types.ts` remain outside the commit.
