# Deployment and Environments

> Last Updated: September 9, 2026

## Manual Social Publishing

Social publishing runs in the Admin project. The `social-publications` Vercel Queue topic delivers identifier-only `{ action, publicationId }` messages to `/api/queue/social-publications`. The callback has a 60-second budget; adapter calls share a 45-second execution deadline. Local and non-Vercel execution is serialized in process and is not durable across restarts.

Create a disabled Social Account first. The only initial credential reference is `wechat-primary`; code resolves it through `WECHAT_PRIMARY_APP_ID` and `WECHAT_PRIMARY_APP_SECRET`. Configure these using the deployment platform's secret settings. The application ID must equal the immutable account `providerAccountId`. Rotation may change the secret but may not redirect the account. Never put credentials in CMS fields, queues, logs, or MCP responses.

`NEXT_PUBLIC_SERVER_URL` and `VERCEL_BLOB_PUBLIC_BASE_URL` define permitted HTTPS Media origins. Images must resolve to existing Payload Media records. The worker rejects redirects and checks the stored URL, MIME type, and media modification timestamp against the snapshot. Preparation permits at most eight distinct images including the cover. `WWW_SITE_URL` determines the canonical article URL.

### WeChat draft relay operator runbook

`apps/wechat-relay` provides fixed outbound egress for WeChat draft synchronization. It runs on an operator-controlled macOS or Linux host behind a named Cloudflare Tunnel. The service accepts only signed requests for stable-token, image upload, cover material upload, draft creation, and draft read operations. Publication endpoints are rejected locally.

Build the image from the repository root on a host with Docker:

```bash
docker build -f apps/wechat-relay/Dockerfile -t chankay-wechat-relay .
```

Docker is optional. For a direct Node.js deployment, install dependencies and build both relay
workspaces from the repository root, then start the compiled service with Node.js 24 or newer. The
environment file must remain outside the checkout:

```bash
pnpm install --frozen-lockfile --filter @chankay/wechat-relay...
pnpm --filter @chankay/wechat-relay-protocol build
pnpm --filter @chankay/wechat-relay build
node --env-file=/operator/managed/wechat-relay.env apps/wechat-relay/dist/server.js
```

Run either the direct Node.js process or the Docker container, never both on the same port.

Create the relay signing secret outside the repository using an approved password or secret manager. Store the same value in the host's managed runtime environment and the Vercel secret manager as `WECHAT_RELAY_SHARED_SECRET`. Never send the value in chat, commit it, place it in CMS data, or ask an agent to inspect the real environment file.

Create the host environment file outside the checkout, restrict its filesystem permissions to the
operator account, and start the container with the relay port published only on loopback. The
restart policy recreates the running process after a Docker daemon restart; on Docker Desktop,
enable launch at login so the daemon itself returns after a host restart:

```bash
docker run --detach --name chankay-wechat-relay \
  --restart unless-stopped \
  --env-file /operator/managed/wechat-relay.env \
  -e WECHAT_RELAY_HOST=0.0.0.0 \
  -p 127.0.0.1:8787:8787 \
  chankay-wechat-relay
```

For a direct Node.js deployment on macOS, copy
`apps/wechat-relay/deploy/macos/com.chankay.wechat-relay.plist.example` outside the checkout,
replace only the absolute executable, environment-file, and checkout paths, and load it as a
per-user LaunchAgent. The example stores no secret values; Node reads the operator-managed file at
runtime. Validate the edited property list before loading it:

```bash
plutil -lint /operator/managed/com.chankay.wechat-relay.plist
install -d -m 700 "$HOME/Library/LaunchAgents"
install -m 600 /operator/managed/com.chankay.wechat-relay.plist \
  "$HOME/Library/LaunchAgents/com.chankay.wechat-relay.plist"
launchctl bootstrap "gui/$(id -u)" \
  "$HOME/Library/LaunchAgents/com.chankay.wechat-relay.plist"
```

Create the named tunnel using the operator's Cloudflare account. Keep all generated tunnel
credentials and configuration outside the repository. A locally managed tunnel configuration must
identify the tunnel UUID, reference the operator-managed credential file by absolute path, route the
relay hostname to loopback, and terminate unmatched ingress with `http_status:404`:

```yaml
tunnel: <TUNNEL_UUID>
credentials-file: /operator/managed/<TUNNEL_UUID>.json
ingress:
  - hostname: wechat-relay.chankay.com
    service: http://127.0.0.1:8787
  - service: http_status:404
```

Route and start the tunnel only after the operator has created that external configuration:

```bash
cloudflared tunnel route dns chankay-wechat-relay wechat-relay.chankay.com
cloudflared tunnel --config /operator/managed/cloudflared-config.yml run chankay-wechat-relay
```

On macOS, install `cloudflared` as a login service after the external configuration is complete. A
login service uses the current user's Cloudflare configuration. A true boot service requires
administrator approval and configuration under `/etc/cloudflared`; choose one mode and do not
install both:

```bash
cloudflared --config /operator/managed/cloudflared-config.yml service install
```

On Linux, pass the external configuration path explicitly when installing the system service:

```bash
sudo cloudflared --config /operator/managed/cloudflared-config.yml service install
```

Verify the local and public health endpoints before enabling Admin routing:

```bash
curl --fail http://127.0.0.1:8787/healthz
curl --fail https://wechat-relay.chankay.com/healthz
```

From the relay host, query a trusted public IP echo service explicitly over IPv4. Enter the observed outbound IPv4 directly into the WeChat API allowlist. A Cloudflare edge IP is not the relay's outbound address and must not be used. Recheck the address after changing the host network or ISP.

In the Vercel Admin project, configure both of these values for the intended environment and redeploy:

- `WECHAT_RELAY_URL=https://wechat-relay.chankay.com/v1/wechat`
- `WECHAT_RELAY_SHARED_SECRET` with the host-managed signing secret

Keep `WECHAT_PRIMARY_APP_ID` and `WECHAT_PRIMARY_APP_SECRET` only in Vercel. They are sent transiently through the authenticated tunnel for the stable-token call and must not be installed on the relay host. Confirm that the saved Social Publication still shows token code `40164`, has no remote state, and offers `Retry draft after connectivity fix` before selecting the action. The action may create and inspect a WeChat draft; it never publishes it.

To stop relay use, remove both relay variables from the affected Vercel environment and redeploy Admin. Stop the container and `cloudflared`, then remove the DNS route or tunnel if it is no longer needed. Preserve the Social Publication audit record and any remote draft.

### Enablement and acceptance gates

#### Current WeChat rollout: draft synchronization only

On September 8, 2026, the account owner confirmed that account `wxcc467391094c646b` has the required material upload and draft creation/read permissions. The supplied console screenshot confirms stable-token access, but publication submission and publication-status lookup are unavailable. Treat the material and draft permissions as owner-confirmed until verified by a live draft synchronization.

The authorized integration scope is to upload the selected article's media, create a WeChat draft, and inspect the result. Do not submit a publication or grant the `publish_social_publication` MCP permission. Use the Admin interface for the initial verification so no new MCP permission grants are needed. Account certification and publication acceptance remain deferred. The first article must be selected by the owner before creating a remote draft.

The following full-publication acceptance gates remain applicable when publication is resumed:

1. Verify the actual WeChat account's API permissions, quotas, IP allowlist, stable-token support, image limits, draft normalization, publication semantics, and status lookup in the account console and current official documentation.
2. Configure a sandbox account and enable its Social Account only in development. Grant native find and `prepare_social_publication` permissions explicitly on a development MCP key. New tool permissions are disabled by default; deployment does not grant them.
3. Prepare a published Post with explicit `zh-CN` content. Confirm the title, body, cover, account, locale, and snapshot. Missing locale content must fail without English fallback.
4. Grant `create_social_draft`, create one draft, and verify repeated commands do not duplicate it. Validate that `/cgi-bin/draft/get` round-trips the reviewed content exactly; the implementation fails closed if WeChat normalizes any compared field. Do not edit a remote draft while final publication is running.
5. Only after draft acceptance, grant `publish_social_publication` to a development key owned by an Admin. Confirm the exact hash and test pending, successful, failed, and interrupted status paths using the sandbox account.
6. Repeat the review explicitly for production before configuring production secrets, enabling accounts, or granting production MCP permissions. Real publication is never a production smoke test.

The application currently uses conservative limits (64-character title, 120-character summary, 8-character author, 20 KB HTML, 1 MB inline images, 10 MB cover). These are provisional application constraints, not a claim about the production account's limits. Official documentation could not be retrieved during implementation; Phase 4 acceptance remains pending. Start verification from the official [draft API](https://developers.weixin.qq.com/doc/service/api/draftbox/draftmanage/api_draft_add), [publication submission API](https://developers.weixin.qq.com/doc/service/api/public/api_freepublish_submit), and [publication status API](https://developers.weixin.qq.com/doc/service/api/public/api_freepublish_get).

### Recovery and rollback

Known non-ambiguous failures may be retried through the same command. A final publication retry requires a new explicit confirmation for the same snapshot. Provider IDs and media checkpoints suppress duplicate mutations. Queue claims use MongoDB's conditional `findOneAndUpdate` through the Payload database adapter; do not replace this with a high-level bulk update that first reads matching documents.

An interrupted mutation without a known submission stops in `unknown`. Inspect the remote account; do not recreate or blindly resubmit the publication. A known submission can be reconciled through identifier-only `status-check` delivery, which never calls draft creation or publication. The worker performs at most ten status lookups with bounded backoff; exhausted records remain `unknown` for operator inspection. Repeating the final command can redispatch a queued action or reconcile a known submission, without repeating publication. After a local process restart, queued commands need redispatch because the in-process transport is non-durable.

Disable the Social Account and MCP tool permissions to stop new work, and pause the queue trigger if rolling back. Preserve publication records and external articles. Any external deletion is a separate operational action.

This document describes the current deployment model for the repository.

## Deployment Model

The repository deploys two applications as separate Vercel projects and one optional operational service on an operator host.

Current deployment targets:

- `apps/www`: public website
- `apps/admin`: Payload CMS admin application
- `apps/wechat-relay`: operator-hosted WeChat draft egress service

Each app is deployed independently even though they share the same repository.

The WeChat relay is not a Vercel project. Its purpose is to provide the operator host's allowlisted outbound IPv4 address.

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
- Operator-hosted WeChat relay

### Local Development

Local environment variables are sourced from app-local files:

- `apps/admin/.env.local`
- `apps/www/.env.local`

Templates:

- `apps/admin/.env.example`
- `apps/www/.env.example`
- `apps/wechat-relay/.env.example`

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
- `WECHAT_PRIMARY_APP_ID`
- `WECHAT_PRIMARY_APP_SECRET`
- `WECHAT_RELAY_URL`
- `WECHAT_RELAY_SHARED_SECRET`

### `apps/www`

Primary variables documented today:

- `PAYLOAD_API_URL`
- `PAYLOAD_REVALIDATE_TIME`
- `WWW_INTERNAL_SECRET`
- `WWW_SITE_URL`

### `apps/wechat-relay`

- `WECHAT_RELAY_SHARED_SECRET`
- `WECHAT_RELAY_HOST`
- `WECHAT_RELAY_PORT`

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
- the save request triggers immediate frontend revalidation for page content
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

## Operational Notes

1. Treat `apps/www` and `apps/admin` as independent Vercel projects and `apps/wechat-relay` as an operator-hosted service.
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
6. `apps/wechat-relay/Dockerfile`
7. `apps/wechat-relay/.env.example`
