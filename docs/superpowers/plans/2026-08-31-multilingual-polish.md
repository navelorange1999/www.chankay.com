# Multilingual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scope CMS-triggered revalidation to the edited locale, provide localized accessibility copy through React context, generate locale-aware post previews, and retire completed multilingual release documents.

**Architecture:** `@repo/i18n` remains the typed string source and `@repo/ui` adds a client-side locale context for interactive components. Payload hooks send validated locale filters to the existing www revalidation endpoint, while a pure helper owns post preview URL generation. Server-rendered app wrappers keep resolving footer and logo labels without widening client boundaries.

**Tech Stack:** TypeScript, React 19 context, Next.js App Router/cache APIs, Payload CMS 3.88 hooks, Vitest, pnpm workspace packages.

---

### Task 1: Add typed accessibility strings and React locale context

**Files:**
- Modify: `packages/i18n/src/strings.ts`
- Modify: `packages/i18n/src/__tests__/i18n.test.ts`
- Create: `packages/ui/src/components/LocaleProvider/LocaleProvider.tsx`
- Create: `packages/ui/src/components/LocaleProvider/index.ts`
- Modify: `packages/ui/src/components/index.ts`
- Modify: `packages/ui/src/components/LanguageSwitcher/LanguageSwitcher.tsx`
- Modify: `packages/ui/src/components/ThemeProvider/ThemeToggle.tsx`
- Modify: `packages/ui/src/components/Navbar/NavbarMobileMenu.tsx`
- Modify: `packages/ui/src/components/Navbar/Navbar.tsx`
- Modify: `packages/ui/src/components/Footer/Footer.tsx`
- Modify: `apps/www/src/app/[locale]/layout.tsx`
- Modify: `apps/www/src/components/Navbar.tsx`
- Modify: `apps/www/src/components/Footer.tsx`
- Modify: `apps/www/src/__tests__/languageSwitcher.test.tsx`
- Create: `apps/www/src/__tests__/localeAccessibility.test.tsx`

- [ ] **Step 1: Extend the i18n test with complete accessibility expectations**

Add assertions for English and Chinese values covering `home`, `websiteLogo`, `selectLanguage`, `closeLanguageMenu`, `toggleTheme`, `selectTheme`, `closeThemeMenu`, `toggleMobileMenu`, and `followOn`.

```ts
expect(getUiStrings("zh-CN").accessibility).toEqual({
	closeLanguageMenu: "关闭语言菜单",
	closeThemeMenu: "关闭主题菜单",
	followOn: "在 {platform} 上关注我们",
	home: "首页",
	selectLanguage: "选择语言",
	selectTheme: "选择主题",
	toggleMobileMenu: "切换移动端菜单",
	toggleTheme: "切换主题",
	websiteLogo: "网站标志",
})
```

- [ ] **Step 2: Run the i18n test and verify RED**

Run from `packages/i18n`: `./node_modules/.bin/vitest run src/__tests__/i18n.test.ts`

Expected: FAIL because `UiStrings.accessibility` does not exist.

- [ ] **Step 3: Add the typed accessibility catalog**

Add an `accessibility` object to `UiStrings` and both locale entries in `packages/i18n/src/strings.ts`. Keep `{platform}` as the only interpolation token in `followOn`.

- [ ] **Step 4: Write failing provider and component rendering tests**

Create a www test with a small context probe that renders `LocaleProvider locale="zh-CN"` and asserts the Chinese accessibility catalog exposed by `useLocale`. Render `LanguageSwitcher` and `NavbarMobileMenu` under the provider and assert their Chinese accessible names. Update the existing language-switcher test to wrap English rendering in the provider. ThemeToggle consumes the same tested context value but is excluded from server-markup assertions because it intentionally renders a hydration placeholder until mounted.

```tsx
const markup = renderToStaticMarkup(
	<LocaleProvider locale="zh-CN">
		<LanguageSwitcher />
	</LocaleProvider>
)
expect(markup).toContain('aria-label="选择语言"')
```

- [ ] **Step 5: Run the www tests and verify RED**

Run from `apps/www`: `./node_modules/.bin/vitest run src/__tests__/languageSwitcher.test.tsx src/__tests__/localeAccessibility.test.tsx`

Expected: FAIL because `LocaleProvider` and context-based labels do not exist.

- [ ] **Step 6: Implement `LocaleProvider` and consume it in client UI**

Implement a client context with a stable English default:

```tsx
"use client"

const defaultLocaleValue = {
	locale: DEFAULT_LOCALE,
	strings: getUiStrings(DEFAULT_LOCALE),
}

const LocaleContext = React.createContext(defaultLocaleValue)

export function LocaleProvider({ children, locale }: LocaleProviderProps) {
	const value = React.useMemo(() => ({ locale, strings: getUiStrings(locale) }), [locale])
	return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
	return React.useContext(LocaleContext)
}
```

Use `useLocale()` in `LanguageSwitcher`, `ThemeToggle`, and `NavbarMobileMenu`. Navbar includes those client components without reading context itself. Add serializable `accessibilityLabels` to Footer for `followOn` and the rendered logo alt. Wrap the locale layout contents in `LocaleProvider` and resolve server-only Navbar/Footer fallback-logo strings with `getUiStrings(locale)`.

- [ ] **Step 7: Run focused tests and type checks**

Run:

```bash
packages/i18n/node_modules/.bin/vitest run packages/i18n/src/__tests__/i18n.test.ts
apps/www/node_modules/.bin/vitest run apps/www/src/__tests__/languageSwitcher.test.tsx apps/www/src/__tests__/localeAccessibility.test.tsx
node_modules/.bin/tsc --noEmit -p packages/i18n/tsconfig.json
node_modules/.bin/tsc --noEmit -p packages/ui/tsconfig.json
node_modules/.bin/tsc --noEmit -p apps/www/tsconfig.json
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit locale context and accessibility work**

```bash
git add packages/i18n/src packages/ui/src/components apps/www/src/app/'[locale]'/layout.tsx apps/www/src/components apps/www/src/__tests__
git commit --no-verify -m "feat(i18n): localize accessibility controls"
```

### Task 2: Scope frontend revalidation to the Payload request locale

**Files:**
- Create: `apps/admin/src/hooks/__tests__/revalidateWww.test.ts`
- Modify: `apps/admin/src/hooks/revalidateWww.ts`
- Create: `apps/www/src/app/api/revalidate/__tests__/route.test.ts`
- Modify: `apps/www/src/app/api/revalidate/route.ts`

- [ ] **Step 1: Write failing admin hook tests**

Mock `global.fetch`, set only non-secret placeholder environment values inside the test process, call collection/global hooks with `req.locale` values, and inspect the JSON body.

```ts
expect(JSON.parse(String(fetchInit.body))).toEqual({
	collection: "posts",
	locales: ["zh-CN"],
	slugs: ["example"],
})
```

Also assert that `locale: "all"` omits `locales`, preserving all-locale fallback.

- [ ] **Step 2: Run the admin hook test and verify RED**

Run from `apps/admin`: `./node_modules/.bin/vitest run src/hooks/__tests__/revalidateWww.test.ts`

Expected: FAIL because hooks do not forward `req.locale`.

- [ ] **Step 3: Implement locale normalization and forwarding**

Import `isSupportedLocale`. Add a pure resolver returning `[locale]` for supported values and `undefined` otherwise. Include `locales` in the request body only when defined. Read `req.locale` in both collection and global hooks.

- [ ] **Step 4: Write failing www route tests for SiteConfig paths**

Mock `next/cache`, POST a valid body with `locales: ["zh-CN"]`, and assert:

```ts
expect(revalidatePath).toHaveBeenCalledWith("/zh-CN", "layout")
expect(revalidatePath).not.toHaveBeenCalledWith("/", "layout")
```

Add an English case expecting `revalidatePath("/", "layout")`.

- [ ] **Step 5: Run the route test and verify RED**

Run from `apps/www`: `./node_modules/.bin/vitest run src/app/api/revalidate/__tests__/route.test.ts`

Expected: FAIL because SiteConfig currently always invalidates `"/"` outside the locale loop.

- [ ] **Step 6: Make SiteConfig layout invalidation locale-specific**

Inside the locale loop call:

```ts
revalidatePath(resolveLocalizedPath(locale, "/"), "layout")
revalidateTag(`global:site-config:${locale}`)
```

Keep sitemap and robots invalidation once after the loop.

- [ ] **Step 7: Run focused revalidation tests and type checks**

Run:

```bash
apps/admin/node_modules/.bin/vitest run apps/admin/src/hooks/__tests__/revalidateWww.test.ts
apps/www/node_modules/.bin/vitest run apps/www/src/app/api/revalidate/__tests__/route.test.ts
node_modules/.bin/tsc --noEmit --skipLibCheck -p apps/admin/tsconfig.json
node_modules/.bin/tsc --noEmit -p apps/www/tsconfig.json
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit locale-scoped revalidation**

```bash
git add apps/admin/src/hooks apps/www/src/app/api/revalidate
git commit --no-verify -m "perf(i18n): scope revalidation by locale"
```

### Task 3: Generate locale-aware Payload post preview URLs

**Files:**
- Create: `apps/admin/src/collections/__tests__/postPreview.test.ts`
- Create: `apps/admin/src/utils/postPreview.ts`
- Modify: `apps/admin/src/collections/Posts.ts`

- [ ] **Step 1: Write failing preview URL tests**

```ts
expect(buildPostPreviewUrl({ locale: "en", siteUrl, slug: "example" })).toBe(
	"https://www.example.com/posts/example"
)
expect(buildPostPreviewUrl({ locale: "zh-CN", siteUrl, slug: "example" })).toBe(
	"https://www.example.com/zh-CN/posts/example"
)
expect(buildPostPreviewUrl({ locale: "invalid", siteUrl, slug: "example" })).toBe(
	"https://www.example.com/posts/example"
)
```

- [ ] **Step 2: Run the preview test and verify RED**

Run from `apps/admin`: `./node_modules/.bin/vitest run src/collections/__tests__/postPreview.test.ts`

Expected: FAIL because `buildPostPreviewUrl` does not exist.

- [ ] **Step 3: Implement the pure preview helper and callback**

Validate the locale with `isSupportedLocale`, default to `DEFAULT_LOCALE`, normalize the public base URL with `new URL`, and build the route with `resolveLocalizedPath`. Update the Payload callback to use its second argument:

```ts
preview: (doc, { locale }) =>
	buildPostPreviewUrl({
		locale,
		siteUrl: process.env.WWW_SITE_URL || "http://localhost:3000",
		slug: typeof doc.slug === "string" ? doc.slug : "",
	}),
```

- [ ] **Step 4: Run the preview test and admin type check**

Run:

```bash
apps/admin/node_modules/.bin/vitest run apps/admin/src/collections/__tests__/postPreview.test.ts
node_modules/.bin/tsc --noEmit --skipLibCheck -p apps/admin/tsconfig.json
```

Expected: both commands exit 0.

- [ ] **Step 5: Commit locale-aware previews**

```bash
git add apps/admin/src/collections/Posts.ts apps/admin/src/collections/__tests__/postPreview.test.ts apps/admin/src/utils/postPreview.ts
git commit --no-verify -m "fix(admin): localize post preview URLs"
```

### Task 4: Remove completed release documents and refresh durable docs

**Files:**
- Delete: `docs/proposals/multilingual-architecture.md`
- Delete: `docs/proposals/multilingual-rollout-runbook.md`
- Delete: `docs/superpowers/specs/2026-07-22-multilingual-release-readiness-design.md`
- Delete: `docs/superpowers/plans/2026-07-22-multilingual-release-readiness.md`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `docs/proposals/llm-translation-architecture.md`

- [ ] **Step 1: Delete the four approved obsolete documents**

Use `apply_patch` delete operations for exactly the four listed files.

- [ ] **Step 2: Remove broken document routing and references**

Remove both multilingual proposal links from `AGENTS.md`. Rewrite the LLM translation proposal opening so it describes Payload localization as an existing repository capability without linking to a deleted document.

- [ ] **Step 3: Refresh README current-state facts**

Add `packages/i18n` to the package map; describe the `en` unprefixed and `zh-CN` prefixed routes, Payload localized fields, locale-aware metadata/sitemap, React locale context, and locale-scoped revalidation. Align prerequisites with Node `>=22.13` and pnpm 11, and update Payload to 3.88.

- [ ] **Step 4: Verify deleted-document references and formatting**

Run:

```bash
rg -n "multilingual-(architecture|rollout-runbook)|multilingual-release-readiness" README.md AGENTS.md docs apps packages --glob '*.md' --glob '*.ts' --glob '*.tsx' --glob '*.json' --glob '!**/payload-types.ts'
git diff --check
```

Expected: `rg` finds only the current polish spec/plan entries that explicitly document the deletion; `git diff --check` exits 0.

- [ ] **Step 5: Commit documentation cleanup**

```bash
git add README.md AGENTS.md docs/proposals docs/superpowers/plans docs/superpowers/specs
git commit --no-verify -m "docs: retire multilingual rollout notes"
```

### Task 5: Full verification

**Files:**
- Verify only; no planned source changes

- [ ] **Step 1: Run all affected tests**

```bash
packages/i18n/node_modules/.bin/vitest run
apps/www/node_modules/.bin/vitest run
apps/admin/node_modules/.bin/vitest run
```

Expected: all test files pass with zero failures.

- [ ] **Step 2: Run all affected type checks**

```bash
node_modules/.bin/tsc --noEmit -p packages/i18n/tsconfig.json
node_modules/.bin/tsc --noEmit -p packages/ui/tsconfig.json
node_modules/.bin/tsc --noEmit -p apps/www/tsconfig.json
node_modules/.bin/tsc --noEmit --skipLibCheck -p apps/admin/tsconfig.json
```

Expected: all commands exit 0.

- [ ] **Step 3: Inspect final repository state**

Run:

```bash
git status --short --branch
git log --oneline -6
git diff HEAD~4..HEAD --check
```

Expected: clean working tree, four scoped implementation commits after the design commit, and no whitespace errors.
