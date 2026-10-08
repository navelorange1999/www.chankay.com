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

Keep real environment variable values and account identifiers out of the repository, including documentation and example files. Use variable names or nonfunctional placeholders in examples. Store deployed values in the platform's secret manager and local values in an environment file outside the checkout. Review staged changes for accidental disclosure before committing.

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

For file-free local configuration, an authenticated Vercel CLI can run a command with Development variables using `vercel env run -e development -- <command>`. It injects variables into the child process without creating an environment file. Select the correct app project with `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`; keep local cross-app URLs pointing at the local servers. See [English handwriting](./handwriting.md) for the verified integration setup. Agents must not read or modify real environment files.

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
Use the canonical origin, `https://chankay.com`, for production callbacks. The
`www.chankay.com` alias returns a 301 redirect, which converts a POST cache
invalidation request into GET and causes a 405 response. Do not assume a successful
CMS save means the best-effort invalidation callback succeeded.

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
- `HANDWRITING_MODEL_URL`
- `HANDWRITING_BLOB_READ_WRITE_TOKEN` (a separate private Blob store)

See [English handwriting](./handwriting.md) for model permissions, cache storage, and deployment checks.

### `apps/www`

Primary variables documented today:

- `PAYLOAD_API_URL`
- `PAYLOAD_REVALIDATE_TIME`
- `WWW_INTERNAL_SECRET`
- `WWW_SITE_URL`

## Runtime Constraints

The repository currently defines Vercel function settings in app-local `vercel.json` files.

Configured limits:

- `apps/admin/src/app/api/**/*.ts`: `maxDuration: 60`
- `apps/www/src/app/api/**/*.ts`: `maxDuration: 60`

Relevant config files:

- `apps/admin/vercel.json`
- `apps/www/vercel.json`

If future features need longer execution time, update the deployment design intentionally rather than assuming background-style work will fit inside current API limits.

## Background Page Assets

`apps/admin` now uses an asynchronous page-assets pipeline for generated preview and OG images.

Current behavior:

- `pages.afterChange` marks generated assets as `queued`
- public content changes enqueue a transactional frontend revalidation job
- page asset generation is dispatched separately
- a queue consumer route exists at `apps/admin/src/app/api/queue/page-assets/route.ts`
- the `page-assets` queue trigger is registered in `apps/admin/vercel.json`
- dispatch is inferred automatically:
  - local development uses an in-process queue
  - deployed Vercel runtimes publish to the `page-assets` queue topic
  - non-Vercel runtimes fall back to the in-process queue

Operational implications:

- the in-process queue improves save latency but is not durable across process restarts
- queue mode uses Vercel Queues topic `page-assets` and requires the matching trigger in `apps/admin/vercel.json`
- no page-assets-specific dispatch secret or mode variable is required
- if durable background execution is required outside Vercel, replace the dispatcher intentionally rather than assuming in-memory dispatch is sufficient

## Public Cache Revalidation

### Native publication compatibility rollout

Admin defaults to strict native publication. A reviewed Admin-only compatibility release can set
`CONTENT_PUBLICATION_MODE=compatibility` and `CONTENT_PUBLICATION_LEGACY_BEFORE` to a canonical UTC
timestamp such as `2026-01-01T00:00:00.000Z` (illustrative only). Choose and record the actual cutoff
after the last legacy editorial write, including newly created topic Tags. An absent, malformed, or
non-canonical cutoff disables the fallback. Do not deploy strict Admin or WWW readers until the
publication inventory, approved snapshots, backfill, and public visibility parity checks pass.

Compatibility permits only pre-cutoff records with no stored native state. Posts and Pages must
also have legacy `status=published`; existing Tags, Series, and Media retain their former public
visibility. An explicit native draft always remains private, and Categories always require native
publication. Pre-existing conflicting Post states therefore still require reconciliation before
deploying this release. The default strict website queries do not use this fallback: retain the
legacy WWW deployment during the compatibility phase.

Post/Page main-document writes mirror native state into legacy `status` for old readers. Draft
saves modify only Payload versions and cannot independently update the public mirror. Existing
pre-cutoff Posts without a Category can defer that requirement until migration; a previously
assigned Category cannot be cleared, new Posts still require one, and all selected references
must pass the current public-visibility predicate. Page and Site Config media checks use the same
bounded predicate with the write request so transactional updates remain visible.

Revalidation captures public visibility before both updates and deletes, using the compatibility
predicate when enabled. Deleting a private snapshot does not invalidate public caches; withdrawing
a previously public snapshot does. Remove
the compatibility settings and mirror only after the native publication cutover is verified.

Content hooks capture the previous public snapshot and enqueue a `revalidateWww` Payload job with
the same request as the content write. The job is committed or rolled back with that write. The
job contains the affected collection and all known public and draft slugs, including the old live
slug when a newer draft has a different slug.

On Vercel, the save also publishes a delayed wakeup to the `www-revalidation` queue topic. Its
verified callback reads the committed Payload job and runs it. A callback that arrives before
commit retries; a rolled-back job never reaches the website. Payload retries failed website
notifications, and the queue retries callbacks while the job is pending. Repeated deliveries are
safe because website cache invalidation is idempotent. Outside Vercel, Payload polls this job
queue every 30 seconds. The existing `WWW_INTERNAL_SECRET` authorizes the website request; no new
secret is required. Queue delivery requires the trigger in `apps/admin/vercel.json`.

Completed jobs are retained (`deleteJobOnComplete: false`) so repeated callbacks can acknowledge
their completion. A processing job untouched for five minutes can be released by a subsequent
callback, using its last update timestamp as a conditional write guard. This exceeds the callback's
60-second execution limit and recovers jobs abandoned by a terminated function without resetting
an active delivery. Queue wakeup failures reject the content write so its transaction can roll back;
public snapshot database failures also abort rather than silently skipping invalidation.

If the Vercel wakeup exhausts its retention period, the Payload job remains in the database for
inspection and operator recovery. A recurring production drain should be added if the deployment
requires automatic recovery beyond the queue retention window.

## Operational Notes

1. Treat each app as an independently deployable Vercel project.
2. Keep shared contracts explicit in environment files.
3. Prefer updating app-local `.env.example` files when new required variables are introduced.
4. If deployment behavior changes, update both this document and the relevant workflow files.

## Source of Truth

If this document diverges from the code, trust these files first:

1. `apps/admin/vercel.json`
2. `apps/www/vercel.json`
3. `.github/workflows/*`
4. `apps/admin/.env.example`
5. `apps/www/.env.example`
