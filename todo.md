# TODO

## 1. Decouple `@repo/ui` from `next/*`

- [ ] Inventory all `next/*` imports and `next` runtime dependencies inside `packages/ui`.
- [ ] Replace direct `next/link` usage with a framework-agnostic link interface or app-level adapter.
- [ ] Replace direct `next/image` usage with a framework-agnostic image interface or app-level adapter.
- [ ] Remove direct `next-themes` coupling from shared UI and move framework-specific theme wiring to the app layer.
- [ ] Keep `apps/www` responsible for Next-specific integration points.
- [ ] Verify `@repo/ui` can build without importing `next` directly.

## 2. Tighten `use client` Boundaries

- [ ] Audit all `"use client"` files in `packages/ui` and `apps/www`.
- [ ] Move non-interactive rendering back to Server Components where possible.
- [ ] Split interactive islands from static shells instead of marking entire surfaces as client-only.
- [ ] Re-check Markdown, TOC, theme, navigation, and reading-progress flows for unnecessary client scope.

## 3. Audit Hydration and Image Strategy

- [ ] Measure which components hydrate on initial load and why.
- [ ] Identify avoidable client bundles and hydration hotspots.
- [ ] Review image delivery, sizing, priority, placeholders, and remote source rules.
- [ ] Confirm CMS media fields map cleanly to responsive image requirements.
- [ ] Document the final image rules once the audit is complete.
