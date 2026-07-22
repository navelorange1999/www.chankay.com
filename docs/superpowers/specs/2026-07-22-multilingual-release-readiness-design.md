# Multilingual Release Readiness Design

## Context

The `feat/i18n` branch already contains the core multilingual architecture for English and
Simplified Chinese: shared locale configuration, locale-aware routing, Payload localization,
localized data access, SEO alternates, sitemap generation, cache invalidation, migrations, and a
language switcher. The remaining work before production is to complete user-interface
localization, close gaps in editor-controlled SiteConfig fields, and add regression coverage for
the critical locale behavior.

This change remains on `feat/i18n`. The branch will be pushed after verification, but it will not
be merged into `master` or deployed to production as part of this work.

## Goals

- Translate fixed frontend interface text for `en` and `zh-CN` without making system labels CMS
  dependencies.
- Keep editor-controlled navigation and footer text localized through Payload CMS.
- Format dates and reading-time text according to the active locale.
- Add automated regression tests for locale paths, metadata alternates, UI strings, middleware,
  and localized-data migrations.
- Update multilingual documentation and push the verified `feat/i18n` branch.

## Non-Goals

- Merging `feat/i18n` into `master`.
- Deploying or migrating production.
- Translating existing Pages, Posts, Tags, Series, or SiteConfig records.
- Adding another locale or adopting a third-party internationalization framework.
- Adding locale-specific slugs.

## Architecture

### Fixed Interface Strings

Add a typed string catalog to `@repo/i18n`. The catalog contains only interface text that is part
of application behavior rather than editorial content, including:

- Posts index title, eyebrow, description, empty state, and read-link label.
- Reading-time suffix and article navigation labels.
- Not-found metadata and visible error text.
- The fallback title for an untitled post.

Consumers retrieve a complete locale dictionary through one exported function. The catalog is
exhaustive for every `SupportedLocale`, so adding a locale produces a TypeScript error until its
interface strings are supplied. No runtime fallback is necessary for supported locales.

### Locale-Aware Formatting

Move date and reading-time presentation behind exported helpers in `@repo/i18n`. Date formatting
uses `Intl.DateTimeFormat` with the active `SupportedLocale`. Reading time uses locale-specific
text while preserving the existing numeric estimate stored by Payload.

Frontend pages pass their route locale explicitly. Content resolution helpers continue to read
localized Payload values and remain separate from presentation formatting.

### CMS-Controlled Site Text

Keep SiteConfig structure and link destinations shared across locales. Mark only these leaf text
fields as localized:

- `navigation.menuItems[].label`
- `footer.copyrightText`
- `footer.additionalLinks[].label`

This follows the existing leaf-field localization rule: arrays, URLs, external-link flags, and
layout settings remain shared. A new idempotent migration wraps existing values under the default
locale for both the SiteConfig global document and any compatible stored versions if present. The
migration exposes small pure transformation helpers so its behavior can be tested without a live
database.

## Testing Strategy

Testing follows red-green-refactor for each new behavior.

- `@repo/i18n` Vitest tests cover prefix stripping, localized path generation, route alternates,
  complete string lookup, English and Chinese date output, and reading-time text.
- Admin Vitest tests cover the new SiteConfig migration transformations, including bare values,
  already-localized values, missing values, nested arrays, and a second idempotent pass.
- Focused www tests cover middleware rewrite/pass-through behavior and page metadata alternates
  using exported or extracted pure helpers where Next.js runtime coupling would otherwise make the
  test fragile.
- Existing admin tests and type checks for `@repo/i18n`, `www`, and `admin` remain required.
- The final verification includes focused tests, repository test commands, type checks, and a
  production build when required configuration is available without reading forbidden environment
  files.

## Documentation and Delivery

Update the multilingual architecture document with the fixed-string catalog, the additional
localized SiteConfig fields, and test locations. Update the rollout runbook with the new migration
and a production checklist item for localized system text.

After all checks pass, create scoped conventional commits and push `feat/i18n` to `origin`. Leave
`master` unchanged so production release remains a separate, explicit action.

## Error Handling and Compatibility

- Locale functions accept only `SupportedLocale`; request-derived strings are validated before
  use.
- Invalid dates return no display value, preserving current behavior.
- Migration transformations ignore absent, null, and already-localized values.
- Payload fallback remains enabled, so untranslated CMS fields continue to show English until
  editors provide Chinese content.
- Shared link URLs ensure that the existing locale-aware Navbar and Footer wrappers can continue to
  add the correct route prefix without duplicating CMS records.
