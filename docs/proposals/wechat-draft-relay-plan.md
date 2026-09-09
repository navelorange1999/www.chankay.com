# WeChat Draft Relay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an authenticated, draft-only WeChat egress relay that runs on an operator-provided host behind `wechat-relay.chankay.com`, then allow the existing definitive token-stage failure to be retried safely.

**Architecture:** A small shared package defines the signed relay protocol. The Admin WeChat adapter wraps its existing provider fetch calls when relay configuration is present, while a standalone Node.js relay validates and forwards only allowlisted draft API requests to the fixed WeChat origin. Existing Payload queue claims, immutable snapshots, media checkpoints, and ambiguity handling remain authoritative.

**Tech Stack:** TypeScript 5, Node.js 24, Web Crypto, Node HTTP, Vitest, pnpm workspaces, TurboRepo, Docker, Cloudflare Tunnel.

---

## File Map

Create these focused units:

- `packages/wechat-relay-protocol/src/index.ts`: protocol constants, canonicalization, body hashing, HMAC signing, and verification shared by both runtimes.
- `packages/wechat-relay-protocol/src/__tests__/protocol.test.ts`: deterministic signing and tamper-rejection tests.
- `apps/wechat-relay/src/config.ts`: strict runtime configuration parsing.
- `apps/wechat-relay/src/nonceStore.ts`: bounded in-memory nonce replay protection.
- `apps/wechat-relay/src/handler.ts`: health endpoint, authentication, fixed-origin request validation, bounded forwarding, and safe responses.
- `apps/wechat-relay/src/server.ts`: Node HTTP adapter and process startup.
- `apps/wechat-relay/src/__tests__/*.test.ts`: config, replay, allowlist, binary fidelity, bounds, and error-redaction tests.
- `apps/wechat-relay/Dockerfile`: reproducible multi-stage relay image with no build-time secrets.
- `apps/wechat-relay/.env.example`: runtime variable names and safe non-secret defaults.
- `apps/admin/src/services/socialPublishing/adapters/wechat/relayTransport.ts`: validated environment selection and signed fetch wrapper.
- `apps/admin/src/services/socialPublishing/adapters/wechat/__tests__/relayTransport.test.ts`: direct fallback, partial configuration rejection, draft-only routing, signature fields, and multipart preservation.

Modify these existing units:

- `apps/admin/src/services/socialPublishing/adapters/wechat/index.ts`: select the relay-aware fetch only when the caller did not inject a test fetch.
- `apps/admin/src/services/socialPublishing/state.ts`: expose the narrow token-stage recovery predicate and use it in `canQueue`.
- `apps/admin/src/services/socialPublishing/__tests__/domain.test.ts`: verify recovery eligibility and every disqualifier.
- `apps/admin/src/services/socialPublishing/__tests__/service.test.ts`: verify the failed record transitions atomically and dispatches once.
- `apps/admin/src/components/socialPublishing/SocialPublicationActions.tsx`: label the narrow recovery action explicitly.
- `apps/admin/package.json`, `pnpm-lock.yaml`: add the shared workspace protocol dependency.
- `apps/admin/.env.example`: document relay URL and signing-secret names.
- `docs/architecture-and-stack.md`, `docs/project-overview.md`, `docs/testing-and-operations.md`, and `docs/deployment-and-environments.md`: document the new app, commands, security boundary, and operator runbook.
- `docs/proposals/wechat-draft-relay.md`: record the implemented status and verification evidence after all checks pass.
- `AGENTS.md`: keep the proposal plan discoverable while the work is in flight.

## Task 1: Shared Signed Protocol

**Files:**

- Create: `packages/wechat-relay-protocol/package.json`
- Create: `packages/wechat-relay-protocol/tsconfig.json`
- Create: `packages/wechat-relay-protocol/src/index.ts`
- Create: `packages/wechat-relay-protocol/src/__tests__/protocol.test.ts`

- [x] **Step 1: Add the package manifest and TypeScript configuration**

Use a private workspace package that builds to `dist` and has no runtime dependency:

```json
{
  "name": "@chankay/wechat-relay-protocol",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "check-types": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "clean": "rm -rf dist && rm -rf .turbo"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "@types/node": "25.0.3",
    "vitest": "^3.2.4"
  }
}
```

Set `rootDir` to `src`, `outDir` to `dist`, and extend `@repo/typescript-config/base`.
Run `pnpm install` from the repository root to add the workspace importer and links without selecting any new package versions.

- [x] **Step 2: Write failing protocol tests**

Cover a fixed canonical vector, successful verification, body tampering, metadata tampering, malformed hexadecimal input, and a secret shorter than 32 characters:

```typescript
const metadata = {
  version: "1",
  timestamp: "1788912000",
  nonce: "01234567-89ab-4def-8123-456789abcdef",
  method: "POST",
  target: "/cgi-bin/draft/add?access_token=redacted-test-token",
  contentType: "application/json",
}
const body = new TextEncoder().encode('{"articles":[]}')

it("signs and verifies one canonical request", async () => {
  const headers = await signRelayRequest({ metadata, body, secret: "s".repeat(32) })
  expect(await verifyRelayRequest({ headers, body, secret: "s".repeat(32) })).toBe(true)
})

it("rejects changed bytes", async () => {
  const headers = await signRelayRequest({ metadata, body, secret: "s".repeat(32) })
  expect(
    await verifyRelayRequest({
      headers,
      body: new TextEncoder().encode('{"articles":[{}]}'),
      secret: "s".repeat(32),
    })
  ).toBe(false)
})
```

- [x] **Step 3: Run the protocol tests and verify RED**

Run: `pnpm --filter @chankay/wechat-relay-protocol test:run`

Expected: FAIL because `signRelayRequest` and `verifyRelayRequest` do not exist.

- [x] **Step 4: Implement the minimal shared protocol**

Export immutable header names, `RelayMetadata`, `signRelayRequest`, `readRelayHeaders`, and `verifyRelayRequest`. Use `crypto.subtle.digest`, `crypto.subtle.sign`, and `crypto.subtle.verify`. Build the canonical value in this exact order:

```typescript
export function canonicalRelayRequest(metadata: RelayMetadata, bodyHash: string): string {
  return [
    metadata.version,
    metadata.timestamp,
    metadata.nonce,
    metadata.method,
    metadata.target,
    metadata.contentType,
    bodyHash,
  ].join("\n")
}
```

Validate version `1`, a 10-digit timestamp, a 16-to-128-character base64url-or-hyphen nonce, method `POST`, target and content-type length bounds, a 64-character lowercase body hash, a 64-character lowercase signature, and a 32-to-256-character secret. Reject newline characters before canonicalization.

- [x] **Step 5: Run focused checks and verify GREEN**

Run:

```bash
pnpm --filter @chankay/wechat-relay-protocol test:run
pnpm --filter @chankay/wechat-relay-protocol check-types
pnpm --filter @chankay/wechat-relay-protocol build
```

Expected: all protocol tests pass, type checking succeeds, and `dist/index.js` plus declarations are emitted.

- [x] **Step 6: Commit the protocol package**

```bash
git add packages/wechat-relay-protocol pnpm-lock.yaml
git commit -m "feat: add signed WeChat relay protocol"
```

## Task 2: Portable Draft-Only Relay

**Files:**

- Create: `apps/wechat-relay/package.json`
- Create: `apps/wechat-relay/tsconfig.json`
- Create: `apps/wechat-relay/src/config.ts`
- Create: `apps/wechat-relay/src/nonceStore.ts`
- Create: `apps/wechat-relay/src/handler.ts`
- Create: `apps/wechat-relay/src/server.ts`
- Create: `apps/wechat-relay/src/__tests__/config.test.ts`
- Create: `apps/wechat-relay/src/__tests__/handler.test.ts`
- Create: `apps/wechat-relay/Dockerfile`
- Create: `apps/wechat-relay/.env.example`

- [x] **Step 1: Add the relay app shell**

Create private package `@chankay/wechat-relay` with scripts `build`, `start`, `check-types`, `test`, `test:run`, and `clean`. Depend on `@chankay/wechat-relay-protocol` through `workspace:*`; use the same TypeScript and Vitest versions as the shared package. Compile `src` to `dist` with NodeNext modules.

Run `pnpm install` from the repository root after adding the manifest so the workspace link and lockfile importer exist before the RED test.

- [x] **Step 2: Write failing configuration and nonce tests**

Require `WECHAT_RELAY_SHARED_SECRET`, default the host to `127.0.0.1` and port to `8787`, reject non-numeric or privileged ports, and reject secrets outside the protocol length. Verify that a nonce is accepted once, rejected until expiry, accepted after expiry, and that the store never exceeds 10,000 entries.

```typescript
it("defaults to a loopback listener", () => {
  expect(readRelayConfig({ WECHAT_RELAY_SHARED_SECRET: "s".repeat(32) })).toEqual({
    host: "127.0.0.1",
    port: 8787,
    sharedSecret: "s".repeat(32),
  })
})
```

- [x] **Step 3: Run the configuration tests and verify RED**

Run: `pnpm --filter @chankay/wechat-relay test:run`

Expected: FAIL because the config parser and nonce store do not exist.

- [x] **Step 4: Implement configuration and replay protection**

Implement strict string parsing without printing values. `NonceStore.consume(nonce, expiresAt, now)` must prune expired entries, reject a live duplicate, insert one new nonce, and evict the oldest entry when the bound is exceeded.

- [x] **Step 5: Write failing relay handler tests**

Use signed requests from the shared protocol and an injected upstream fetch. Cover:

```typescript
it("forwards exact multipart bytes and content type", async () => {
  const bytes = new Uint8Array([0, 1, 2, 253, 254, 255])
  const upstream = vi.fn(async (_url: URL | RequestInfo, init?: RequestInit) => {
    expect(new Uint8Array(await new Response(init?.body).arrayBuffer())).toEqual(bytes)
    expect(new Headers(init?.headers).get("content-type")).toBe(
      "multipart/form-data; boundary=safe-boundary"
    )
    return Response.json({ media_id: "remote" })
  })
  const response = await handleRelayRequest(await signedRequest(bytes), dependencies(upstream))
  expect(response.status).toBe(200)
})
```

Also reject unsigned requests, invalid signatures, expired timestamps, duplicate nonces, absolute targets, unknown query parameters, all `/cgi-bin/freepublish/*` paths, unknown paths, requests above 12 MB, upstream redirects, responses above 2 MB, and upstream timeouts. Assert every rejection body is the same bounded generic JSON shape and does not include the request target, token, signature, or thrown upstream message.

- [x] **Step 6: Run handler tests and verify RED**

Run: `pnpm --filter @chankay/wechat-relay test:run`

Expected: FAIL because `handleRelayRequest` does not exist.

- [x] **Step 7: Implement the health and proxy handlers**

Use these fixed restrictions:

```typescript
const allowedQueries: Record<string, ReadonlySet<string>> = {
  "/cgi-bin/stable_token": new Set(),
  "/cgi-bin/media/uploadimg": new Set(["access_token"]),
  "/cgi-bin/material/add_material": new Set(["access_token", "type"]),
  "/cgi-bin/draft/add": new Set(["access_token"]),
  "/cgi-bin/draft/get": new Set(["access_token"]),
}
```

Require `type=image` for material upload, reject duplicate query keys, fix the upstream origin to `https://api.weixin.qq.com`, set `redirect: "error"`, and forward only `content-type`. Read request and response streams with explicit byte counters. Return only `content-type` from the upstream response.

`GET /healthz` returns `{"status":"ok"}`. Every other local path or method returns a generic 404 or 405 without configuration details.

- [x] **Step 8: Add the Node HTTP adapter and graceful shutdown**

Convert each bounded incoming request to a Web `Request`, call `handleRelayRequest`, and copy the bounded `Response` to Node's `ServerResponse`. Start only from `server.ts`, handle `SIGINT` and `SIGTERM`, and log only fixed lifecycle messages such as `WeChat relay listening.` and `WeChat relay stopped.`

- [x] **Step 9: Add the Docker image and example variables**

Use an official `node:24.10.0-alpine` multi-stage image. Build the protocol package and relay app, then copy only relay output, the built protocol output, and package manifests into a non-root runtime image. Do not use build arguments or `ENV` instructions for secrets.

The allowed example file contains names and safe defaults only:

```dotenv
WECHAT_RELAY_SHARED_SECRET=
WECHAT_RELAY_HOST=127.0.0.1
WECHAT_RELAY_PORT=8787
```

The Docker command overrides `WECHAT_RELAY_HOST=0.0.0.0` inside the container while publishing the container port only on the host's `127.0.0.1` interface.

- [ ] **Step 10: Verify the relay app and image**

Run:

```bash
pnpm --filter @chankay/wechat-relay test:run
pnpm --filter @chankay/wechat-relay check-types
pnpm --filter @chankay/wechat-relay build
docker build -f apps/wechat-relay/Dockerfile -t chankay-wechat-relay:test .
```

Start the image with a locally supplied test secret, bind it only to `127.0.0.1`, and verify `/healthz` returns 200. Do not send a live WeChat request.

The relay tests, type check, build, and direct Node health check passed on 2026-09-09. The Docker image build and container health check remain pending because the local Docker daemon was unavailable.

- [x] **Step 11: Commit the relay service**

```bash
git add apps/wechat-relay pnpm-lock.yaml
git commit -m "feat: add portable WeChat draft relay"
```

## Task 3: Admin Relay Transport

**Files:**

- Create: `apps/admin/src/services/socialPublishing/adapters/wechat/relayTransport.ts`
- Create: `apps/admin/src/services/socialPublishing/adapters/wechat/__tests__/relayTransport.test.ts`
- Modify: `apps/admin/src/services/socialPublishing/adapters/wechat/index.ts`
- Modify: `apps/admin/package.json`
- Modify: `apps/admin/.env.example`
- Modify: `pnpm-lock.yaml`

- [x] **Step 1: Write failing transport tests**

Verify that no relay variables returns the injected direct fetch unchanged, partial configuration rejects before any network request, invalid URLs reject, publication paths reject locally, and a signed draft request preserves raw bytes and multipart content type.

```typescript
it("routes a draft request through the configured relay", async () => {
  const relayFetch = vi.fn().mockResolvedValue(Response.json({ media_id: "remote" }))
  const fetcher = createWeChatRelayFetch(
    {
      WECHAT_RELAY_URL: "https://wechat-relay.chankay.com/v1/wechat",
      WECHAT_RELAY_SHARED_SECRET: "s".repeat(32),
    },
    relayFetch,
    { now: () => 1788912000000, nonce: () => "01234567-89ab-4def-8123-456789abcdef" }
  )
  await fetcher("https://api.weixin.qq.com/cgi-bin/draft/add?access_token=test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"articles":[]}',
  })
  expect(relayFetch).toHaveBeenCalledWith(
    new URL("https://wechat-relay.chankay.com/v1/wechat"),
    expect.objectContaining({ method: "POST", redirect: "error" })
  )
})
```

- [x] **Step 2: Run the transport tests and verify RED**

Run:

```bash
pnpm --filter @chankay/wechat-relay-protocol build
pnpm --filter admin test:run -- relayTransport.test.ts
```

Expected: FAIL because `createWeChatRelayFetch` does not exist.

- [x] **Step 3: Implement relay configuration and signed forwarding**

`createWeChatRelayFetch(environment, baseFetch, dependencies)` must:

1. return `baseFetch` when both relay variables are absent;
2. return a fetch function that throws a sanitized configuration error when only one variable is present;
3. accept only an HTTPS relay URL without credentials, query, or fragment and with pathname `/v1/wechat`;
4. accept only POST requests to the fixed WeChat origin and the five draft-only paths;
5. construct a `Request`, materialize its encoded raw body once, preserve its computed content type, sign the exact method and relative target, and send only protocol headers plus the upstream content type;
6. preserve the caller's abort signal and use `redirect: "error"` for the relay call.

- [x] **Step 4: Wire the transport into the adapter**

Keep explicit test injection authoritative:

```typescript
export function createWeChatAdapter(options: WeChatClientOptions = {}) {
  const fetcher = options.fetch ?? createWeChatRelayFetch(process.env, fetch)
  const client = new WeChatClient({ ...options, fetch: fetcher })
  // Existing adapter behavior remains unchanged.
}
```

Add `@chankay/wechat-relay-protocol: workspace:*` to Admin dependencies and document `WECHAT_RELAY_URL` plus `WECHAT_RELAY_SHARED_SECRET` in `apps/admin/.env.example` without values.

Run `pnpm install` from the repository root to record the Admin workspace dependency before executing the focused tests.

- [x] **Step 5: Verify focused Admin behavior**

Run:

```bash
pnpm --filter @chankay/wechat-relay-protocol build
pnpm --filter admin test:run -- relayTransport.test.ts wechat.test.ts
pnpm --filter admin check-types
```

Expected: relay transport and existing WeChat tests pass; Admin type checking succeeds.

- [x] **Step 6: Commit Admin relay routing**

```bash
git add apps/admin/package.json apps/admin/.env.example apps/admin/src/services/socialPublishing/adapters/wechat packages/wechat-relay-protocol pnpm-lock.yaml
git commit -m "feat: route WeChat drafts through signed relay"
```

## Task 4: Safe Connectivity Recovery

**Files:**

- Modify: `apps/admin/src/services/socialPublishing/state.ts`
- Modify: `apps/admin/src/services/socialPublishing/__tests__/domain.test.ts`
- Modify: `apps/admin/src/services/socialPublishing/__tests__/service.test.ts`
- Modify: `apps/admin/src/services/socialPublishing/records.ts`
- Modify: `apps/admin/src/components/socialPublishing/SocialPublicationActions.tsx`

- [x] **Step 1: Write failing state-policy tests**

Add a `canRetryDraftAfterConnectivityFix` test that accepts exactly a `failed`, non-ambiguous `token` error with empty remote state, even when `retryable` is false. Reject media checkpoints, draft/submission/publication IDs, ambiguous errors, token success state, and every other stage.

```typescript
const rejectedToken = {
  status: "failed",
  remote: {},
  lastError: { stage: "token", code: "40164", retryable: false, ambiguous: false },
}
expect(canRetryDraftAfterConnectivityFix(rejectedToken)).toBe(true)
expect(canQueue(rejectedToken, "create-draft")).toBe(true)
expect(
  canRetryDraftAfterConnectivityFix({ ...rejectedToken, remote: { media: { cover: "known" } } })
).toBe(false)
```

- [x] **Step 2: Run the domain test and verify RED**

Run: `pnpm --filter admin test:run -- domain.test.ts`

Expected: FAIL because the recovery predicate does not exist and `canQueue` rejects code `40164`.

- [x] **Step 3: Implement the narrow recovery predicate**

Treat all keys in `remote.media` and every remote identifier as evidence of remote state. Call the predicate from the `create-draft` branch in `canQueue`; do not change publish recovery or unknown-state behavior.

- [x] **Step 4: Write a failing command-service recovery test**

Prepare a publication, replace its status with the definitive token failure, make the conditional database transition succeed, and assert one `failed -> draft_queued` attempt plus one identifier-only queue dispatch. Add disqualifying cases that never call `updateOne` or the dispatcher.

- [x] **Step 5: Run the service test and verify RED**

Run: `pnpm --filter admin test:run -- service.test.ts`

Expected: the positive test fails until the state predicate is connected through the existing command path.

- [x] **Step 6: Complete the service and UI behavior**

Use the existing `create-draft` endpoint and snapshot hash. Do not add a force endpoint. In the Admin component, calculate the recovery predicate before rendering the button and use this label only for that state:

```tsx
{
  connectivityRetry ? "Retry draft after connectivity fix" : "Create remote draft"
}
```

Keep stale snapshots disabled and retain the existing error display and audit append behavior.

- [x] **Step 7: Verify recovery behavior**

Run:

```bash
pnpm --filter admin test:run -- domain.test.ts service.test.ts
pnpm --filter admin check-types
```

Expected: all focused tests and Admin type checking pass.

- [x] **Step 8: Commit connectivity recovery**

```bash
git add apps/admin/src/services/socialPublishing/state.ts apps/admin/src/services/socialPublishing/__tests__ apps/admin/src/components/socialPublishing/SocialPublicationActions.tsx
git commit -m "feat: retry definitive WeChat token failures"
```

## Task 5: Repository Documentation and Full Verification

**Files:**

- Modify: `docs/architecture-and-stack.md`
- Modify: `docs/project-overview.md`
- Modify: `docs/testing-and-operations.md`
- Modify: `docs/deployment-and-environments.md`
- Modify: `docs/proposals/wechat-draft-relay.md`
- Modify: `AGENTS.md`

- [x] **Step 1: Document the stable project structure**

Add `apps/wechat-relay` and `packages/wechat-relay-protocol` to the monorepo map, application list, commands, and important paths. Describe the relay as an operational service with no CMS content responsibilities.

- [x] **Step 2: Add the operator runbook**

Document this sequence without embedding any secret value:

```bash
docker build -f apps/wechat-relay/Dockerfile -t chankay-wechat-relay .
docker run --rm --name chankay-wechat-relay \
  --env-file /operator/managed/wechat-relay.env \
  -e WECHAT_RELAY_HOST=0.0.0.0 \
  -p 127.0.0.1:8787:8787 \
  chankay-wechat-relay
cloudflared tunnel route dns chankay-wechat-relay wechat-relay.chankay.com
cloudflared tunnel run chankay-wechat-relay
```

State that the operator creates the secret outside the repository, configures the same value in the host and Vercel secret managers, never sends it in chat, and never asks an agent to inspect the real environment file. Explain how to determine the host's outbound IPv4 without copying it into documentation, add it to the WeChat allowlist, verify `/healthz`, enable the Vercel relay URL, and stop or roll back the relay.

- [x] **Step 3: Update proposal status and index**

After verification, record the exact tests and build results in `docs/proposals/wechat-draft-relay.md`. Keep `docs/proposals/wechat-draft-relay-plan.md` indexed in `AGENTS.md` while implementation is in flight; remove the plan index when the proposal is promoted after live acceptance.

- [ ] **Step 4: Run formatting and focused workspace checks**

Run:

```bash
pnpm install --frozen-lockfile
pnpm --filter @chankay/wechat-relay-protocol test:run
pnpm --filter @chankay/wechat-relay test:run
pnpm --filter admin test:run
pnpm --filter @chankay/wechat-relay-protocol check-types
pnpm --filter @chankay/wechat-relay check-types
pnpm --filter admin check-types
pnpm exec prettier --check AGENTS.md apps/wechat-relay apps/admin/src/services/socialPublishing packages/wechat-relay-protocol docs
```

Expected: installation is unchanged except for the new workspace importers; all tests, type checks, and formatting checks pass.

The full protocol, relay, and Admin test suites, all three type checks, and formatting checks for affected files passed on 2026-09-09. A frozen install cannot safely replace this worktree's shared `node_modules` link; the lockfile contains only the intended workspace importers. Three unrelated pre-existing files under `docs/superpowers/` fail the repository-wide formatting check and were left untouched.

- [ ] **Step 5: Run builds and a local relay smoke test**

Run:

```bash
pnpm --filter @chankay/wechat-relay-protocol build
pnpm --filter @chankay/wechat-relay build
pnpm --filter admin build
docker build -f apps/wechat-relay/Dockerfile -t chankay-wechat-relay:test .
```

Start the container with a locally managed test secret, call `/healthz`, and send one signed request to a mocked upstream. Do not call WeChat and do not create a remote draft during automated verification.

The protocol and relay builds and the local Node health and injected-upstream tests passed. Docker verification remains pending because no local daemon is running. The Admin build compiled and passed its type phase, then the inherited cross-worktree dependency links caused conflicting React runtimes while prerendering `/404`; rerun it in CI or a clean checkout.

- [ ] **Step 6: Perform browser verification of the Admin recovery state**

Open the existing failed publication in the authenticated Preview Admin. Verify that the exact snapshot remains unchanged, the last error still shows token code `40164`, the only draft recovery control reads `Retry draft after connectivity fix`, and no publication action is taken. Do not click the retry until the separate host, tunnel, Vercel variables, and WeChat allowlist are configured.

- [x] **Step 7: Commit documentation and verification evidence**

```bash
git add AGENTS.md docs apps/wechat-relay packages/wechat-relay-protocol apps/admin
git commit -m "docs: add WeChat relay operations runbook"
```

- [x] **Step 8: Review the final branch**

Inspect `git diff origin/feat/social-publishing...HEAD`, confirm real environment files and generated secrets are absent, confirm `output/` remains unrelated and untracked, and verify the branch contains no publication action performed during testing.

## Live Acceptance After the Operator Provides the Host

The following steps are deliberately outside automated implementation:

1. Install the verified relay image and `cloudflared` on the provided host.
2. Create the named tunnel and DNS route for `wechat-relay.chankay.com`.
3. Configure the shared signing secret in the host and Vercel secret managers.
4. Add the host's observed outbound public IPv4 address to the WeChat allowlist.
5. Verify authenticated relay connectivity using a non-mutating token request.
6. Review the saved article snapshot and select `Retry draft after connectivity fix`.
7. Inspect the resulting WeChat draft and leave it unpublished.
