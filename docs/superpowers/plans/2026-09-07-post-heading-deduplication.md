# Post Heading Deduplication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give post detail pages one canonical `h1`, prevent level-one headings in post Markdown, and remove the duplicated heading from the affected production article.

**Architecture:** Keep the shared post title reusable by making its semantic element explicit while retaining `h2` as the safe list-card default. Add a focused Payload Markdown validator that composes with Payload's built-in textarea validation, then attach it only to post content. Repair the single production document through the configured production Payload MCP with read-before-write and read-after-write verification.

**Tech Stack:** React 19, Next.js 15, TypeScript, Vitest, Payload CMS 3.88, pnpm/Turborepo

---

## File map

- Create `apps/www/src/__tests__/postTitle.test.tsx`: verifies the shared title's default and detail-page heading elements.
- Modify `packages/ui/src/components/Post/Post.tsx`: adds the narrow `as="h1" | "h2"` title API.
- Modify `apps/www/src/components/posts/PostSectionArticle.tsx`: opts the canonical detail title into `h1` for both section article routes.
- Create `apps/admin/src/collections/posts/validatePostContent.ts`: detects forbidden body-level `h1` headings and composes with Payload textarea validation.
- Create `apps/admin/src/collections/posts/__tests__/validatePostContent.test.ts`: covers accepted and rejected Markdown forms.
- Create `apps/admin/src/collections/__tests__/Posts.test.ts`: verifies the Posts schema wires in the validator and an `h2`-based placeholder.
- Modify `apps/admin/src/fields/markdownField.ts`: allows callers to supply a typed textarea validator.
- Modify `apps/admin/src/collections/Posts.ts`: attaches the post validator and removes the misleading `h1` placeholder.
- Update production Payload post `6a9e5650926cdf8d848318c0`, locale `zh-CN`: removes only the leading duplicate title line from `content`.

### Task 1: Render the detail title as `h1` without changing list cards

**Files:**

- Create: `apps/www/src/__tests__/postTitle.test.tsx`
- Modify: `packages/ui/src/components/Post/Post.tsx:38-46`
- Modify: `apps/www/src/components/posts/PostSectionArticle.tsx:224-230`

- [ ] **Step 1: Write the failing component test**

```tsx
import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { PostTitle } from "@repo/ui/components/Post"

describe("PostTitle", () => {
  it("defaults to an h2 for post cards", () => {
    const markup = renderToStaticMarkup(<PostTitle>Card title</PostTitle>)

    expect(markup).toMatch(/^<h2\b/)
  })

  it("renders an h1 for a post detail title", () => {
    const markup = renderToStaticMarkup(<PostTitle as="h1">Detail title</PostTitle>)

    expect(markup).toMatch(/^<h1\b/)
    expect(markup).not.toContain('as="h1"')
  })
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
pnpm --filter www test:run src/__tests__/postTitle.test.tsx
```

Expected: the default test passes and the detail test fails because `PostTitle` still renders `h2` and forwards `as` as an HTML attribute.

- [ ] **Step 3: Implement the narrow semantic-element API**

Replace the current `PostTitle` implementation with:

```tsx
interface PostTitleProps extends Omit<React.ComponentPropsWithoutRef<"h2">, "as"> {
  as?: "h1" | "h2"
}

function PostTitle({ as: Component = "h2", className, ...props }: PostTitleProps) {
  return (
    <Component
      data-slot="post-title"
      className={cn("text-2xl font-bold leading-tight tracking-tight md:text-3xl", className)}
      {...props}
    />
  )
}
```

Change the detail route call site to:

```tsx
<PostTitle as="h1" className="text-4xl md:text-5xl">
  {postTitle}
</PostTitle>
```

Do not change the post index call site; it must retain the default `h2`.

- [ ] **Step 4: Run the focused test and type checks and verify GREEN**

Run:

```bash
pnpm --filter www test:run src/__tests__/postTitle.test.tsx
pnpm --filter @repo/ui check-types
pnpm --filter www check-types
```

Expected: both PostTitle tests pass and both type checks exit successfully.

- [ ] **Step 5: Commit the semantic heading change**

```bash
git add apps/www/src/__tests__/postTitle.test.tsx packages/ui/src/components/Post/Post.tsx apps/www/src/components/posts/PostSectionArticle.tsx
git commit -m "fix(posts): use h1 for article titles"
```

### Task 2: Detect level-one headings in post Markdown

**Files:**

- Create: `apps/admin/src/collections/posts/validatePostContent.ts`
- Create: `apps/admin/src/collections/posts/__tests__/validatePostContent.test.ts`

- [ ] **Step 1: Write failing validator tests**

````ts
import { describe, expect, it } from "vitest"

import { validatePostMarkdownBody } from "../validatePostContent"

const errorMessage =
  "The post title is managed by the Title field. Start body sections with ## instead of using an H1."

describe("validatePostMarkdownBody", () => {
  it.each([
    "Intro paragraph\n\n## Section",
    "Intro paragraph\n\n### Subsection",
    "```md\n# Example heading\n```\n\n## Real section",
    "~~~html\n<h1>Example</h1>\n~~~\n\nBody",
  ])("accepts body Markdown without an h1", (content) => {
    expect(validatePostMarkdownBody(content)).toBe(true)
  })

  it.each([
    "# Duplicate title\n\nBody",
    "Duplicate title\n===\n\nBody",
    "<h1>Duplicate title</h1>\n\nBody",
    '<h1 class="title">Duplicate title</h1>\n\nBody',
  ])("rejects body Markdown containing an h1", (content) => {
    expect(validatePostMarkdownBody(content)).toBe(errorMessage)
  })
})
````

- [ ] **Step 2: Run the focused validator test and verify RED**

Run:

```bash
pnpm --filter admin test:run src/collections/posts/__tests__/validatePostContent.test.ts
```

Expected: FAIL because `validatePostContent.ts` does not exist.

- [ ] **Step 3: Implement the minimal Markdown scanner and Payload validator**

Create `validatePostContent.ts` with:

```ts
import { validations, type TextareaFieldValidation } from "payload"

export const POST_CONTENT_H1_ERROR =
  "The post title is managed by the Title field. Start body sections with ## instead of using an H1."

type Fence = {
  character: "`" | "~"
  length: number
}

function findFence(line: string): { marker: string; remainder: string } | null {
  const match = /^\s{0,3}(`{3,}|~{3,})(.*)$/.exec(line)

  return match ? { marker: match[1], remainder: match[2] } : null
}

export function validatePostMarkdownBody(value: unknown): true | string {
  if (typeof value !== "string" || !value.trim()) return true

  let fence: Fence | null = null
  let previousLineHasText = false

  for (const line of value.split(/\r?\n/)) {
    const fenceMatch = findFence(line)

    if (fenceMatch) {
      const character = fenceMatch.marker[0] as Fence["character"]
      if (!fence) {
        fence = { character, length: fenceMatch.marker.length }
        previousLineHasText = false
        continue
      }

      if (
        character === fence.character &&
        fenceMatch.marker.length >= fence.length &&
        !fenceMatch.remainder.trim()
      ) {
        fence = null
      }
      continue
    }

    if (fence) continue

    if (/^\s{0,3}#(?:\s|$)/.test(line) || /<h1(?:\s|>)/i.test(line)) {
      return POST_CONTENT_H1_ERROR
    }

    if (previousLineHasText && /^\s{0,3}=+\s*$/.test(line)) {
      return POST_CONTENT_H1_ERROR
    }

    previousLineHasText = Boolean(line.trim())
  }

  return true
}

export const validatePostContent: TextareaFieldValidation = async (value, options) => {
  const textareaResult = await validations.textarea(value, options)

  return textareaResult === true ? validatePostMarkdownBody(value) : textareaResult
}
```

- [ ] **Step 4: Run the focused test and admin type check and verify GREEN**

Run:

```bash
pnpm --filter admin test:run src/collections/posts/__tests__/validatePostContent.test.ts
pnpm --filter admin check-types
```

Expected: all validator cases pass and the admin type check exits successfully.

- [ ] **Step 5: Commit the validator**

```bash
git add apps/admin/src/collections/posts/validatePostContent.ts apps/admin/src/collections/posts/__tests__/validatePostContent.test.ts
git commit -m "feat(admin): validate post body heading levels"
```

### Task 3: Wire validation into the Posts schema and remove the misleading placeholder

**Files:**

- Create: `apps/admin/src/collections/__tests__/Posts.test.ts`
- Modify: `apps/admin/src/fields/markdownField.ts:1-37`
- Modify: `apps/admin/src/collections/Posts.ts:1-130`

- [ ] **Step 1: Write the failing schema contract test**

```ts
import { describe, expect, it } from "vitest"

import { Posts } from "../Posts"
import { validatePostContent } from "../posts/validatePostContent"

describe("Posts content field", () => {
  it("uses post heading validation and an h2 section placeholder", () => {
    const contentField = Posts.fields.find((field) => "name" in field && field.name === "content")

    expect(contentField).toMatchObject({
      admin: {
        placeholder: "## Start with a section heading\n\nWrite the article body here.",
      },
      type: "textarea",
      validate: validatePostContent,
    })
  })
})
```

- [ ] **Step 2: Run the schema test and verify RED**

Run:

```bash
pnpm --filter admin test:run src/collections/__tests__/Posts.test.ts
```

Expected: FAIL because the content field still has the `# Write your post` placeholder and no validator.

- [ ] **Step 3: Add typed validator support to `markdownField`**

Replace `apps/admin/src/fields/markdownField.ts` with this complete implementation:

```ts
import type { Field, TextareaFieldValidation } from "payload"

interface MarkdownFieldArgs {
  name: string
  label?: string
  required?: boolean
  localized?: boolean
  defaultValue?: string
  relationTo?: string
  validate?: TextareaFieldValidation
  admin?: {
    description?: string
    placeholder?: string
    position?: "sidebar"
    rows?: number
  }
}

export const markdownField = ({
  name,
  label = "Markdown",
  required = false,
  localized = false,
  defaultValue = "",
  relationTo = "media",
  validate,
  admin,
}: MarkdownFieldArgs): Field => ({
  name,
  type: "textarea",
  label,
  required,
  localized,
  defaultValue,
  validate,
  admin: {
    ...admin,
    components: {
      Field: "/components/fields/MarkdownField/index#default",
    },
  },
  custom: {
    mediaRelationTo: relationTo,
  },
})
```

- [ ] **Step 4: Attach the validator and replace the placeholder**

Import the validator in `Posts.ts`:

```ts
import { validatePostContent } from "./posts/validatePostContent"
```

Update only the `content` Markdown field call:

```ts
markdownField({
  name: "content",
  label: "Content",
  required: true,
  localized: true,
  validate: validatePostContent,
  admin: {
    description: "Main article content written in Markdown. Start sections at H2.",
    placeholder: "## Start with a section heading\n\nWrite the article body here.",
    rows: 24,
  },
})
```

- [ ] **Step 5: Run the schema, validator, and type checks and verify GREEN**

Run:

```bash
pnpm --filter admin test:run src/collections/__tests__/Posts.test.ts src/collections/posts/__tests__/validatePostContent.test.ts
pnpm --filter admin check-types
```

Expected: both suites pass and the admin type check exits successfully.

- [ ] **Step 6: Commit the schema guard**

```bash
git add apps/admin/src/collections/__tests__/Posts.test.ts apps/admin/src/fields/markdownField.ts apps/admin/src/collections/Posts.ts
git commit -m "fix(admin): prevent h1 headings in post content"
```

### Task 4: Run repository-level verification

**Files:** No new files.

- [ ] **Step 1: Run all relevant tests**

```bash
pnpm --filter www test:run
pnpm --filter admin test:run
```

Expected: all www and admin Vitest suites pass.

- [ ] **Step 2: Run lint and type checks across the workspace**

```bash
pnpm lint
pnpm check-types
```

Expected: all Turborepo tasks complete successfully with no errors.

- [ ] **Step 3: Inspect the final scoped diff**

```bash
git status --short
git diff origin/master...HEAD -- apps/www/src/__tests__/postTitle.test.tsx packages/ui/src/components/Post/Post.tsx apps/www/src/components/posts/PostSectionArticle.tsx apps/admin/src/collections/posts/validatePostContent.ts apps/admin/src/collections/posts/__tests__/validatePostContent.test.ts apps/admin/src/collections/__tests__/Posts.test.ts apps/admin/src/fields/markdownField.ts apps/admin/src/collections/Posts.ts
```

Expected: only the planned heading and validation changes are present; the pre-existing untracked `.superpowers/` directory remains untouched.

### Task 5: Repair and verify the production article

**Target:** Production Payload collection `posts`, document `6a9e5650926cdf8d848318c0`, locale `zh-CN`, slug `my-hog-cycle-trading-framework`.

- [ ] **Step 1: Read the target again immediately before mutation**

Call production `findPosts` with:

```json
{
  "id": "6a9e5650926cdf8d848318c0",
  "locale": "zh-CN",
  "depth": 0,
  "select": "{\"id\":true,\"title\":true,\"slug\":true,\"content\":true,\"status\":true,\"_status\":true,\"publishedAt\":true,\"updatedAt\":true}"
}
```

Expected: exactly the identified published article, whose content begins with `# 等待猪价向上：我的猪周期看多逻辑与标的选择` followed by a blank line and the original first paragraph.

- [ ] **Step 2: Review the exact field-level patch**

Construct the new `content` from the just-read value by removing exactly this prefix:

```text
# 等待猪价向上：我的猪周期看多逻辑与标的选择

```

The new content must begin:

```text
2026年二季度末，全国能繁母猪存栏下降至3780万头，同比减少6.5%；但在同一个上半年，生猪出栏仍增长1.7%，猪肉产量增长3.3%。
```

Before writing, compare the old and new strings and confirm the only deletion is the exact Markdown prefix above. Do not send title, status, tags, dates, or any other field in the update.

- [ ] **Step 3: Patch only the localized content**

Let `currentContent` be the exact `content` string returned in Step 1 and let `duplicatePrefix` be the exact two-line prefix from Step 2. Assert `currentContent.startsWith(duplicatePrefix)`, then set `updatedContent = currentContent.slice(duplicatePrefix.length)`. Call production `updatePosts` with the following fixed fields and supply `updatedContent` as the `content` argument:

```json
{
  "id": "6a9e5650926cdf8d848318c0",
  "locale": "zh-CN",
  "depth": 0,
  "overrideLock": false
}
```

Expected: one updated post. If the document is locked, stop instead of overriding the lock.

- [ ] **Step 4: Read back and verify the stored document**

Repeat the exact `findPosts` call from Step 1. Confirm:

- `id`, `title`, `slug`, `status`, `_status`, and `publishedAt` match the pre-write values;
- `content` begins with the original first paragraph;
- `content` does not contain an ATX, setext, or raw HTML `h1`;
- all remaining content matches the pre-write content byte-for-byte after the removed prefix;
- `updatedAt` is the only expected metadata change.

- [ ] **Step 5: Verify the public content response**

After Payload revalidation completes, load the Chinese post route for slug `my-hog-cycle-trading-framework` and confirm the duplicate body heading is absent. The deployed frontend will use `h1` for the canonical title after the code change is released; before that release, the duplicate is still removed but the existing deployed title remains `h2`.
