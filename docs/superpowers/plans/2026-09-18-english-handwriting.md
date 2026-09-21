# English Handwriting Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development for isolated SDK work and review. Execute the integration in this task without additional user approval.

**Goal:** Generate configurable English handwriting with CMS preview, shared private Blob artifacts, an SSR player, and Storybook demonstrations.

**Architecture:** Keep content in the existing handwriting block. Hash normalized generation settings and model/algorithm versions, store immutable artifacts outside CMS documents, and render them with a model-free player. CMS previews and background generation use the same server generator and cache; the Storybook playground uses the same core in a Worker.

**Tech Stack:** TypeScript/ES modules, React, Payload 3, Next 15, Vercel Blob, existing Vercel Queue, Vitest and Node tests.

## Shared contracts

- Package `@chankay/handwriting` exposes `schema`, `generator`, `browser`, and `react` separately; no default barrel.
- `HandwritingInput`: `{ text: string, style?: StyleId, seed?: number, legibility?: number }`.
- `normalizeInput(input)` returns required defaults (`rounded`, `42`, `0.85`). English only, 1–50 characters, reject unsupported input.
- `fingerprint(input): Promise<string>` hashes canonical settings plus model/algorithm versions. Page IDs and playback speed are excluded.
- `HandwritingArtifact`: `{ schemaVersion: 1, fingerprint: string, text: string, viewBox: [number, number, number, number], strokes: { d: string, duration: number, delay: number }[] }`. Durations/delays are seconds at speed 1.
- `validateArtifact(value, expectedFingerprint?)` returns a validated artifact or throws.
- `generateHandwriting(input, { model, signal? })` returns an artifact; `loadModel({ url, signal? })` validates the pinned model digest. Model bytes are never bundled.
- `HandwritingEngine({ modelUrl })` in browser entry exposes `generate(input): Promise<HandwritingArtifact>`, `cancel()`, `dispose()`.
- React `Handwriting({ artifact, speed?, animate?, strokeWidth?, className?, style? })` renders an accessible SVG with CSS animation. No model imports.

## Tasks

- [x] SDK: write and run failing tests for canonical hashes, validation, generation completeness and aborts; adapt the existing tested inference core; provide browser Worker and validated geometry; verify with the existing local evaluation model.
- [x] Storage: implement server-only private Blob read and create-if-absent under `handwriting/v1/<hash>.json`; bound reads, reject mismatched artifacts, distinguish missing from failed reads; share the implementation between www and admin without exposing storage access to clients.
- [x] CMS: add English text/style/seed/legibility and inline preview fields; add authenticated same-origin preview handler using the server cache; debounce preview, discard stale responses, support replay/reroll/retry, do not save pages from preview.
- [x] Queue: include handwriting blocks in existing page asset planning; generate shared artifacts before OG captures, invalidate per-hash frontend caches, never write stale block structures for handwriting completion.
- [x] Website: fetch cached artifacts on the server, render current-text fallback on misses/errors, remove client-only fixed-path entry; preserve layout, heading semantics and reduced-motion behavior.
- [x] Storybook: migrate playback stories, add named nine-style playground with lazy Worker/model loading, cancellation, input validation and explicit loading/failure feedback.
- [x] Generated contracts: regenerate Payload types/import map without accessing real environment files. Update package exports/dependencies/lockfile and narrowly scoped operational docs.
- [x] Verification: run focused SDK/cache/auth/queue tests, affected type checks, production Storybook build, and browser smoke tests. Verify the player dependency graph contains no inference code or model download. Review the complete diff and fix findings.

## Operational boundaries

No remote CMS writes, deployments, package publication, or weight redistribution are part of this implementation. Production needs a rights-cleared model URL and a private Blob store configured through deployment settings. Use the existing local evaluation model only for local generation tests and browser QA. No multilingual fields or migrations in this release. Legacy blocks use the previous Hello world text and the new default style when configuration fields are absent.
