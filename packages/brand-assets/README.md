# `@repo/brand-assets`

Shared brand assets for the monorepo.

## Source of truth

Keep the canonical favicon and logo files in `assets/favicon/`.

Do not manually edit synced copies under:

- `apps/www/public/favicon`
- `apps/www/src/app`
- `apps/admin/public/favicon`

## Syncing assets

Use the package script to sync one app at a time:

```bash
pnpm --filter @repo/brand-assets sync:app www
pnpm --filter @repo/brand-assets sync:app admin
```

The script copies:

- the full favicon set into each app's `public/favicon/`
- `favicon.ico`, `icon.png`, and `apple-icon.png` into `apps/www/src/app/` for Next.js file-based metadata

`apps/admin` consumes the shared favicon files through Payload's `admin.meta.icons` config and does not need file-based metadata icons under `src/app/`.
