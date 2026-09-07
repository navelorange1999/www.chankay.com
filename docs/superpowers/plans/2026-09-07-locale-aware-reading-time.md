# Locale-Aware Reading Time Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Calculate each post's reading time from the content resolved for the current locale, with accurate handling for Chinese, English, and mixed-language Markdown.

**Architecture:** Replace the persisted `beforeChange` calculation with a virtual Payload field populated by an `afterRead` hook. Keep the text-analysis rules in a pure utility so language rates and Markdown filtering can be tested without Payload, then verify the collection wiring separately.

**Tech Stack:** TypeScript, Payload CMS, Vitest, pnpm

---

## Task 1: Add a language-aware Markdown estimator

**Files:**

- Create: `apps/admin/src/utils/readingTime.ts`
- Create: `apps/admin/src/utils/__tests__/readingTime.test.ts`

- [ ] **Step 1: Write failing utility tests**

Create `apps/admin/src/utils/__tests__/readingTime.test.ts`:

````ts
import { describe, expect, it } from "vitest"

import { estimateReadingTimeFromMarkdown } from "../readingTime"

describe("estimateReadingTimeFromMarkdown", () => {
  it("counts Han characters at 400 characters per minute", () => {
    expect(estimateReadingTimeFromMarkdown("猪".repeat(800))).toBe(2)
  })

  it("counts non-Han words at 200 words per minute", () => {
    expect(
      estimateReadingTimeFromMarkdown(
        Array.from({ length: 400 }, (_, index) => `word${index}`).join(" ")
      )
    ).toBe(2)
  })

  it("adds Chinese and non-Chinese reading durations", () => {
    const english = Array.from({ length: 200 }, (_, index) => `word${index}`).join(" ")

    expect(estimateReadingTimeFromMarkdown(`${"猪".repeat(400)} ${english}`)).toBe(2)
  })

  it("ignores code and image syntax while retaining visible link labels", () => {
    const markdown = [
      "[visible label](https://example.com/hidden-destination)",
      "![ignored alt text](https://example.com/image.png)",
      "`ignored inline code`",
      "```ts",
      "ignored fenced code",
      "```",
    ].join("\n")

    expect(estimateReadingTimeFromMarkdown(markdown)).toBe(1)
  })

  it("returns zero when no readable content remains", () => {
    expect(estimateReadingTimeFromMarkdown("```ts\nconst value = 1\n```")).toBe(0)
    expect(estimateReadingTimeFromMarkdown(undefined)).toBe(0)
  })
})
````

- [ ] **Step 2: Run the new tests and confirm they fail**

Run:

```bash
pnpm --filter admin test:run src/utils/__tests__/readingTime.test.ts
```

Expected: FAIL because `apps/admin/src/utils/readingTime.ts` does not exist.

- [ ] **Step 3: Implement the pure estimator**

Create `apps/admin/src/utils/readingTime.ts`:

````ts
const HAN_CHARACTERS_PER_MINUTE = 400
const WORDS_PER_MINUTE = 200

const normalizeMarkdown = (markdown: string): string =>
  markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^>\s+/gm, " ")
    .replace(/^#{1,6}\s+/gm, " ")
    .replace(/[*_~#>-]/g, " ")

export const estimateReadingTimeFromMarkdown = (value: unknown): number => {
  if (typeof value !== "string" || !value.trim()) {
    return 0
  }

  const plainText = normalizeMarkdown(value)
  const hanCharacterCount = plainText.match(/\p{Script=Han}/gu)?.length ?? 0
  const nonHanText = plainText.replace(/\p{Script=Han}/gu, " ")
  const wordCount = nonHanText
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => /[\p{L}\p{N}]/u.test(word)).length
  const readingMinutes =
    hanCharacterCount / HAN_CHARACTERS_PER_MINUTE + wordCount / WORDS_PER_MINUTE

  return readingMinutes > 0 ? Math.ceil(readingMinutes) : 0
}
````

- [ ] **Step 4: Run the utility tests and confirm they pass**

Run:

```bash
pnpm --filter admin test:run src/utils/__tests__/readingTime.test.ts
```

Expected: PASS with five tests.

- [ ] **Step 5: Commit the estimator**

```bash
git add apps/admin/src/utils/readingTime.ts apps/admin/src/utils/__tests__/readingTime.test.ts
git commit -m "fix: calculate multilingual reading time"
```

## Task 2: Derive reading time from locale-resolved Payload content

**Files:**

- Modify: `apps/admin/src/collections/Posts.ts`
- Create: `apps/admin/src/collections/__tests__/readingTime.test.ts`

- [ ] **Step 1: Write a failing collection configuration test**

Create `apps/admin/src/collections/__tests__/readingTime.test.ts`:

```ts
import type { Field } from "payload"
import { describe, expect, it, vi } from "vitest"

vi.mock("../../hooks/revalidateWww", () => ({
  createRevalidationHook: vi.fn(() => vi.fn()),
}))

import { Posts } from "../Posts"

const findField = (fields: Field[], fieldName: string): Field | undefined => {
  for (const field of fields) {
    if ("name" in field && field.name === fieldName) {
      return field
    }

    if ("fields" in field && Array.isArray(field.fields)) {
      const nestedField = findField(field.fields, fieldName)

      if (nestedField) {
        return nestedField
      }
    }
  }
}

describe("Posts readingTime field", () => {
  it("derives a virtual value from the locale-resolved sibling content", async () => {
    const field = findField(Posts.fields, "readingTime")

    expect(field).toBeDefined()
    expect(field).toMatchObject({ type: "number", virtual: true })
    expect(field && "hooks" in field ? field.hooks?.beforeChange : undefined).toBeUndefined()

    if (!field || !("hooks" in field) || !field.hooks?.afterRead?.[0]) {
      throw new Error("Expected readingTime to define an afterRead hook")
    }

    const hook = field.hooks.afterRead[0]

    expect(
      await hook({
        siblingData: { content: "猪".repeat(800) },
      } as never)
    ).toBe(2)
  })
})
```

- [ ] **Step 2: Run the collection test and confirm it fails**

Run:

```bash
pnpm --filter admin test:run src/collections/__tests__/readingTime.test.ts
```

Expected: FAIL because `readingTime` is still persisted and uses `beforeChange`.

- [ ] **Step 3: Replace the write hook with a virtual read hook**

In `apps/admin/src/collections/Posts.ts`:

1. Import `estimateReadingTimeFromMarkdown` from `@/utils/readingTime`.
2. Remove the collection-local `getLocalizedContent` and `estimateReadingTimeFromMarkdown` helpers.
3. Replace the `readingTime` field configuration with:

```ts
{
  name: "readingTime",
  type: "number",
  virtual: true,
  admin: {
    description: "Estimated reading time in minutes",
    readOnly: true,
  },
  hooks: {
    afterRead: [
      ({ siblingData }) => estimateReadingTimeFromMarkdown(siblingData.content),
    ],
  },
}
```

Payload resolves localized sibling fields before the field-level `afterRead` hook, so `siblingData.content` is the requested locale or Payload's configured fallback value rather than the complete locale map.

- [ ] **Step 4: Run collection and regression tests**

Run:

```bash
pnpm --filter admin test:run src/collections/__tests__/readingTime.test.ts src/collections/__tests__/postSections.test.ts
```

Expected: PASS. The new test proves the virtual hook wiring; the existing section tests guard the surrounding Posts configuration.

- [ ] **Step 5: Commit the Payload integration**

```bash
git add apps/admin/src/collections/Posts.ts apps/admin/src/collections/__tests__/readingTime.test.ts
git commit -m "fix: derive reading time for each locale"
```

## Task 3: Document the localized derived-field rule and verify the change

**Files:**

- Modify: `docs/payload-cms-patterns.md`

- [ ] **Step 1: Document the project convention**

Add a concise section to `docs/payload-cms-patterns.md`:

```md
## Locale-Dependent Derived Fields

Do not persist a shared scalar when its value depends on localized content. Define it as a virtual field and derive it in `afterRead` from the locale-resolved sibling value. This keeps the API shape stable while allowing the requested locale and Payload fallback behavior to determine the result without a data migration.
```

- [ ] **Step 2: Run all focused tests**

Run:

```bash
pnpm --filter admin test:run src/utils/__tests__/readingTime.test.ts src/collections/__tests__/readingTime.test.ts src/collections/__tests__/postSections.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run the full admin test suite**

Run:

```bash
pnpm --filter admin test:run
```

Expected: PASS.

- [ ] **Step 4: Run type and lint verification**

Run:

```bash
pnpm --filter admin check-types
pnpm lint
```

Expected: both commands exit successfully. Existing non-blocking environment-substitution warnings may remain, but there must be no new errors.

- [ ] **Step 5: Review the final diff**

Run:

```bash
git diff --check
git status --short
git diff origin/master...HEAD
```

Expected: no whitespace errors; only the reading-time implementation, tests, and Payload convention documentation are changed.

- [ ] **Step 6: Commit the documentation**

```bash
git add docs/payload-cms-patterns.md
git commit -m "docs: document localized derived fields"
```

- [ ] **Step 7: Re-run final verification after all commits**

Run:

```bash
pnpm --filter admin test:run
pnpm --filter admin check-types
pnpm lint
git status --short
```

Expected: all verification commands pass and the worktree is clean.
