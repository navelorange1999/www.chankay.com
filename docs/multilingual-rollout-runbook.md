# Multilingual Rollout Runbook

> Last Updated: May 8, 2026

Operational checklist for taking the multilingual code changes from `master` to running clusters. The architecture and design are described in [`multilingual-architecture.md`](./multilingual-architecture.md); this file only tracks the work that still needs to happen on real environments and the cleanup items deferred from the initial implementation.

## Status

| Area                                                  | State                                                                              |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Code: shared `@repo/i18n` package                     | Done                                                                               |
| Code: `apps/www` `[locale]` routing + middleware      | Done                                                                               |
| Code: `payloadClient` + services threaded with locale | Done                                                                               |
| Code: locale-aware sitemap + hreflang                 | Done                                                                               |
| Code: `LanguageSwitcher` UI in Navbar                 | Done                                                                               |
| Code: `Pages` collection localized fields             | Done                                                                               |
| Code: data normalization migration script             | Written (`apps/admin/src/migrations/20260508120000_normalize_localized_fields.ts`) |
| Ops: dev cluster migration                            | **Pending — run by hand, see below**                                               |
| Ops: production cluster migration                     | **Pending — only after dev verifies**                                              |
| Verification: end-to-end browser test                 | **Pending — never opened in a browser yet, only typecheck-clean**                  |
| Editorial: translate existing content                 | **Pending — content work, not code**                                               |
| Code follow-ups                                       | **Pending — see "Code Follow-Ups" section**                                        |

## Pre-Flight

- [ ] Confirm `DATABASE_URI` for the **dev** cluster is set in your shell (`echo $DATABASE_URI` — never read `.env*` files via tooling).
- [ ] Confirm a recent Mongo backup exists or take one immediately:
  ```bash
  mongodump --uri="$DATABASE_URI" --out=./backup-dev-$(date +%s)
  ```
- [ ] Confirm the latest `master` is deployed to the dev environment first. Code and migration must ship together — running the migration against an old code build will normalize data into a shape that the old reader does not expect.

## Dev Cluster Rollout

1. Deploy current `master` to the dev environment (Vercel preview / dev branch — whichever this repo uses).
2. Run the migration against the dev Mongo:
   ```bash
   pnpm --filter admin migrate
   ```
   Expected log lines (counts vary by data):
   ```
   [migrate up] posts: scanned=N normalized=M
   [migrate up] _posts_versions: scanned=… normalized=…
   [migrate up] tags: scanned=… normalized=…
   [migrate up] series: scanned=… normalized=…
   [migrate up] pages: scanned=… normalized=…
   [migrate up] site-config: scanned=1 normalized=1
   ```
3. Smoke test the admin UI:
   - [ ] Open an existing Post. The English content should appear under the `[en]` locale tab; the `[zh-CN]` tab should be empty (or show fallback).
   - [ ] Open the SiteConfig global. Same expectation.
   - [ ] Open an existing Page. Same expectation. The `structure` blocks should render under `[en]`.
   - [ ] Create or edit a Post in `[zh-CN]`, save, and confirm the change persists without overwriting the English version.
4. Smoke test the public site:
   - [ ] `https://<dev>.chankay.com/` renders English; `<html lang="en">` in source.
   - [ ] `https://<dev>.chankay.com/zh-CN/` renders Chinese fallback (English content until translated); `<html lang="zh-CN">` in source.
   - [ ] `https://<dev>.chankay.com/posts/<existing-slug>` and `https://<dev>.chankay.com/zh-CN/posts/<existing-slug>` both load.
   - [ ] View source: `<link rel="canonical">` and `<link rel="alternate" hreflang="…">` are present.
   - [ ] `https://<dev>.chankay.com/sitemap.xml` lists every URL twice (once per locale) with `xhtml:link` alternates.
   - [ ] LanguageSwitcher in Navbar toggles between locales and preserves the current path.

If any check fails, roll back with:

```bash
pnpm --filter admin migrate:down
```

The migration's `down()` unwraps `{ en: value }` back to bare values.

## Production Cluster Rollout

Only proceed when the dev rollout is fully verified.

1. [ ] Mongo backup of production:
   ```bash
   mongodump --uri="$DATABASE_URI_PROD" --out=./backup-prod-$(date +%s)
   ```
2. [ ] Deploy `master` to production.
3. [ ] Run the migration:
   ```bash
   pnpm --filter admin migrate
   ```
   Pointed at production Mongo (set `DATABASE_URI` accordingly in the shell that runs the command).
4. [ ] Repeat the admin and public-site smoke tests from the dev section against the production URL.
5. [ ] Hit `/api/revalidate` for at least one post in each locale to confirm the locale-scoped cache tags work end-to-end.

## Editorial Follow-Ups

Content translation is not a code task; it happens inside Payload admin once the rollout completes.

- [ ] Identify the priority list of Pages and Posts to translate (likely: home, about, top N posts).
- [ ] For each, switch the Payload locale tab to `[zh-CN]` and translate `title`, `excerpt`, `content`, `seo.metaTitle`, `seo.metaDescription`, and (for Pages) the `structure` blocks.
- [ ] Translate the SiteConfig global's localized fields (`siteName`, `siteDescription`, `metaTitle`, `metaDescription`, `footer.customFooterText`) so the Navbar/Footer/SEO defaults work in Chinese.
- [ ] Translate Tag names and Series titles where they appear in the UI.

Untranslated fields fall back to the default locale automatically (`fallback: true`), so partial translation is safe — pages will show mixed languages until each field is filled in.

## Code Follow-Ups

These were intentionally deferred to keep the initial change scoped. Pick them up after the rollout settles.

### High value

- [ ] **Locale-aware Post preview link** — `apps/admin/src/collections/Posts.ts:54` builds the preview URL as `${WWW_SITE_URL}/posts/${doc.slug}`. After multilingual launch, the preview link in the Payload admin should match the locale tab the editor is currently on. Use the `req.locale` Payload exposes to the `preview` callback and prefix the URL via `resolveLocalizedPath`.
- [ ] **Simplify `getLocalizedContent` defensive helper** — `apps/admin/src/collections/Posts.ts:6-14` was written to tolerate both bare-string and localized-object shapes. Once the migration runs in production, all data is in localized shape; the helper can be reduced to "read the active locale's value" with a fallback to default locale.
- [ ] **Reconcile `SiteConfig.defaultLanguage` with `LOCALE_CONFIG.defaultLocale`** — `apps/admin/src/globals/SiteConfig.ts:67-78` defines a `defaultLanguage` select that duplicates `@repo/i18n`'s `DEFAULT_LOCALE`. Either remove the field (single source of truth wins) or actually drive runtime behavior from it (the schema is the single source today; the global is decoration).

### Medium value

- [ ] **Vitest unit test for the migration script** — `isLocalizedShape` is the critical predicate. Add a small test under `apps/admin/src/migrations/__tests__/` covering: bare string, localized object, partial localized object, empty object, array, null. Idempotency is also worth covering by running the script twice and asserting only the first run changed anything.
- [ ] **End-to-end Playwright (or similar) test for hreflang** — assert that `/posts/<slug>` and `/zh-CN/posts/<slug>` both contain the expected `hreflang` link tags. Catches future regressions if `buildRouteAlternates` is ever bypassed.
- [ ] **Cache tag invalidation for the cutover** — production CDN/edge holds entries tagged with the old (non-locale-scoped) names like `collection:posts` and `post:<slug>`. The new code uses `collection:posts:en` etc., so legacy cache entries linger until natural TTL expiry. Either:
  - bump a global cache version (e.g. add a cache buster to all tags) when deploying, or
  - accept the staleness (worst case ≈ `PAYLOAD_REVALIDATE_TIME` seconds).
- [ ] **Translation hook review** — `apps/admin/src/hooks/createTranslationHook.ts` is wired into Tags and Series via `beforeChange`. Confirm it still behaves sensibly with the normalized data shape; specifically, that it does not re-trigger for documents that are already localized.

### Low value

- [ ] **Storybook smoke** — `apps/storybook` was not opened during this work. Confirm Navbar/Footer stories still render with the new optional `currentLocale` and `homeHref` props (default behavior should match previous renders).
- [ ] **Robots.txt review** — currently a single static file. Likely fine for multilingual since `Disallow:` rules are path-based and apply to both prefixed and unprefixed paths. Verify by skimming the rendered file after deploy.
- [ ] **Documentation cross-links** — `docs/payload-cms-patterns.md` does not mention the field-level localization convention; consider adding a short "When to mark a field `localized: true`" section now that the pattern is established.

## Known Risks

- **Migration interleaved with active writes**: if editors save content while the migration is running on production, the writer might race with the normalizer. Mitigation: run during a low-traffic window or temporarily put the admin behind maintenance mode.
- **`_posts_versions` size**: the version collection can be large. The migration logs `scanned=` so the operator can spot if a long sweep is in flight; it does not paginate or batch. If the version count is very high, consider running the script in two passes (collections-only first, then add `_posts_versions`).
- **Lexical richText structure changes**: `series.description` is Lexical-stored richText. The migration treats it as opaque (it just wraps the whole `{ root: ... }` object under `{ en: ... }`). If Payload changes the Lexical schema in a future upgrade, this migration's idempotency check still holds (locale-keyed shape is unambiguous).
- **Slug uniqueness**: slugs are non-localized and `unique: true`. Editors cannot have a Chinese-only slug different from the English one. Documented as a non-goal in `multilingual-architecture.md`; revisit only if SEO data justifies it.

## Rollback Plan

If the production migration causes user-visible breakage:

1. `pnpm --filter admin migrate:down` — unwraps localized values back to bare values.
2. Redeploy the previous (pre-multilingual) build of `apps/admin` and `apps/www`. The old code expects bare values; once migrated down, it is compatible again.
3. Investigate the failure in the dev cluster before re-attempting.

The Mongo dump from step 1 of "Production Cluster Rollout" is the last-resort recovery path if `migrate:down` itself misbehaves.
