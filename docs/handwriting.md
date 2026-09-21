# English handwriting

The `handWriting` page block stores English text and generation settings. It does not reference a new CMS collection. Generated artifacts are immutable private Blob JSON files shared by all blocks with the same normalized settings.

## Data flow

1. The block exposes text, named style, clarity, speed and element controls. Its seed defaults to 42; style defaults to `rounded` (09). Text is currently shared across locales and limited to the supported English alphabet, digits and punctuation, 1–50 characters on one line.
2. The inline CMS preview debounces unsaved settings for 400ms, authenticates through the existing Payload session, and requests a server artifact. Preview never saves or publishes a page. Replay only animates; Write again changes the unsaved seed.
3. The admin generator hashes canonical text/style/seed/clarity plus model and algorithm versions. A private Blob read returns the existing result, or the server generates and creates `handwriting/v1/<sha256>.json` without overwriting it. Concurrent requests in one process share a promise; multiple instances may compute twice, but reuse the winning file.
4. Saving pages also schedules the existing page-assets queue. Container children and card content blocks are traversed. The worker re-reads pages after generation so a slow task does not write its old snapshot over a newer edit. Handwriting finishes before screenshot/OG work.
5. The website fetches the artifact through an internal authenticated admin endpoint and caches it under a per-fingerprint Next tag. Generation invalidates this tag across dependent pages. The server renders SVG paths and CSS animation; it never sends model weights or inference code to homepage visitors. Missing/unavailable artifacts display the current text in the same reserved layout.

## Package boundaries

`packages/handwriting` exports `schema`, `generator`, `browser` and `react` separately. There is no root barrel. The existing `@repo/ui` HandWriting component wraps the player for semantic headings and current-text fallback. The generator accepts only opaque models verified against the pinned digest. No model weights or third-party runtime scripts are committed.

The hash excludes page/block identity, speed and color. Changing text or seed makes a new artifact. Modifying one block never changes another block's content, even when they previously shared an artifact.

## Deployment configuration

Configure these through deployment settings or an approved secret manager. Do not commit real environment files or credentials.

| Application   | Setting                             | Purpose                                                                                             |
| ------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| Admin         | `HANDWRITING_MODEL_URL`             | HTTP(S) URL to a permitted copy of the pinned model; no built-in production URL                     |
| Admin         | `HANDWRITING_BLOB_READ_WRITE_TOKEN` | Access to a **private** Vercel Blob store; kept separate from any public media store                |
| Admin and www | Existing `WWW_INTERNAL_SECRET`      | Internal artifact reads and cache invalidation                                                      |
| Admin         | Existing `WWW_SITE_URL`             | Target for per-hash cache invalidation                                                              |
| www           | Existing `PAYLOAD_API_URL`          | Admin API base, including `/api`                                                                    |
| Storybook     | `VITE_HANDWRITING_MODEL_URL`        | Publicly readable, permitted model URL for the opt-in playground; embedded into the Storybook build |

### Environment mapping

The admin project uses separate private stores in Hong Kong (`hkg1`):

| Store              | Connected Vercel environment | Variable prefix    |
| ------------------ | ---------------------------- | ------------------ |
| `handwriting-dev`  | Development only             | `HANDWRITING_BLOB` |
| `handwriting-prod` | Production only              | `HANDWRITING_BLOB` |

When connecting a store in the Vercel dashboard, use the custom prefix `HANDWRITING_BLOB` and enable the read-write token environment variable. The resulting credential name is `HANDWRITING_BLOB_READ_WRITE_TOKEN`. Vercel also creates store-ID and webhook-verification variables; this SDK integration currently only consumes the read-write token. Production credentials must remain sensitive. The existing public media stores are separate.

There is no hosted test environment for this feature. Development configuration is for the local admin process. Its evaluation model URL is `http://127.0.0.1:8766/model.bin`, which requires the local model server to be running. Do not use this loopback address for Production. For the initial production rollout, the owner selected `https://www.calligrapher.ai/d.bin` as the server-side model source. Its bytes were verified against the SDK's pinned SHA-256 on September 21, 2026. This depends on upstream availability; no public model copy is hosted by this project.

Use an authenticated Vercel CLI with `vercel env run -e development -- <command>` to inject Development configuration directly into the local process without writing an environment file. Set the non-secret `VERCEL_ORG_ID` and app-specific `VERCEL_PROJECT_ID`, or use an already linked project. This was verified with CLI 59.23.2. Preserve the injected database/session settings, point local www at `http://localhost:3001/api`, and point local admin revalidation at `http://localhost:3000`. Never paste credentials into chat or commit them; agents must follow the repository's environment-file restrictions. Restart local processes after changing Vercel configuration. See the [Vercel CLI documentation](https://vercel.com/docs/cli/env).

The package README records the required model digest and supported format. The upstream page does not state a model license; the owner's source selection does not establish redistribution rights. Public model hosting, including for Storybook, still requires the appropriate permission. Replacing the model requires verifying compatibility and changing the digest/version that participates in the cache key.

CMS previews use the same server artifact that the website reads, so browser and Node numerical differences cannot change the saved preview. The standalone Storybook playground uses local Worker generation and a bounded session cache; its output is not uploaded to production storage.

After deployment, open and preview or save existing pages containing handwriting to populate their artifacts. Legacy blocks missing the new fields retain `Hello world`, rounded style, seed42 and clarity0.85. No production records are modified by this code delivery. No multilingual fields or migration are included in this first release.

## Storybook and checks

The existing playback stories use `fixtures/hello-world.json` and work without any model service. The separate HandWriting Playground loads its Worker/model only after Generate or Write again, supports all nine named styles, ignores superseded results and disposes its Worker on unmount. Static Storybook builds include a separate Worker asset.

Use Node22.13+ (Node24 recommended for the current pnpm version):

```sh
pnpm --filter @chankay/handwriting build
pnpm --filter @chankay/handwriting test:run
pnpm --filter admin test:run
pnpm --filter www test:run
pnpm --filter @repo/ui build
pnpm --filter admin check-types
pnpm --filter www check-types
pnpm --filter storybook build
```

Real-model tests additionally accept `HANDWRITING_TEST_MODEL` as the path to a locally provided model. They skip when it is absent; they never download weights automatically. See the package tests for digest, determinism, cancellation, geometry and player coverage.

CMS tests cover authentication/origin checks, immutable private storage, coalesced requests, failure/retry, card nesting, edits during generation, stale preview responses, unsaved seed changes, and transient invalid speed inputs. A real Payload session and private Blob configuration are still needed for a deployment smoke test; mocked interaction tests do not substitute for those credentials or external storage verification.

### Local integration verification

Verified against Development configuration and `handwriting-dev` on September 21, 2026:

- A missing `Hello world` artifact generated and persisted in 2.2 seconds; a normalized repeat (`  Hello   world  `) returned the identical artifact in 0.2 seconds. These are single local observations, not production performance guarantees.
- The artifact contains nine strokes and is 12,683 bytes. An attempted duplicate immutable write reused the existing artifact, and a subsequent storage read matched it.
- The www project's injected shared secret successfully read the artifact through the local admin HTTP endpoint. The same endpoint returned 401 without authentication.
- The actual CMS block preview generated `Welcome home` from an unsaved text edit using 09 Rounded. No page was saved or published during the check.
- The local homepage displayed handwritten `Hello world`; its raw server response already contained nine SVG stroke paths and animation CSS, with no local model URL in the HTML.
- The background preparation functions handled nested card blocks with real Development Blob reads and two successful authenticated cache invalidations against local www. A simulated document reread changed `Hello world` to `Welcome home`; preparation returned the newer document after generating both inputs. No CMS documents were written by this check.
- A real-browser animation regression reproduced and then verified the round-cap fix: delayed strokes remain hidden, active and finished strokes remain visible, and static playback remains visible alongside animated playback. The updated player was also checked in CMS and on the local homepage.

Both Next apps explicitly declare the Tailwind PostCSS plugin because their shared PostCSS configuration resolves plugin names from the consuming app. Without that dependency, the local CMS page failed CSS compilation even though the standalone artifact endpoint worked.

These local checks do not validate the save-triggered queue against production records. Production deployment must separately verify authenticated artifact reads and the public homepage.

The initial content uses `Hello world` without punctuation. Punctuation remains accepted by the SDK, but no punctuation-specific geometry correction is applied. Generated punctuation may vary with the seed and clarity setting.
