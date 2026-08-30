# Multilingual Architecture

> Last Updated: July 22, 2026

This document defines how multilingual content flows across the monorepo: which locales are supported, how URLs are shaped, how the CMS stores localized content, how the frontend consumes it, and how SEO metadata is generated.

## Goals

- Serve the same site in `en` and `zh-CN`, with infrastructure that scales to additional locales without architectural change.
- Keep the default locale (`en`) at unprefixed URLs (e.g. `/posts/foo`); place additional locales under a prefix (e.g. `/zh-CN/posts/foo`).
- Centralize locale configuration in a single shared package so admin, www, and any future app share one source of truth.
- Use the CMS as the source of localized content. Avoid hand-maintained translation message files for content that already lives in Payload.
- Emit correct SEO signals: `<html lang>`, canonical URL per locale, `hreflang` alternates, locale-aware sitemap.

## Non-Goals

- Per-locale slugs (e.g. `/about` vs `/zh-CN/guanyu`). Slugs are shared across locales for routing simplicity.
- Locale-aware date or number formatting beyond what `Intl.*` already provides at the call site.
- Right-to-left support. The `rtl` flag exists in `LOCALE_CONFIG` for future use; no RTL locale is currently shipped.
- Translation memory, translation workflows, or third-party translation services. Editors translate manually inside Payload.

## Supported Locales

Defined in `packages/i18n/src/config.ts`:

| Code    | Name     | Role            |
| ------- | -------- | --------------- |
| `en`    | English  | Default locale  |
| `zh-CN` | 简体中文 | Prefixed locale |

Adding a locale is a one-line change to `LOCALE_CONFIG.locales`. Routing, sitemap, and `hreflang` derive from this list.

## URL Strategy

| Path               | Resolved locale | Notes                      |
| ------------------ | --------------- | -------------------------- |
| `/`                | `en`            | Default locale, unprefixed |
| `/posts/foo`       | `en`            | Default locale, unprefixed |
| `/zh-CN/`          | `zh-CN`         | Prefixed                   |
| `/zh-CN/posts/foo` | `zh-CN`         | Prefixed                   |
| `/xx-YY/anything`  | n/a             | Unsupported prefix → 404   |

The mapping is implemented by `resolveLocalizedPath(locale, path)` in `packages/i18n/src/paths.ts`:

- For the default locale, the prefix is omitted.
- For other locales, the locale code is the first path segment.

This avoids duplicate indexing of the default locale at both `/` and `/en/`.

## Package: `@repo/i18n`

Path: `packages/i18n/`. The single source of truth for locale configuration and locale-aware URL utilities.

Exports:

| Export                                                                                        | Purpose                                                |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `LOCALE_CONFIG`, `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, `FALLBACK_LOCALE`, `PREFIXED_LOCALES` | Static configuration                                   |
| `SupportedLocale`, `LocaleConfig`                                                             | Branded types for locale codes                         |
| `isSupportedLocale`, `isDefaultLocale`, `getLocaleConfig`, `getLocaleOptions`                 | Type guards and lookups                                |
| `stripLocalePrefix`, `resolveLocalizedPath`                                                   | URL parsing and rewriting                              |
| `routeDomains`, `getRouteDomain`, `resolveRoutePath`, `resolveRouteIndexPath`                 | Domain registry mapping content type → URL shape       |
| `buildRouteAlternates`, `buildRouteIndexAlternates`                                           | Generators for Next.js `Metadata.alternates.languages` |

Consumers:

- `apps/admin/src/config/locales.ts` re-exports from `@repo/i18n`. Existing imports like `@/config/locales` keep working.
- `apps/www` imports directly: `import { ... } from "@repo/i18n"`.

## Backend: Payload CMS Localization

Configured in `apps/admin/src/payload.config.ts`:

```ts
localization: {
  locales: LOCALE_CONFIG.locales.map((locale) => ({
    code: locale.code,
    label: `[${locale.code}]`,
  })),
  defaultLocale: DEFAULT_LOCALE,
  fallback: LOCALE_CONFIG.cms.fallback,
}
```

Field-level localization is opt-in. The current model:

| Collection | Localized fields                                |
| ---------- | ----------------------------------------------- |
| `posts`    | `title`, `excerpt`, `content`                   |
| `tags`     | `name`, `description`                           |
| `series`   | `title`, `description`                          |
| `pages`    | `title`, `seo.metaTitle`, `seo.metaDescription` |

Operational fields (`slug`, `status`, `seo.autoGenerateOgImage`, `seo.ogImage`) stay non-localized.

`fallback: true` ensures missing translations fall back to the default locale value. Editors are not required to translate every field on every save.

### Blocks Localization: Leaf-Field Rule

The `pages.structure` field is a deeply nestable `blocks` tree (containers / flex / grid / cards / leaf content). It is **not** marked `localized: true`. Localization is applied at the leaf text fields inside each block instead:

| Block slug | Localized leaf fields  |
| ---------- | ---------------------- |
| `text`     | `content`              |
| `markdown` | `content`              |
| `button`   | `label`                |
| `card`     | `title`, `description` |

Layout fields (`as`, `size`, `gap`, `direction`, etc.), `mediaImage.media`, `previewUrl.previewUrl`, `spotifyIframe.uri`, and nested children arrays (`children`, `actionBlocks`, `contentBlocks`, `footerBlocks`) are shared across locales.

**Why not localize the container?** Marking the whole `structure` blocks field `localized: true` forced editors to maintain a per-locale copy of the entire blocks tree. With `fallback: true`, the admin form prefilled the target locale from the default locale and then wrote that prefilled tree back to storage on save — silently overwriting empty locale slots with default-locale data and breaking fallback semantics. Localizing only the leaf text fields keeps the layout shared while preserving fallback at the field level.

**Adding a new block with translatable text**: standard procedure is to add `localized: true` only to user-facing text/textarea/markdown fields, not to wrapping `array` or `blocks` fields. Then write a small follow-up migration to wrap any existing data in `{ [DEFAULT_LOCALE]: value }`.

## Frontend: App Router Layout

Routes live under `apps/www/src/app/[locale]/`:

```text
apps/www/src/app/
├── layout.tsx                              # Root layout, no <html>
├── [locale]/
│   ├── layout.tsx                          # Sets <html lang>, validates locale
│   ├── (frontend)/
│   │   ├── [[...slug]]/page.tsx
│   │   ├── posts/page.tsx
│   │   ├── posts/[slug]/page.tsx
│   │   ├── _preview/[[...slug]]/page.tsx
│   │   └── loading.tsx
├── api/revalidate/route.ts                 # Locale-scoped tags
├── sitemap.ts                              # Emits per-locale URLs
├── not-found.tsx
└── global.css
```

Each page receives `params: { locale: SupportedLocale, slug?: string | string[] }`. The page validates the locale via `isSupportedLocale` and calls `notFound()` for unsupported values.

`generateStaticParams` returns the cross-product of locales and slugs:

```ts
export async function generateStaticParams() {
  const slugs = await collectSlugs()
  return SUPPORTED_LOCALES.flatMap((locale) => slugs.map((slug) => ({ locale, slug })))
}
```

## Default-Locale Rewrite Middleware

`apps/www/src/middleware.ts` handles unprefixed URLs:

```ts
import { NextResponse, type NextRequest } from "next/server"
import { DEFAULT_LOCALE, isSupportedLocale } from "@repo/i18n"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const [, firstSegment] = pathname.split("/")

  if (isSupportedLocale(firstSegment)) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
}
```

Behavior:

- `/posts/foo` → internally rewritten to `/en/posts/foo`. The browser URL stays `/posts/foo`.
- `/zh-CN/posts/foo` → passed through unchanged.
- `/api/*`, `/_next/*`, and asset URLs (anything containing a dot) are excluded.

## Data Access: Locale-Aware Payload Client

`apps/www/src/utils/payloadClient.ts` accepts an optional `locale` on every query:

```ts
export interface PayloadQueryOptions {
  locale?: SupportedLocale
  revalidate?: number
  tags?: string[]
  cache?: RequestCache
}
```

When `locale` is set, the client appends `?locale=...` (or `&locale=...`) to the Payload REST URL and includes the locale in the default cache tag:

| Without locale      | With locale               |
| ------------------- | ------------------------- |
| `global:siteConfig` | `global:siteConfig:zh-CN` |
| `collection:posts`  | `collection:posts:zh-CN`  |

Service helpers in `apps/www/src/services/payload/` (`posts.ts`, `pages.ts`, `site-config.ts`) accept a `locale` parameter and forward it. Pages call services with the locale resolved from `params`.

## SEO: Canonical and `hreflang`

Every page using `generateMetadata` populates `alternates` via the helpers in `@repo/i18n`:

```ts
import { buildRouteAlternates } from "@repo/i18n"

export async function generateMetadata({ params }) {
  const { locale, slug } = await params
  const alternates = buildRouteAlternates({
    currentLocale: locale,
    domain: "posts",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL!,
    slug,
  })

  return {
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages,
    },
    // ...title, description, openGraph, etc.
  }
}
```

Output (per page):

- `<link rel="canonical" href="https://www.chankay.com/zh-CN/posts/foo" />`
- `<link rel="alternate" hreflang="en" href="https://www.chankay.com/posts/foo" />`
- `<link rel="alternate" hreflang="zh-CN" href="https://www.chankay.com/zh-CN/posts/foo" />`
- `<link rel="alternate" hreflang="x-default" href="https://www.chankay.com/posts/foo" />`

## Sitemap

`apps/www/src/app/sitemap.ts` emits one entry per `(locale, content)` pair, with locale alternates inline. The default-locale URL is unprefixed; alternates are absolute.

## Caching and Revalidation

- Cache tags include the locale: `collection:posts:en`, `collection:posts:zh-CN`. Revalidating one locale leaves the other locale's cache intact.
- `apps/www/src/app/api/revalidate/route.ts` accepts an optional `locale` query parameter and routes the revalidation accordingly.
- Static generation produces N posts × M locales of pre-rendered HTML at build time. ISR continues to operate per-tag.

## Data Migration

Marking a field as `localized: true` after data already exists changes the storage shape from `field: value` to `field: { en: value }`. Pre-existing rows still hold the bare value, which causes the admin UI to show blanks. A normalization migration is required.

Three migrations cover this:

1. `apps/admin/src/migrations/20260508120000_normalize_localized_fields.ts` — original normalization, wraps top-level localized fields into `{ en: value }`.
2. `apps/admin/src/migrations/20260525120000_relocate_pages_localization.ts` — relocates `pages.structure` localization: flattens the outer `{ en: [...blocks] }` wrapper into a bare array and wraps the leaf text fields inside each block (see "Blocks Localization: Leaf-Field Rule" above).
3. `apps/admin/src/migrations/20260722120000_localize_site_config_labels.ts` — wraps the editor-controlled `navigation.menuItems[].label`, `footer.copyrightText`, and `footer.additionalLinks[].label` leaf values without localizing their containing arrays.

What the first migration covers:

| Target collection      | Fields wrapped into `{ en: value }`                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `posts`                | `title`, `excerpt`, `content`                                                                                              |
| `_posts_versions`      | `version.title`, `version.excerpt`, `version.content`                                                                      |
| `tags`                 | `name`, `description`                                                                                                      |
| `series`               | `title`, `description`                                                                                                     |
| `pages`                | `title`, `structure`, `seo.metaTitle`, `seo.metaDescription`                                                               |
| `site-config` (global) | `siteName`, `siteDescription`, `metaTitle`, `metaDescription`, `footer.customFooterText`, `maintenance.maintenanceMessage` |

The second migration then undoes the `pages.structure` outer wrap from the first migration and rewraps leaf text fields (`text.content`, `markdown.content`, `button.label`, `card.title`, `card.description`) recursively through the blocks tree. It is also idempotent and reversible.

The third migration keeps navigation and footer structure shared while localizing only their visible labels. Its pure transformation helper is covered by Vitest for wrapping, rollback, empty values, and repeat execution.

Properties of the migration:

- **Idempotent**: documents already in the localized shape are detected via `isLocalizedShape` and skipped. Re-running does nothing.
- **Reversible**: `down()` unwraps `{ en: value }` back to the bare value when the default-locale key exists. Use only on dev clusters that need to roll back.
- **Defensive**: skips collections that do not exist (e.g. `_posts_versions` only exists when drafts are enabled), so the same script works against fresh and legacy clusters.
- **Logs counts**: each collection logs `scanned=N normalized=M` so the operator can verify which docs were touched.

### Execution Order

Always deploy code (`localized: true` flags) and migration in the same release. Order on the cluster:

1. Deploy the new code (admin + www).
2. Run `pnpm --filter admin payload migrate` against the target cluster's Mongo URI. The runner reads `apps/admin/src/migrations/` automatically (`migrationDir` is configured in `payload.config.ts`).
3. Open the admin UI and spot-check a Post and the SiteConfig global. The locale tabs should show the existing content under `en` and empty `zh-CN`.

### Recommended Rollout

1. **Backup** the target Mongo database before the first migration run on each cluster: `mongodump --uri="$DATABASE_URI" --collection=posts --out=./backup-$(date +%s)/` (repeat per collection or use full-DB dump).
2. **Dev cluster first**: deploy + migrate + smoke-test in admin and www.
3. **Production**: only after dev has been verified across the same data shapes.

### Adding More Localized Fields Later

When a new field is marked `localized: true` in the future, add its path to the appropriate `CollectionTarget.fields` array in the existing migration file (or write a follow-up migration). The script's idempotency means re-running it after adding paths only normalizes the newly-listed fields.

## Editorial Workflow

1. Author content in the default locale first. Save and publish.
2. Switch the locale selector in the Payload admin to `[zh-CN]`. Translate the localized fields. Save.
3. Untranslated fields fall back to the default locale at read time (`fallback: true`).
4. Slugs and operational fields are shared. Changing a slug updates URLs across all locales.

## CMS-First Static Strings

This project intentionally does not ship a third-party translation library. Editor-controlled content such as navigation labels, footer copy, and footer links lives in the Payload `siteConfig` global, which is fetched per locale. The Navbar, Footer, and other shell components consume these values via props.

Strings that are part of application behavior rather than editorial content live in the typed catalog at `packages/i18n/src/strings.ts`. Posts UI, reading-time labels, navigation accessibility text, and 404 copy read from this catalog through `getUiStrings(locale)`. Locale-aware dates and reading time use `packages/i18n/src/format.ts`.

## Language Switcher

Component: `packages/ui/src/components/LanguageSwitcher/`. Stateless. Props: `currentLocale`, `locales`, `pathname`. Uses `stripLocalePrefix` and `resolveLocalizedPath` to compute the target URL, preserving the current page across locales. Mounted in `Navbar` next to `ThemeToggle`.

## File Map

| File                                                         | Responsibility                                         |
| ------------------------------------------------------------ | ------------------------------------------------------ |
| `packages/i18n/src/*`                                        | Locale config, paths, hreflang, strings, formatting    |
| `apps/admin/src/config/locales.ts`                           | Re-exports `@repo/i18n` for admin                      |
| `apps/admin/src/payload.config.ts`                           | Wires Payload `localization` from shared config        |
| `apps/admin/src/collections/{Posts,Pages,Tags,Series}.ts`    | Field-level `localized: true`                          |
| `apps/admin/src/collections/{Posts,Pages}.ts`                | `createRevalidationHook` afterChange (per locale tags) |
| `apps/admin/src/blocks/{Text,Markdown,Button,Card}Block.ts`  | Leaf-field `localized: true` inside blocks tree        |
| `apps/admin/src/migrations/*`                                | Idempotent localized-data normalization                |
| `apps/www/src/middleware.ts`                                 | Default-locale rewrite                                 |
| `apps/www/src/app/[locale]/layout.tsx`                       | Locale validation, `<html lang>`                       |
| `apps/www/src/app/[locale]/(frontend)/**/page.tsx`           | Locale-aware route handlers                            |
| `apps/www/src/utils/payloadClient.ts`                        | `?locale=` forwarding, locale-scoped cache tags        |
| `apps/www/src/services/payload/{posts,pages,site-config}.ts` | Thread locale through to Payload queries               |
| `apps/www/src/app/sitemap.ts`                                | Per-locale URLs with `hreflang`                        |
| `apps/www/src/app/api/revalidate/route.ts`                   | Locale-scoped tag revalidation                         |
| `packages/ui/src/components/LanguageSwitcher/*`              | Stateless locale switcher                              |
| `packages/ui/src/components/Navbar/Navbar.tsx`               | Mounts `LanguageSwitcher`                              |

## Trade-Offs

- **Shared slugs over per-locale slugs**: simpler routing and editor model, weaker localized SEO. Revisit only if data justifies the cost.
- **No translation library**: avoids `next-intl` weight and matches CMS-first design. Cost is a small `strings.ts` lookup if a non-CMS UI string ever needs translation.
- **Default locale unprefixed**: cleaner SEO, but requires middleware. The complexity is contained in one matcher rule.
- **Field-level fallback**: editors can publish partial translations without breaking the site. Cost is occasional mixed-language pages until fully translated.

## Adding a New Locale

1. Add an entry to `LOCALE_CONFIG.locales` in `packages/i18n/src/config.ts`.
2. Run `pnpm --filter @repo/i18n build` to regenerate types.
3. In Payload admin, content automatically gets a new locale tab. Translate as desired. `fallback: true` covers untranslated content.
4. Rebuild `apps/www`. `generateStaticParams` produces routes for the new locale automatically. Sitemap and `hreflang` update on next build.
5. No middleware or route changes required.

## Verification Checklist

- `pnpm check-types` passes across the monorepo.
- `pnpm test:run` covers i18n paths, alternates, fixed strings, formatting, middleware, and the latest SiteConfig migration.
- `pnpm build` produces static pages for every locale × content slug.
- `/` and `/posts/<slug>` render English; `/zh-CN/` and `/zh-CN/posts/<slug>` render Chinese (or English fallback).
- HTML `<html lang>` attribute matches the served locale.
- `<link rel="canonical">` and `<link rel="alternate" hreflang="...">` are present on every public page.
- `sitemap.xml` lists every URL once per locale with `xhtml:link` alternates.
- Language switcher in `Navbar` toggles locales and preserves the current page.
- Cache invalidation via `/api/revalidate?tag=collection:posts:zh-CN` only updates Chinese pages.
