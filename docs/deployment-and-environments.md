# Deployment and Environments

> Last Updated: March 12, 2026

This document describes the current deployment model for the repository. It covers the existing `www` and `admin` applications only.

## Deployment Model

The repository is deployed as a monorepo with multiple Vercel projects.

Current deployment targets:

- `apps/www`: public website
- `apps/admin`: Payload CMS admin application

Each app is deployed independently even though they share the same repository.

## Vercel Project Setup

Deployment workflows use separate Vercel project IDs:

- `VERCEL_WWW_PROJECT_ID` for `apps/www`
- `VERCEL_ADMIN_PROJECT_ID` for `apps/admin`

The shared Vercel organization ID is provided through `VERCEL_ORG_ID`.

The current CI workflows use `vercel pull`, `vercel build`, and `vercel deploy` inside GitHub Actions.

Relevant workflow files:

- `.github/workflows/www-staging.yml`
- `.github/workflows/www-production.yml`
- `.github/workflows/admin-staging.yml`
- `.github/workflows/admin-production.yml`

## Environments

The repository currently uses these deployment environments:

- Local development
- Vercel preview
- Vercel production

### Local Development

Local environment variables are sourced from app-local files:

- `apps/admin/.env.local`
- `apps/www/.env.local`

Templates:

- `apps/admin/.env.example`
- `apps/www/.env.example`

### Preview Environment

Preview deployments are triggered by pushes to the `staging` branch:

- `admin` preview: `.github/workflows/admin-staging.yml`
- `www` preview: `.github/workflows/www-staging.yml`

Both workflows pull Vercel preview environment configuration before building.

### Production Environment

Production deployments are triggered from GitHub releases with tag-based routing:

- `admin-v*` triggers admin production deployment
- `www-v*` triggers www production deployment

Relevant workflow files:

- `.github/workflows/admin-production.yml`
- `.github/workflows/www-production.yml`

## Cross-App Contract

`apps/admin` and `apps/www` communicate through shared configuration.

### Shared Secret

`WWW_INTERNAL_SECRET` must match in both apps.

It is used for:

- Preview screenshot generation
- Frontend revalidation
- Internal admin-to-www requests

See:

- `apps/admin/.env.example`
- `apps/www/.env.example`

### Public Site URL

`WWW_SITE_URL` is used by admin-side integrations when the public site URL must be known explicitly.

## App Environment Variables

### `apps/admin`

Primary variables documented today:

- `DATABASE_URI`
- `PAYLOAD_SECRET`
- `NEXT_PUBLIC_SERVER_URL`
- `VERCEL_BLOB_READ_WRITE_TOKEN`
- `VERCEL_BLOB_PUBLIC_BASE_URL`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_TOKEN`
- `PREVIEW_CAPTURE_API_URL`
- `PREVIEW_CAPTURE_API_KEY`
- `WWW_INTERNAL_SECRET`
- `WWW_SITE_URL`

### `apps/www`

Primary variables documented today:

- `PAYLOAD_API_URL`
- `PAYLOAD_REVALIDATE_TIME`
- `WWW_INTERNAL_SECRET`
- `WWW_SITE_URL`

## Runtime Constraints

The repository currently defines API function duration limits in `vercel.json`.

Configured limits:

- `apps/admin/src/app/api/**/*.ts`: `maxDuration: 60`
- `apps/www/src/app/api/**/*.ts`: `maxDuration: 60`

If future features need longer execution time, update the deployment design intentionally rather than assuming background-style work will fit inside current API limits.

## Operational Notes

1. Treat each app as an independently deployable Vercel project.
2. Keep shared contracts explicit in environment files.
3. Prefer updating app-local `.env.example` files when new required variables are introduced.
4. If deployment behavior changes, update both this document and the relevant workflow files.

## Source of Truth

If this document diverges from the code, trust these files first:

1. `vercel.json`
2. `.github/workflows/*`
3. `apps/admin/.env.example`
4. `apps/www/.env.example`
