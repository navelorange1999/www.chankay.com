# `@chankay/brand-assets`

Shared brand assets for the monorepo.

## Installation

```bash
pnpm add @chankay/brand-assets
```

## Source of truth

Keep the canonical favicon and logo files in `assets/favicon/`.

Do not manually edit synced copies under:

- `apps/www/public/favicon`
- `apps/www/src/app`
- `apps/admin/public/favicon`

## Syncing assets

Use the package script to sync one app at a time:

```bash
pnpm --filter @chankay/brand-assets sync:app www
pnpm --filter @chankay/brand-assets sync:app admin
```

The script copies:

- the full favicon set into each app's `public/favicon/`
- `favicon.ico`, `icon.png`, and `apple-icon.png` into `apps/www/src/app/` for Next.js file-based metadata

`apps/admin` consumes the shared favicon files through Payload's `admin.meta.icons` config and does not need file-based metadata icons under `src/app/`.

## Published asset paths

The published package exposes the favicon files under `@chankay/brand-assets/favicon/*`.

Examples:

- `@chankay/brand-assets/favicon/favicon.ico`
- `@chankay/brand-assets/favicon/favicon-32x32.png`
- `@chankay/brand-assets/favicon/apple-touch-icon.png`
- `@chankay/brand-assets/favicon/website-logo.svg`

## Consumer usage

For static sites or app frameworks, the simplest approach is to copy the published files into the target app's `public/favicon/` directory.

When your bundler supports asset URL imports, you can also import the published subpaths directly, for example:

```ts
import logoUrl from "@chankay/brand-assets/favicon/website-logo.svg?url"
```
