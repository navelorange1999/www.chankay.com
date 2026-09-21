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

The package README records the required model digest and supported format. Model use/redistribution permission remains an operational prerequisite: the prototype's public download is not an authorization to host those weights. Public Storybook model hosting requires the appropriate permission too. Replacing the model requires verifying compatibility and changing the digest/version that participates in the cache key.

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
