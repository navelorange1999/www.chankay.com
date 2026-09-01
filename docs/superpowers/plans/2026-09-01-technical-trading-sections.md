# Technical and Trading Post Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the existing Posts experience into CMS-driven Technical and Trading sections with dedicated archive and article URLs, compatibility redirects, and a local MCP-backed preview.

**Architecture:** Keep Payload Posts as the only article collection and use the existing `primaryTag` relationship as the public section discriminator. Add shared section-aware service, route, rendering, SEO, and revalidation helpers; expose them through thin Technical and Trading App Router files. Preserve old `/posts` URLs as permanent redirects and perform all preview content writes through `local-chankay-payload` only.

**Tech Stack:** Next.js 15 App Router, React Server Components, Payload CMS 3.88, TypeScript, Vitest, `@repo/i18n`, Payload MCP, pnpm/Turborepo

---

## File Map

### New files

- `apps/admin/src/collections/__tests__/postSections.test.ts` — contract tests for the required primary Tag and Tag revalidation hook.
- `apps/www/src/utils/postSections.ts` — section registry, Post classification, and locale-aware section path helpers.
- `apps/www/src/utils/__tests__/postSections.test.ts` — unit tests for classification and URL behavior.
- `apps/www/src/services/payload/tags.ts` — Tag lookup by slug.
- `apps/www/src/services/payload/__tests__/postSections.test.ts` — service tests for safe Tag resolution and section filtering.
- `apps/www/src/components/posts/PostSectionArchive.tsx` — shared Technical/Trading archive renderer.
- `apps/www/src/components/posts/__tests__/PostSectionArchive.test.tsx` — server-rendered archive and empty-state tests.
- `apps/www/src/components/posts/PostSectionArticle.tsx` — shared Technical/Trading article renderer.
- `apps/www/src/app/[locale]/(frontend)/technical/page.tsx` — Technical archive route.
- `apps/www/src/app/[locale]/(frontend)/technical/[slug]/page.tsx` — Technical article route.
- `apps/www/src/app/[locale]/(frontend)/trading/page.tsx` — Trading archive route.
- `apps/www/src/app/[locale]/(frontend)/trading/[slug]/page.tsx` — Trading article route.
- `apps/www/src/utils/sitemap.ts` — pure sitemap path helpers.
- `apps/www/src/utils/__tests__/sitemap.test.ts` — sitemap section-path tests.
- `apps/www/src/app/api/revalidate/__tests__/route.test.ts` — section-aware revalidation tests.

### Modified files

- `packages/i18n/src/route-domains.ts` — add Technical and Trading route domains.
- `packages/i18n/src/strings.ts` — replace Posts-specific behavioral strings with section-neutral strings.
- `packages/i18n/src/__tests__/i18n.test.ts` — cover both route domains and localized section strings.
- `apps/admin/src/collections/Posts.ts` — require `primaryTag`.
- `apps/admin/src/collections/Tags.ts` — trigger frontend revalidation after Tag changes.
- `packages/typescript-config/typings/payload-types.ts` — regenerate after the schema change.
- `apps/www/src/services/payload/posts.ts` — add section-filtered Post queries and explicit relationship depth.
- `apps/www/src/services/payload/index.ts` — export Tag services.
- `apps/www/src/app/[locale]/(frontend)/posts/page.tsx` — replace the old archive with a permanent redirect.
- `apps/www/src/app/[locale]/(frontend)/posts/[slug]/page.tsx` — replace the old article with a section-aware permanent redirect.
- `apps/www/src/app/sitemap.ts` — emit section URLs instead of `/posts` URLs.
- `apps/www/src/app/api/revalidate/route.ts` — revalidate Technical and Trading caches and paths.
- `docs/proposals/multilingual-architecture.md` — document the new route domains and compatibility redirects.

## Execution Prerequisite

Use Node from the repository `.nvmrc` before every pnpm command:

```bash
nvm use
node --version
pnpm --version
```

Expected: Node `v22.13.0` and pnpm `11.23.0`.

At execution time, create an isolated worktree with `superpowers:using-git-worktrees`. Do not add the existing `.superpowers/` visual-companion artifacts to any commit.

### Task 1: Define Section Domains and Paths

**Files:**

- Modify: `packages/i18n/src/route-domains.ts`
- Modify: `packages/i18n/src/strings.ts`
- Modify: `packages/i18n/src/__tests__/i18n.test.ts`
- Create: `apps/www/src/utils/postSections.ts`
- Create: `apps/www/src/utils/__tests__/postSections.test.ts`

- [ ] **Step 1: Add failing i18n route-domain tests**

Extend `packages/i18n/src/__tests__/i18n.test.ts` imports with `buildRouteIndexAlternates`, `resolveRouteIndexPath`, and `resolveRoutePath`, then add:

```typescript
describe("post section routes", () => {
  it("builds Technical and Trading index and article paths", () => {
    expect(resolveRouteIndexPath("technical", "en")).toBe("/technical")
    expect(resolveRouteIndexPath("trading", "zh-CN")).toBe("/zh-CN/trading")
    expect(resolveRoutePath("technical", "architecture", "en")).toBe("/technical/architecture")
    expect(resolveRoutePath("trading", "market-view", "zh-CN")).toBe("/zh-CN/trading/market-view")
  })

  it("builds section-specific alternates", () => {
    expect(
      buildRouteIndexAlternates({
        currentLocale: "zh-CN",
        domain: "trading",
        siteUrl: "https://www.chankay.com",
      })
    ).toEqual({
      canonical: "https://www.chankay.com/zh-CN/trading",
      languages: {
        en: "https://www.chankay.com/trading",
        "zh-CN": "https://www.chankay.com/zh-CN/trading",
        "x-default": "https://www.chankay.com/trading",
      },
    })
  })
})
```

- [ ] **Step 2: Run the i18n test and verify it fails**

Run:

```bash
pnpm --filter @repo/i18n test:run -- src/__tests__/i18n.test.ts
```

Expected: TypeScript or runtime failure because `technical` and `trading` are not route-domain keys.

- [ ] **Step 3: Add the route domains and section-neutral UI strings**

Add two entries after the existing `posts` compatibility domain in
`packages/i18n/src/route-domains.ts`. Keep `posts` until Task 6 replaces the old route modules so
every intermediate commit remains type-safe:

```typescript
	technical: {
		basePath: "technical",
		collection: "posts",
		index: true,
		key: "technical",
		kind: "collection",
		slugField: "slug",
	},
	trading: {
		basePath: "trading",
		collection: "posts",
		index: true,
		key: "trading",
		kind: "collection",
		slugField: "slug",
	},
```

In `packages/i18n/src/strings.ts`, add the new section-neutral fields while retaining
`article.backToPosts` and the existing `posts` group until Task 6:

```typescript
export type UiStrings = {
  article: {
    backToPosts: string
    backToSection: string
    onThisPage: string
  }
  notFound: {
    description: string
    title: string
  }
  postSection: {
    emptyState: string
    eyebrow: string
    readPost: string
  }
  posts: {
    description: string
    emptyState: string
    eyebrow: string
    readPost: string
    title: string
  }
  untitledPost: string
}
```

Use these exact locale values:

```typescript
// en
article: { backToSection: "Back to section", onThisPage: "On this page" },
postSection: {
	emptyState: "No published articles in this section yet.",
	eyebrow: "Writing",
	readPost: "Read article",
},

// zh-CN
article: { backToSection: "返回板块", onThisPage: "本文目录" },
postSection: {
	emptyState: "该板块暂无已发布文章。",
	eyebrow: "文章",
	readPost: "阅读文章",
},
```

Add interface-string assertions for `postSection.readPost` and `article.backToSection`; retain the
existing Posts assertions until Task 6.

- [ ] **Step 4: Write failing Post section utility tests**

Create `apps/www/src/utils/__tests__/postSections.test.ts`:

```typescript
import { describe, expect, it } from "vitest"

import { getPostSection, resolvePostSectionPath, type SectionablePost } from "../postSections"

function post(primaryTag: SectionablePost["primaryTag"]): SectionablePost {
  return { primaryTag }
}

describe("post sections", () => {
  it("recognizes populated Technical and Trading primary Tags", () => {
    expect(getPostSection(post({ id: "technical-id", slug: "technical" }))).toBe("technical")
    expect(getPostSection(post({ id: "trading-id", slug: "trading" }))).toBe("trading")
  })

  it("uses Technical only for legacy Posts without a primary Tag", () => {
    expect(getPostSection(post(null))).toBe("technical")
    expect(getPostSection(post(undefined))).toBe("technical")
  })

  it("rejects unknown or unpopulated relationships", () => {
    expect(getPostSection(post("tag-id"))).toBeNull()
    expect(getPostSection(post({ id: "other-id", slug: "other" }))).toBeNull()
  })

  it("builds localized section index and detail paths", () => {
    expect(resolvePostSectionPath("technical", undefined, "en")).toBe("/technical")
    expect(resolvePostSectionPath("trading", "market-view", "zh-CN")).toBe(
      "/zh-CN/trading/market-view"
    )
  })
})
```

- [ ] **Step 5: Run the utility test and verify it fails**

Run:

```bash
pnpm --filter www test:run -- src/utils/__tests__/postSections.test.ts
```

Expected: FAIL because `apps/www/src/utils/postSections.ts` does not exist.

- [ ] **Step 6: Implement the section registry and helpers**

Create `apps/www/src/utils/postSections.ts`:

```typescript
import {
  DEFAULT_LOCALE,
  resolveRouteIndexPath,
  resolveRoutePath,
  type RouteDomainKey,
  type SupportedLocale,
} from "@repo/i18n"

export const POST_SECTIONS = {
  technical: { domain: "technical", tagSlug: "technical" },
  trading: { domain: "trading", tagSlug: "trading" },
} as const satisfies Record<string, { domain: RouteDomainKey; tagSlug: string }>

export type PostSection = keyof typeof POST_SECTIONS

export type SectionablePost = {
  primaryTag?: null | string | { id: string | number; slug?: null | string }
}

export function getPostSection(post: SectionablePost): PostSection | null {
  if (!post.primaryTag) return "technical"
  if (typeof post.primaryTag === "string") return null

  const slug = post.primaryTag.slug?.trim().toLowerCase()
  return slug === "technical" || slug === "trading" ? slug : null
}

export function resolvePostSectionPath(
  section: PostSection,
  slug?: null | string,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  const domain = POST_SECTIONS[section].domain
  return slug ? resolveRoutePath(domain, slug, locale) : resolveRouteIndexPath(domain, locale)
}
```

- [ ] **Step 7: Run focused tests and commit**

Run:

```bash
pnpm --filter @repo/i18n test:run -- src/__tests__/i18n.test.ts
pnpm --filter www test:run -- src/utils/__tests__/postSections.test.ts
```

Expected: both commands PASS.

Commit:

```bash
git add packages/i18n/src apps/www/src/utils/postSections.ts apps/www/src/utils/__tests__/postSections.test.ts
git commit -m "feat(www): define technical and trading sections"
```

### Task 2: Enforce the Payload Section Contract

**Files:**

- Create: `apps/admin/src/collections/__tests__/postSections.test.ts`
- Modify: `apps/admin/src/collections/Posts.ts:194-213`
- Modify: `apps/admin/src/collections/Tags.ts:1-4,98-100`
- Modify: `packages/typescript-config/typings/payload-types.ts`

- [ ] **Step 1: Write failing collection contract tests**

Create `apps/admin/src/collections/__tests__/postSections.test.ts`:

```typescript
import { describe, expect, it } from "vitest"

import { Posts } from "../Posts"
import { Tags } from "../Tags"

describe("Post section collection contracts", () => {
  it("requires one primary Tag for every Post", () => {
    const primaryTag = Posts.fields.find((field) => "name" in field && field.name === "primaryTag")

    expect(primaryTag).toMatchObject({
      name: "primaryTag",
      relationTo: "tags",
      required: true,
      type: "relationship",
    })
  })

  it("revalidates the frontend after Tag changes", () => {
    expect(Tags.hooks?.afterChange).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run the contract test and verify it fails**

Run:

```bash
pnpm --filter admin test:run -- src/collections/__tests__/postSections.test.ts
```

Expected: FAIL because `primaryTag.required` and `Tags.hooks.afterChange` are absent.

- [ ] **Step 3: Require `primaryTag` and add Tag revalidation**

Update the `primaryTag` field in `Posts.ts`:

```typescript
{
	name: "primaryTag",
	type: "relationship",
	relationTo: "tags",
	required: true,
	admin: {
		position: "sidebar",
		description: "Primary public section for this Post",
	},
},
```

Update `Tags.ts` imports and hooks:

```typescript
import { createRevalidationHook } from "../hooks/revalidateWww"

hooks: {
	beforeChange: [createBasicTranslationHook()],
	afterChange: [createRevalidationHook("tags")],
},
```

- [ ] **Step 4: Regenerate Payload types**

Run:

```bash
pnpm --filter admin gen:types
```

Expected: `Post.primaryTag` in `packages/typescript-config/typings/payload-types.ts` becomes required while preserving the relationship union.

- [ ] **Step 5: Run focused tests and type checks**

Run:

```bash
pnpm --filter admin test:run -- src/collections/__tests__/postSections.test.ts
pnpm --filter admin check-types
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/admin/src/collections/Posts.ts apps/admin/src/collections/Tags.ts apps/admin/src/collections/__tests__/postSections.test.ts packages/typescript-config/typings/payload-types.ts
git commit -m "feat(admin): require a primary post section"
```

### Task 3: Add Safe Section-Aware Payload Services

**Files:**

- Create: `apps/www/src/services/payload/tags.ts`
- Create: `apps/www/src/services/payload/__tests__/postSections.test.ts`
- Modify: `apps/www/src/services/payload/posts.ts`
- Modify: `apps/www/src/services/payload/index.ts`

- [ ] **Step 1: Write failing service tests**

Create `apps/www/src/services/payload/__tests__/postSections.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest"

import { payloadClient } from "@/utils/payloadClient"
import { getPostBySlugForSection, getPostsBySection } from "../posts"

vi.mock("@/utils/payloadClient", () => ({
  payloadClient: {
    getBySlug: vi.fn(),
    getCollection: vi.fn(),
  },
}))

const mockedClient = vi.mocked(payloadClient)

describe("getPostsBySection", () => {
  beforeEach(() => vi.clearAllMocks())

  it("resolves the Tag before filtering Posts by relationship id", async () => {
    mockedClient.getBySlug.mockResolvedValue({ id: "trading-id", slug: "trading" })
    mockedClient.getCollection
      .mockResolvedValueOnce({
        docs: [{ id: "post-1", slug: "market-view" }],
        limit: 100,
        page: 1,
        totalDocs: 101,
      })
      .mockResolvedValueOnce({
        docs: [{ id: "post-2", slug: "risk-review" }],
        limit: 100,
        page: 2,
        totalDocs: 101,
      })

    const posts = await getPostsBySection("trading", { locale: "en" })

    expect(posts).toHaveLength(2)
    expect(mockedClient.getCollection).toHaveBeenCalledWith(
      "posts",
      expect.objectContaining({
        depth: 2,
        where: {
          primaryTag: { equals: "trading-id" },
          status: { equals: "published" },
        },
      })
    )
  })

  it("returns an empty result without querying Posts when the Tag is missing", async () => {
    mockedClient.getBySlug.mockResolvedValue(null)

    await expect(getPostsBySection("trading", { locale: "en" })).resolves.toEqual([])
    expect(mockedClient.getCollection).not.toHaveBeenCalled()
  })

  it("rejects an article that belongs to another section", async () => {
    mockedClient.getCollection.mockResolvedValue({
      docs: [
        {
          id: "post-id",
          primaryTag: { id: "trading-id", slug: "trading" },
          slug: "market-view",
        },
      ],
      limit: 1,
      page: 1,
      totalDocs: 1,
    })

    await expect(
      getPostBySlugForSection("market-view", "technical", { locale: "en" })
    ).resolves.toBeNull()
  })
})
```

- [ ] **Step 2: Run the service test and verify it fails**

Run:

```bash
pnpm --filter www test:run -- src/services/payload/__tests__/postSections.test.ts
```

Expected: FAIL because `getPostsBySection` does not exist.

- [ ] **Step 3: Implement Tag lookup**

Create `apps/www/src/services/payload/tags.ts`:

```typescript
import { DEFAULT_LOCALE, type SupportedLocale } from "@repo/i18n"
import type { Tag } from "@repo/typescript-config/typings/payload-types"

import { payloadClient } from "@/utils/payloadClient"

export async function getTagBySlug(
  slug: string,
  options?: { locale?: SupportedLocale }
): Promise<Tag | null> {
  const locale = options?.locale ?? DEFAULT_LOCALE
  try {
    return await payloadClient.getBySlug<Tag>("tags", slug, {
      locale,
      depth: 0,
      tags: [`tag:${slug}:${locale}`],
    })
  } catch (error) {
    console.error(`Error fetching Tag ${slug}:`, error)
    return null
  }
}
```

- [ ] **Step 4: Implement section-filtered Post queries**

Add to `apps/www/src/services/payload/posts.ts`:

```typescript
import type { PostSection } from "@/utils/postSections"
import { isPostInSection, POST_SECTIONS } from "@/utils/postSections"
import { getTagBySlug } from "./tags"

export async function getPostBySlugForSection(
  slug: string,
  section: PostSection,
  options?: { locale?: SupportedLocale }
): Promise<Post | null> {
  const post = await getPostBySlug(slug, options)
  return post && isPostInSection(post, section) ? post : null
}

export async function getPostsBySection(
  section: PostSection,
  options?: { locale?: SupportedLocale }
): Promise<Post[]> {
  const locale = options?.locale ?? DEFAULT_LOCALE
  const tag = await getTagBySlug(POST_SECTIONS[section].tagSlug, { locale })
  if (!tag) return []

  const posts: Post[] = []
  const limit = 100
  let page = 1
  let totalDocs = 0

  try {
    do {
      const result = await payloadClient.getCollection<Post>("posts", {
        locale,
        depth: 2,
        limit,
        page,
        sort: "-publishedAt",
        where: {
          primaryTag: { equals: tag.id },
          status: { equals: "published" },
        },
        tags: [`posts:section:${section}:${locale}`],
      })
      totalDocs = result.totalDocs
      posts.push(...result.docs)
      page += 1
    } while (posts.length < totalDocs)

    return posts
  } catch (error) {
    console.error(`Error fetching ${section} Posts:`, error)
    return []
  }
}
```

Also set `depth: 2` in every `getAllPosts` request so sitemap and static generation always receive populated `primaryTag` documents.

Export `./tags` from `apps/www/src/services/payload/index.ts`.

- [ ] **Step 5: Run service tests and type checks**

Run:

```bash
pnpm --filter www test:run -- src/services/payload/__tests__/postSections.test.ts
pnpm --filter www check-types
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/www/src/services/payload apps/www/src/utils/postSections.ts
git commit -m "feat(www): query posts by primary section"
```

### Task 4: Extract the Shared Archive and Add Section Routes

**Files:**

- Create: `apps/www/src/components/posts/PostSectionArchive.tsx`
- Create: `apps/www/src/components/posts/__tests__/PostSectionArchive.test.tsx`
- Create: `apps/www/src/app/[locale]/(frontend)/technical/page.tsx`
- Create: `apps/www/src/app/[locale]/(frontend)/trading/page.tsx`

- [ ] **Step 1: Add a section descriptor test**

Extend `apps/www/src/utils/__tests__/postSections.test.ts`:

```typescript
it("keeps the route domain and Tag slug aligned", () => {
  expect(POST_SECTIONS).toEqual({
    technical: { domain: "technical", tagSlug: "technical" },
    trading: { domain: "trading", tagSlug: "trading" },
  })
})
```

Run the test and confirm it passes before the UI extraction; this locks the route-to-CMS contract used by both route modules.

- [ ] **Step 2: Extract the existing Post archive renderer**

Create `PostSectionArchive.tsx` by moving the current archive JSX and imports from `posts/page.tsx` into this interface:

```typescript
import type { Metadata } from "next"
import Link from "next/link"

import {
  buildRouteIndexAlternates,
  formatReadingTime,
  getUiStrings,
  type SupportedLocale,
} from "@repo/i18n"

import { getPostsBySection } from "@/services/payload/posts"
import { getTagBySlug } from "@/services/payload/tags"
import { getSiteConfig } from "@/services/payload/site-config"
import { POST_SECTIONS, resolvePostSectionPath, type PostSection } from "@/utils/postSections"
import { resolveSiteUrl, resolveTwitterHandle } from "@/utils/seo"

export type PostSectionPageParams = { locale: SupportedLocale }

export async function buildPostSectionIndexMetadata(
  section: PostSection,
  locale: SupportedLocale
): Promise<Metadata> {
  const [tag, siteConfig] = await Promise.all([
    getTagBySlug(POST_SECTIONS[section].tagSlug, { locale }),
    getSiteConfig(locale),
  ])
  const title = tag?.name || section
  const description = tag?.description || ""
  const alternates = buildRouteIndexAlternates({
    currentLocale: locale,
    domain: POST_SECTIONS[section].domain,
    siteUrl: resolveSiteUrl(siteConfig),
  })
  const twitterHandle = resolveTwitterHandle(siteConfig)

  return {
    title,
    description,
    alternates: { canonical: alternates.canonical, languages: alternates.languages },
    openGraph: { description, title, type: "website", url: alternates.canonical },
    twitter: {
      card: "summary",
      creator: twitterHandle,
      description,
      site: twitterHandle,
      title,
    },
  }
}

export async function PostSectionArchive({
  locale,
  section,
}: {
  locale: SupportedLocale
  section: PostSection
}) {
  const [posts, tag] = await Promise.all([
    getPostsBySection(section, { locale }),
    getTagBySlug(POST_SECTIONS[section].tagSlug, { locale }),
  ])
  const strings = getUiStrings(locale).postSection

  // Keep the existing Post card markup. Replace the old heading with
  // strings.eyebrow, tag?.name, and tag?.description. Build each Link with
  // resolvePostSectionPath(section, post.slug, locale), and use
  // strings.readPost / strings.emptyState for behavioral copy.
}
```

Preserve the exact existing `Post`, `PostThumbnail`, metadata, Tag, Markdown excerpt, responsive spacing, and image behavior. Do not introduce a new UI primitive because the archive is app-specific and already composed from `@repo/ui` primitives.

- [ ] **Step 3: Add thin Technical and Trading archive routes**

Each route follows this exact structure, changing only the section literal:

```typescript
import type { Metadata } from "next"

import {
	buildPostSectionIndexMetadata,
	PostSectionArchive,
	type PostSectionPageParams,
} from "@/components/posts/PostSectionArchive"

export async function generateMetadata({
	params,
}: {
	params: Promise<PostSectionPageParams>
}): Promise<Metadata> {
	const { locale } = await params
	return buildPostSectionIndexMetadata("technical", locale)
}

export default async function TechnicalPage({
	params,
}: {
	params: Promise<PostSectionPageParams>
}) {
	const { locale } = await params
	return <PostSectionArchive locale={locale} section="technical" />
}
```

The Trading route uses `"trading"` and names its component `TradingPage`.

- [ ] **Step 4: Add server-rendered archive tests**

Create `apps/www/src/components/posts/__tests__/PostSectionArchive.test.tsx`. Mock
`getPostsBySection` and `getTagBySlug`, then render the awaited Server Component with
`renderToStaticMarkup`. Cover both a populated Technical result and an empty Trading result:

```typescript
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getPostsBySection } from "@/services/payload/posts"
import { getTagBySlug } from "@/services/payload/tags"
import { PostSectionArchive } from "../PostSectionArchive"

vi.mock("@/services/payload/posts", () => ({ getPostsBySection: vi.fn() }))
vi.mock("@/services/payload/tags", () => ({ getTagBySlug: vi.fn() }))

describe("PostSectionArchive", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renders the CMS Tag copy and canonical Technical article link", async () => {
    vi.mocked(getTagBySlug).mockResolvedValue({
      id: "technical-id",
      name: "Technical",
      description: "Engineering notes",
      slug: "technical",
    } as never)
    vi.mocked(getPostsBySection).mockResolvedValue([
      {
        id: "post-id",
        title: "Architecture",
        slug: "architecture",
        primaryTag: { id: "technical-id", name: "Technical", slug: "technical" },
        tags: [],
      } as never,
    ])

    const html = renderToStaticMarkup(
      await PostSectionArchive({ locale: "en", section: "technical" })
    )
    expect(html).toContain("Technical")
    expect(html).toContain("Engineering notes")
    expect(html).toContain('href="/technical/architecture"')
  })

  it("renders the localized empty state", async () => {
    vi.mocked(getTagBySlug).mockResolvedValue({
      id: "trading-id",
      name: "交易",
      description: "交易观点",
      slug: "trading",
    } as never)
    vi.mocked(getPostsBySection).mockResolvedValue([])

    const html = renderToStaticMarkup(
      await PostSectionArchive({ locale: "zh-CN", section: "trading" })
    )
    expect(html).toContain("该板块暂无已发布文章。")
  })
})
```

- [ ] **Step 5: Run focused tests and type checks**

Run:

```bash
pnpm --filter www test:run -- src/utils/__tests__/postSections.test.ts src/components/posts/__tests__/PostSectionArchive.test.tsx
pnpm --filter www check-types
```

Expected: PASS and no duplicated archive implementation in either route file.

- [ ] **Step 6: Commit**

```bash
git add apps/www/src/components/posts 'apps/www/src/app/[locale]/(frontend)/technical/page.tsx' 'apps/www/src/app/[locale]/(frontend)/trading/page.tsx' apps/www/src/utils/__tests__/postSections.test.ts
git commit -m "feat(www): add technical and trading archives"
```

### Task 5: Extract the Shared Article and Add Section Routes

**Files:**

- Create: `apps/www/src/components/posts/PostSectionArticle.tsx`
- Create: `apps/www/src/app/[locale]/(frontend)/technical/[slug]/page.tsx`
- Create: `apps/www/src/app/[locale]/(frontend)/trading/[slug]/page.tsx`

- [ ] **Step 1: Add failing section-match tests**

Extend `postSections.test.ts`:

```typescript
import { isPostInSection } from "../postSections"

it("accepts only the canonical section", () => {
  expect(isPostInSection({ primaryTag: { id: "trading-id", slug: "trading" } }, "trading")).toBe(
    true
  )
  expect(isPostInSection({ primaryTag: { id: "trading-id", slug: "trading" } }, "technical")).toBe(
    false
  )
  expect(isPostInSection({ primaryTag: null }, "technical")).toBe(true)
  expect(isPostInSection({ primaryTag: { id: "other-id", slug: "other" } }, "technical")).toBe(
    false
  )
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
pnpm --filter www test:run -- src/utils/__tests__/postSections.test.ts
```

Expected: FAIL because `isPostInSection` is not exported.

- [ ] **Step 3: Implement the match helper**

Add to `postSections.ts`:

```typescript
export function isPostInSection(post: SectionablePost, section: PostSection): boolean {
  return getPostSection(post) === section
}
```

- [ ] **Step 4: Extract the article renderer and metadata builder**

Create `PostSectionArticle.tsx` by moving the current Post article imports, cached query, metadata code, and JSX from `posts/[slug]/page.tsx` into these exports:

```typescript
export type PostSectionArticleParams = {
  locale: SupportedLocale
  slug: string
}

const getPostBySlugForSectionCached = cache(
  async (slug: string, section: PostSection, locale: SupportedLocale) =>
    getPostBySlugForSection(slug, section, { locale })
)

export async function buildPostSectionStaticParams(
  section: PostSection
): Promise<PostSectionArticleParams[]> {
  const params: PostSectionArticleParams[] = []
  for (const locale of SUPPORTED_LOCALES) {
    const posts = await getPostsBySection(section, { locale })
    for (const post of posts) {
      if (post.slug) params.push({ locale, slug: post.slug })
    }
  }
  return params
}

export async function buildPostSectionArticleMetadata(
  section: PostSection,
  locale: SupportedLocale,
  slug: string
): Promise<Metadata> {
  const [post, siteConfig] = await Promise.all([
    getPostBySlugForSectionCached(slug, section, locale),
    getSiteConfig(locale),
  ])
  if (!post) {
    const strings = getUiStrings(locale).notFound
    return { title: { absolute: strings.title }, description: strings.description }
  }

  // Preserve the current title, description, OG image, and Twitter logic.
  // Build alternates with POST_SECTIONS[section].domain.
}

export async function PostSectionArticle({
  locale,
  section,
  slug,
}: PostSectionArticleParams & { section: PostSection }) {
  const post = await getPostBySlugForSectionCached(slug, section, locale)
  if (!post) notFound()

  const sectionHref = resolvePostSectionPath(section, undefined, locale)
  const strings = getUiStrings(locale)

  // Preserve the complete existing article JSX and Markdown/TOC behavior.
  // Point both back buttons to sectionHref and use
  // strings.article.backToSection for their aria-label.
}
```

Do not alter Markdown rendering, reading progress, TOC extraction, series display, media selection, or responsive layout while extracting.

- [ ] **Step 5: Add four thin route exports**

Each section article route delegates to the shared functions. Technical uses:

```typescript
import type { Metadata } from "next"

import {
	buildPostSectionArticleMetadata,
	buildPostSectionStaticParams,
	PostSectionArticle,
	type PostSectionArticleParams,
} from "@/components/posts/PostSectionArticle"

export function generateStaticParams() {
	return buildPostSectionStaticParams("technical")
}

export async function generateMetadata({
	params,
}: {
	params: Promise<PostSectionArticleParams>
}): Promise<Metadata> {
	const { locale, slug } = await params
	return buildPostSectionArticleMetadata("technical", locale, slug)
}

export default async function TechnicalPostPage({
	params,
}: {
	params: Promise<PostSectionArticleParams>
}) {
	const { locale, slug } = await params
	return <PostSectionArticle locale={locale} section="technical" slug={slug} />
}
```

The Trading route changes the section literal and component name only.

- [ ] **Step 6: Run tests and type checks**

Run:

```bash
pnpm --filter www test:run -- src/utils/__tests__/postSections.test.ts
pnpm --filter www check-types
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/www/src/components/posts/PostSectionArticle.tsx 'apps/www/src/app/[locale]/(frontend)/technical/[slug]/page.tsx' 'apps/www/src/app/[locale]/(frontend)/trading/[slug]/page.tsx' apps/www/src/utils
git commit -m "feat(www): add section-specific article routes"
```

### Task 6: Replace Legacy Posts Routes with Permanent Redirects

**Files:**

- Modify: `apps/www/src/app/[locale]/(frontend)/posts/page.tsx`
- Modify: `apps/www/src/app/[locale]/(frontend)/posts/[slug]/page.tsx`
- Modify: `apps/www/src/utils/__tests__/postSections.test.ts`
- Modify: `apps/www/src/utils/posts.ts`
- Modify: `packages/i18n/src/route-domains.ts`
- Modify: `packages/i18n/src/strings.ts`
- Modify: `packages/i18n/src/__tests__/i18n.test.ts`

- [ ] **Step 1: Add failing legacy redirect-target tests**

Add:

```typescript
import { resolveLegacyPostPath } from "../postSections"

it("routes legacy Posts to the canonical section", () => {
  expect(
    resolveLegacyPostPath(
      { primaryTag: { id: "trading-id", slug: "trading" } },
      "market-view",
      "en"
    )
  ).toBe("/trading/market-view")
  expect(resolveLegacyPostPath({ primaryTag: null }, "architecture", "zh-CN")).toBe(
    "/zh-CN/technical/architecture"
  )
  expect(
    resolveLegacyPostPath({ primaryTag: { id: "other-id", slug: "other" } }, "unknown", "en")
  ).toBeNull()
})
```

- [ ] **Step 2: Run the test and verify it fails**

Expected: FAIL because `resolveLegacyPostPath` does not exist.

- [ ] **Step 3: Add the pure redirect-target helper**

```typescript
export function resolveLegacyPostPath(
  post: SectionablePost,
  slug: string,
  locale: SupportedLocale
): string | null {
  const section = getPostSection(post)
  return section ? resolvePostSectionPath(section, slug, locale) : null
}
```

- [ ] **Step 4: Replace the legacy archive page**

Replace `posts/page.tsx` with:

```typescript
import { permanentRedirect } from "next/navigation"

import type { SupportedLocale } from "@repo/i18n"

import { resolvePostSectionPath } from "@/utils/postSections"

export default async function LegacyPostsPage({
  params,
}: {
  params: Promise<{ locale: SupportedLocale }>
}) {
  const { locale } = await params
  permanentRedirect(resolvePostSectionPath("technical", undefined, locale))
}
```

- [ ] **Step 5: Replace the legacy article page**

Replace `posts/[slug]/page.tsx` with:

```typescript
import { notFound, permanentRedirect } from "next/navigation"

import type { SupportedLocale } from "@repo/i18n"

import { getPostBySlug } from "@/services/payload/posts"
import { resolveLegacyPostPath } from "@/utils/postSections"

export default async function LegacyPostPage({
  params,
}: {
  params: Promise<{ locale: SupportedLocale; slug: string }>
}) {
  const { locale, slug } = await params
  const post = await getPostBySlug(slug, { locale })
  if (!post) notFound()

  const target = resolveLegacyPostPath(post, slug, locale)
  if (!target) notFound()
  permanentRedirect(target)
}
```

- [ ] **Step 6: Run tests, type checks, and commit**

Before running the tests, remove the now-unused `posts` route domain, remove
`article.backToPosts` and the old `posts` UI-string group, and update the original i18n assertions
to use the Technical domain and `postSection`. Remove the now-unused `resolvePostPath` and
`resolvePostAbsoluteUrl` functions from `apps/www/src/utils/posts.ts`. Confirm with:

```bash
rg -n 'resolvePostPath|resolvePostAbsoluteUrl|domain: "posts"|backToPosts|getUiStrings\([^)]*\)\.posts' apps/www/src packages/i18n/src
```

Expected: no matches. The legacy redirect modules intentionally use `resolveLegacyPostPath`.

Run:

```bash
pnpm --filter www test:run -- src/utils/__tests__/postSections.test.ts
pnpm --filter www check-types
```

Expected: PASS.

Commit:

```bash
git add 'apps/www/src/app/[locale]/(frontend)/posts' apps/www/src/utils/postSections.ts apps/www/src/utils/posts.ts apps/www/src/utils/__tests__/postSections.test.ts packages/i18n/src
git commit -m "feat(www): redirect legacy post URLs"
```

### Task 7: Make Sitemap and Revalidation Section-Aware

**Files:**

- Create: `apps/www/src/utils/sitemap.ts`
- Create: `apps/www/src/utils/__tests__/sitemap.test.ts`
- Create: `apps/www/src/app/api/revalidate/__tests__/route.test.ts`
- Modify: `apps/www/src/app/sitemap.ts`
- Modify: `apps/www/src/app/api/revalidate/route.ts`

- [ ] **Step 1: Write failing sitemap helper tests**

Create `apps/www/src/utils/__tests__/sitemap.test.ts`:

```typescript
import { describe, expect, it } from "vitest"

import { postUnprefixedPath } from "../sitemap"

describe("post sitemap paths", () => {
  it("emits Technical, Trading, and legacy fallback paths", () => {
    expect(postUnprefixedPath({ primaryTag: null }, "legacy")).toBe("/technical/legacy")
    expect(
      postUnprefixedPath({ primaryTag: { id: "trading-id", slug: "trading" } }, "market-view")
    ).toBe("/trading/market-view")
  })

  it("omits Posts with an unknown primary section", () => {
    expect(
      postUnprefixedPath({ primaryTag: { id: "other-id", slug: "other" } }, "other")
    ).toBeNull()
  })
})
```

- [ ] **Step 2: Implement the pure sitemap helper and use it**

Create `apps/www/src/utils/sitemap.ts`:

```typescript
import { getPostSection, type SectionablePost } from "./postSections"

export function postUnprefixedPath(post: SectionablePost, slug: string): string | null {
  const section = getPostSection(post)
  if (!section) return null
  return `/${section}/${slug.replace(/^\/+|\/+$/g, "")}`
}
```

In `app/sitemap.ts`, retain Posts rather than only slugs in the locale maps, call `postUnprefixedPath(post, post.slug)`, skip `null`, and preserve the existing alternate-building and deduplication behavior. Do not emit `/posts` URLs.

- [ ] **Step 3: Write failing revalidation tests**

Mock `next/cache`, call the POST handler with a valid in-test secret, and assert that a `posts` payload revalidates both section archives plus the section article paths for Technical and Trading. Also assert that a `tags` payload revalidates both archive cache tags and paths.

Use this exact core assertion set in `route.test.ts`:

```typescript
expect(revalidatePath).toHaveBeenCalledWith("/technical")
expect(revalidatePath).toHaveBeenCalledWith("/trading")
expect(revalidatePath).toHaveBeenCalledWith("/technical/example")
expect(revalidatePath).toHaveBeenCalledWith("/trading/example")
expect(revalidateTag).toHaveBeenCalledWith("posts:section:technical:en")
expect(revalidateTag).toHaveBeenCalledWith("posts:section:trading:en")
```

The handler may conservatively revalidate both possible article paths because the webhook currently sends slugs but not the changed relationship value.

- [ ] **Step 4: Implement section-aware revalidation**

Replace Posts path resolution in the `posts` handler with loops over `Object.keys(POST_SECTIONS) as PostSection[]`. For every locale and slug, revalidate both possible section article paths, then revalidate both section indexes and cache tags. Retain `post:${slug}:${locale}`, `posts:latest`, `posts:all`, and sitemap invalidation.

Add a `tags` handler that revalidates:

```typescript
for (const locale of locales) {
  for (const section of Object.keys(POST_SECTIONS) as PostSection[]) {
    revalidatePath(resolvePostSectionPath(section, undefined, locale))
    revalidateTag(`posts:section:${section}:${locale}`)
    revalidateTag(`tag:${POST_SECTIONS[section].tagSlug}:${locale}`)
  }
}
revalidatePath("/sitemap.xml")
```

- [ ] **Step 5: Run focused tests and type checks**

Run:

```bash
pnpm --filter www test:run -- src/utils/__tests__/sitemap.test.ts src/app/api/revalidate/__tests__/route.test.ts
pnpm --filter www check-types
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/www/src/app/sitemap.ts apps/www/src/app/api/revalidate apps/www/src/utils/sitemap.ts apps/www/src/utils/__tests__/sitemap.test.ts
git commit -m "feat(www): index and revalidate post sections"
```

### Task 8: Update the Multilingual Route Documentation

**Files:**

- Modify: `docs/proposals/multilingual-architecture.md`

- [ ] **Step 1: Update route examples and the file map**

Replace `/posts` canonical examples with `/technical` and `/trading`, document that `primaryTag` selects the route domain, and add a compatibility note for permanent `/posts` redirects. Update the App Router tree to list both section routes and retain Posts routes as redirect-only modules.

- [ ] **Step 2: Verify documentation formatting**

Run:

```bash
pnpm prettier --check docs/proposals/multilingual-architecture.md
git diff --check
```

Expected: PASS with no formatting or whitespace errors.

- [ ] **Step 3: Commit**

```bash
git add docs/proposals/multilingual-architecture.md
git commit -m "docs: document post section routing"
```

### Task 9: Create the Local CMS Preview Through MCP

**Target:** `local-chankay-payload` only

- [ ] **Step 1: Re-read and validate the local targets**

Call local MCP reads for:

- Tags filtered by `slug = technical` and `slug = trading`.
- Posts IDs `69d752cf0ea3a2828f4b7007` and `69bb657182bcff61c71e9dce` with `primaryTag`, `tags`, `status`, and `slug` selected.
- SiteConfig with the complete `navigation` group selected.
- Posts filtered by `slug = local-trading-section-preview`.

Stop before writing if either Tag query returns multiple documents, either expected Post is missing, SiteConfig is unavailable, or the sample slug already exists with content not created for this preview.

- [ ] **Step 2: Create or localize the two primary Tags**

If absent, call `createTags` with:

```typescript
{
  "locale": "en",
  "name": "Technical",
  "slug": "technical",
  "description": "Engineering notes, architecture, and practical software development.",
  "color": "#2563EB",
  "featured": true,
  "priority": 100
}
```

and:

```json
{
  "locale": "en",
  "name": "Trading",
  "slug": "trading",
  "description": "Long-form market observations, trade theses, and reflections on risk.",
  "color": "#F59E0B",
  "featured": true,
  "priority": 90
}
```

Capture each returned document ID. Call `updateTags` by that ID with locale `zh-CN` and these localized fields:

```json
{ "name": "技术", "description": "关于工程、架构与软件开发实践的文章。" }
```

```json
{ "name": "交易", "description": "关于市场观察、交易逻辑与风险反思的长文。" }
```

- [ ] **Step 3: Assign the existing Posts to Technical**

Call `updatePosts` twice by the exact Post IDs from Step 1, setting only `primaryTag` to the Technical Tag ID. Read both Posts back and verify their title, slug, status, and all unrelated fields remain unchanged.

- [ ] **Step 4: Update local navigation without losing unrelated settings**

Preserve `showLogo`, `showSiteName`, `showSearch`, `showThemeToggle`, and the Demos item from the read result. Replace the Posts item and insert Trading so the English menu is exactly:

```json
[
  { "label": "Demos", "url": "/demos", "external": false, "showInMobile": true },
  { "label": "Technical", "url": "/technical", "external": false, "showInMobile": true },
  { "label": "Trading", "url": "/trading", "external": false, "showInMobile": true }
]
```

Use `updateSiteConfig` with locale `en` and the complete preserved `navigation` group. Then call `translate_site_config_labels` with locale `zh-CN`:

```json
{
  "locale": "zh-CN",
  "navigationLabels": [
    { "url": "/demos", "label": "演示" },
    { "url": "/technical", "label": "技术" },
    { "url": "/trading", "label": "交易" }
  ]
}
```

- [ ] **Step 5: Create the local Trading demonstration Post**

Because `primaryTag` is required, use the generic local `createPosts` MCP tool so the relationship
is present in the initial validated write. Call it with the Trading Tag ID captured in Step 2:

```typescript
{
  "locale": "en",
  "title": "Trading Section Preview",
  "slug": "local-trading-section-preview",
  "excerpt": "Local-only demonstration content for reviewing the Trading section layout.",
  "content": "# Trading Section Preview\n\n> This is local demonstration content, not an investment recommendation or a real trading view.\n\n## Thesis structure\n\nA Trading article uses the same Markdown editor, reading experience, metadata, tags, and publishing workflow as a Technical article.\n\n## Risk and invalidation\n\nReal Trading posts should state the evidence, risks, and conditions that would invalidate the view.",
  "primaryTag": tradingTag.id,
  "status": "published",
  "_status": "published",
  "draft": false
}
```

Capture the returned Post ID and read it back immediately. Do not use the narrow
`create_post_draft` tool for this operation because its input contract cannot provide the required
`primaryTag` during creation.

- [ ] **Step 6: Read back every local mutation**

Verify:

- Both Tag slugs resolve uniquely and contain the expected English and Chinese labels.
- Both existing Posts reference Technical.
- The sample Post references Trading and is published.
- SiteConfig order is Demos, Technical, Trading in English and the Chinese labels resolve by URL.
- No production MCP tool was called.

Do not delete the demonstration Post automatically. Its title makes its local-only purpose explicit; deletion requires a separate user request.

### Task 10: Full Verification and Local Browser Review

**Files:** All changed implementation and documentation files

- [ ] **Step 1: Run the focused test suites**

```bash
pnpm --filter @repo/i18n test:run -- src/__tests__/i18n.test.ts
pnpm --filter admin test:run -- src/collections/__tests__/postSections.test.ts
pnpm --filter www test:run -- src/utils/__tests__/postSections.test.ts src/services/payload/__tests__/postSections.test.ts src/utils/__tests__/sitemap.test.ts src/app/api/revalidate/__tests__/route.test.ts
```

Expected: all focused tests PASS with zero failures.

- [ ] **Step 2: Run complete project verification**

```bash
pnpm test:run
pnpm lint
pnpm check-types
pnpm --filter www build
git diff --check
```

Expected: every command exits 0. Record any non-failing known warnings separately; do not describe a warning as a failure.

- [ ] **Step 3: Start local Admin and WWW**

Run the repository dev commands in separate persistent terminals:

```bash
pnpm dev:admin
pnpm dev:www
```

Expected: Admin listens on `http://localhost:3001` and WWW listens on `http://localhost:3000`.

- [ ] **Step 4: Perform browser business QA**

Use `websites-business-qa` and verify:

- Desktop and mobile navigation order is Demos, Technical, Trading.
- `/technical` contains the two existing local articles.
- `/trading` contains `Trading Section Preview`.
- Both article detail routes render the existing Post UI, Markdown, back button, and metadata.
- `/posts` permanently redirects to `/technical`.
- Each old `/posts/[slug]` redirects to the section-specific article URL.
- `/zh-CN/technical` and `/zh-CN/trading` render localized Tag headings/descriptions and UI strings.
- Canonical and `hreflang` links point to section URLs.
- Mobile layout has no overflow and navigation remains usable.

- [ ] **Step 5: Request code review**

Use `superpowers:requesting-code-review` against the complete implementation diff. Address only verified findings; use `superpowers:receiving-code-review` before applying review suggestions.

- [ ] **Step 6: Re-run verification after review changes**

Repeat Step 1 and Step 2. Do not claim completion without fresh successful output.

- [ ] **Step 7: Commit final review fixes if needed**

```bash
git add apps/admin apps/www packages/i18n packages/typescript-config docs/proposals/multilingual-architecture.md
git commit -m "fix: address technical and trading section review"
```

Skip this commit when review produces no code changes.

- [ ] **Step 8: Prepare branch handoff**

Use `superpowers:finishing-a-development-branch` to offer merge, PR, keep, or cleanup options. Do not push, deploy, or write production CMS data unless the user explicitly chooses that action.
