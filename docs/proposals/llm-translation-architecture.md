# LLM Translation Architecture

> Status: Proposal · Last Updated: May 9, 2026

This document defines how editor-triggered, LLM-backed translation is wired into the CMS, and how Langfuse provides observability, prompt management, and evaluation for those calls. The repository already stores localized content through Payload and serves locale-aware routes through `@repo/i18n`; this document only covers the translation production path and its instrumentation.

## Goals

- Let an editor translate a Post / Page / Tag / Series field from the default locale to any other supported locale with a single click in the Payload admin.
- Use Anthropic Claude (Haiku tier) as the translation engine, preserving Markdown / Lexical structure, code blocks, URLs, and inline formatting.
- Use Langfuse Cloud for tracing, prompt versioning, cost tracking, and (later) evaluation. Ship with Cloud, retain the option to migrate to self-hosted without code changes.
- Always write LLM output to a draft, never to the published version. The editor must explicitly review and publish.
- Keep the existing `services/translation` adapter pattern intact: add Anthropic as one more adapter alongside `mock`, `openai`, `deepl`, `google`, `baidu`.

## Non-Goals

- Auto-translation on save or publish. Translation is manual and editor-initiated.
- Background batch translation of historical content. The editor triggers per document, per locale.
- Translating non-localized fields (slugs, operational metadata, SEO `ogImage`).
- Translation memory or terminology databases beyond what fits inside the prompt itself.
- Routing different language pairs to different providers at runtime. The factory's `getOptimalTranslationService` heuristic is bypassed; Anthropic handles all pairs in the first phase.
- Self-hosting Langfuse. Cloud is the supported deployment; self-hosting is a documented future option, not an active workstream.

## High-Level Flow

```text
Editor in Payload admin
  │
  │ clicks "Translate from en" on the [zh-CN] locale tab
  ▼
TranslateButton (custom admin field component)
  │
  │ POST /api/translate { collection, docId, fromLocale, toLocale, fields }
  ▼
apps/admin/src/app/api/translate/route.ts
  │
  ├── Authn: requires logged-in admin user
  ├── Reads source doc from Payload at `fromLocale`
  ├── For each requested field: calls TranslationService
  └── Writes result back to draft of same doc at `toLocale`
                  │
                  ▼
        UniversalTranslator (services/translation)
                  │
                  ▼
        AnthropicTranslationAdapter
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
   Langfuse             Anthropic
   - getPrompt          - messages.create
   - trace / generation
   - cost / token usage
```

## Provider Choice

| Concern                | Choice                     | Reason                                                                                             |
| ---------------------- | -------------------------- | -------------------------------------------------------------------------------------------------- |
| LLM                    | Anthropic Claude Haiku 4.5 | Strong CN/EN quality, cheap at blog volume (~$0.001 per medium post), preserves Markdown reliably. |
| Observability platform | Langfuse Cloud (free tier) | Open-source schema, future migration to self-hosted is an env var change. 50K observations/month.  |
| Prompt storage         | Langfuse Prompt Management | Versioned prompts, edit without redeploy, CDN-cached fetch with local TTL.                         |
| Adapter slot           | New `anthropic` provider   | Avoids overloading the existing `openai` adapter; keeps each adapter single-purpose.               |

## Package Additions

Both packages are admin-side only. No changes to `apps/www`.

```bash
pnpm --filter admin add langfuse @anthropic-ai/sdk
```

| Package             | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| `langfuse`          | Tracing client + prompt management + cost capture. |
| `@anthropic-ai/sdk` | Anthropic Messages API client.                     |

## Environment Variables

Added to `apps/admin/.env.example` and required at runtime. The translate endpoint refuses to start if any are missing.

| Variable               | Required | Notes                                                                      |
| ---------------------- | -------- | -------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`    | yes      | `sk-ant-...`. Server-side only, never exposed to the browser.              |
| `LANGFUSE_PUBLIC_KEY`  | yes      | `pk-lf-...`.                                                               |
| `LANGFUSE_SECRET_KEY`  | yes      | `sk-lf-...`.                                                               |
| `LANGFUSE_BASEURL`     | no       | Defaults to `https://cloud.langfuse.com`. Override only when self-hosting. |
| `LANGFUSE_ENVIRONMENT` | no       | Defaults to `process.env.NODE_ENV`. Used as Langfuse `environment` tag.    |
| `TRANSLATION_PROVIDER` | no       | Defaults to `anthropic`. Set to `mock` in tests.                           |

## Module Layout

```text
apps/admin/src/
├── services/
│   ├── observability/
│   │   ├── langfuse.ts                  # Singleton client, env validation, flush hook
│   │   └── __tests__/
│   └── translation/
│       ├── adapters/
│       │   ├── anthropic.ts             # New. Wraps Anthropic SDK with Langfuse spans.
│       │   ├── mock.ts                  # Existing.
│       │   ├── openai.ts                # Existing.
│       │   └── ...                      # deepl, google, baidu (existing)
│       ├── factory.ts                   # Updated to register `anthropic`.
│       ├── types.ts                     # Updated: TranslationProvider gains `"anthropic"`.
│       ├── universal.ts                 # Existing entry orchestrator. Unchanged.
│       └── prompts/
│           └── translate.field.md       # Source of truth for the seed prompt body.
├── app/api/translate/
│   └── route.ts                         # POST endpoint, admin auth required.
├── components/
│   └── TranslateButton/
│       ├── index.tsx                    # Custom Payload field component.
│       └── server.ts                    # Optional server action wrapper.
└── scripts/
    └── seed-langfuse-prompts.ts         # One-off: pushes prompts/translate.field.md to Langfuse.
```

## Langfuse Client Singleton

`services/observability/langfuse.ts` exports a memoized `Langfuse` instance configured from env. Flushed on Next.js graceful shutdown via `instrumentation.ts`. Failures inside the SDK never throw out of user code: every call site wraps Langfuse calls in a `try/catch` that logs and proceeds. The translation must succeed even if Langfuse is unreachable.

```ts
// pseudocode
export const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  baseUrl: process.env.LANGFUSE_BASEURL ?? "https://cloud.langfuse.com",
  environment: process.env.LANGFUSE_ENVIRONMENT ?? process.env.NODE_ENV,
})
```

## Trace Structure

One trace per editor click. Each translated field becomes a `generation` under the same trace, so total cost and latency for "translating one Post" is visible at the trace level.

```text
trace: translate.document
  name:     translate.document
  metadata: { collection, docId, postSlug, fromLocale, toLocale, promptVersion, modelId }
  tags:     [collection:posts, locale:zh-CN, prompt:translate.field@v3]
  ├── generation: translate.field
  │     name: translate.field
  │     metadata: { fieldPath: "title", inputCharCount, outputCharCount }
  │     model: claude-haiku-4-5
  │     input / output: full text (truncated if > 8 KB)
  ├── generation: translate.field   (excerpt)
  └── generation: translate.field   (content — Lexical serialized to Markdown for prompting)
```

Conventions:

- Trace `name` is namespaced (`translate.<thing>`). Filterable in the Langfuse dashboard.
- Long bodies (`content`) are truncated to 8 KB in the trace payload to keep the UI responsive. Full input/output remain in Payload.
- `promptVersion` is read from the Langfuse prompt response and pinned into trace metadata at the moment of translation, so a later prompt change does not retroactively rewrite history.

## Prompt Management

The translation prompt lives in Langfuse, not in the source tree. The repo holds an initial seed under `services/translation/prompts/translate.field.md` purely as documentation and disaster-recovery; runtime always reads from Langfuse.

| Concern            | Choice                                                                                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prompt name        | `translate.field`                                                                                                                                               |
| Variables          | `{{fromLocaleName}}`, `{{toLocaleName}}`, `{{fieldKind}}`, `{{sourceText}}`                                                                                     |
| Caching            | Local TTL 60s via `langfuse.getPrompt(name, { cacheTtlSeconds: 60 })`                                                                                           |
| Fallback on outage | If Langfuse fetch fails _and_ there is no cached version, the adapter falls back to the in-repo seed file. The trace records `promptVersion = "fallback:seed"`. |
| Versioning         | Editor publishes a new version in Langfuse UI; consumer picks it up after TTL expires.                                                                          |

Field-kind variants are encoded in a single prompt with a `fieldKind` switch (`title` / `excerpt` / `richText`), not as separate prompts. This keeps version history coherent.

## Endpoint: `POST /api/translate`

Admin-authenticated. Lives in `apps/admin/src/app/api/translate/route.ts`.

Request body (Zod-validated):

```ts
{
  collection: "posts" | "pages" | "tags" | "series",
  docId: string,
  fromLocale: SupportedLocale,
  toLocale: SupportedLocale,
  fields: string[],   // dotted paths, e.g. ["title", "excerpt", "content"]
}
```

Response:

```ts
{
  ok: true,
  promptVersion: string,
  costUsd: number,
  perField: Array<{ field: string; charsIn: number; charsOut: number; ms: number }>,
}
```

Behavior:

1. Verify Payload session (admin user). Reject with 401 otherwise.
2. Reject if `fromLocale === toLocale` or either locale is not in `SUPPORTED_LOCALES`.
3. Reject if `collection` is not in the allowlist (above).
4. Read the source doc at `fromLocale` via Payload Local API (`overrideAccess: false`, `depth: 0`).
5. For each requested field, call the translation adapter. All field translations share one Langfuse trace.
6. Update the doc at `toLocale` with `_status: "draft"`. Never auto-publish.
7. Return cost / latency summary so the admin UI can display it.

Errors:

- `400` invalid input
- `401` unauthenticated
- `403` doc access denied
- `429` provider rate-limited (surfaced from Anthropic)
- `502` Langfuse prompt fetch failed AND seed fallback also failed (effectively never)
- `500` provider hard error

## Admin UI: TranslateButton

A custom Payload field component, mounted near the locale tab header on each localized collection. The component is stateless: it reads `useDocumentInfo()` for `id` and the active locale, then issues a fetch.

UX:

- Button label: `Translate from en` (or `Translate from <currentSourceLocale>`).
- Disabled while the document is dirty (forces save first, so the source matches what the API will read).
- On success: shows a toast with cost (`$0.0008`) and a hint to switch to the locale tab and review.
- On failure: toast with error code; retries are user-driven, never automatic.

The button is added per-collection by editing the field-component import map in each collection definition. No global Payload config change.

## Caching, Idempotency, Retries

- The endpoint is **not** idempotent. Calling it twice will overwrite the existing draft for the target locale. This is acceptable because writes go to draft, not published.
- The adapter does not retry on Anthropic 5xx automatically (one click = one call). Retries are surfaced to the editor.
- Anthropic rate limits at the project level. With single-editor blog usage this is not a bottleneck.

## Cost Discipline

- Default model: `claude-haiku-4-5`.
- A hard upstream guard rejects translation if `sourceText.length > 60_000` characters per field. Larger documents must be split by the editor.
- `costUsd` is computed from the Anthropic response usage and reported back to the admin UI for transparency.
- Langfuse model pricing must include `claude-haiku-4-5` and `claude-sonnet-4-6`. If absent, configure via Langfuse Settings → Models. Otherwise the dashboard reports `$0`.

## Self-Hosting Migration Path

Documented for completeness; not in scope right now.

1. Stand up self-hosted Langfuse (ClickHouse + Postgres + Redis + S3-compatible object store).
2. Export prompts and datasets from Cloud via Langfuse Public API (one-time script).
3. Re-create them on self-hosted via the same API.
4. Switch `LANGFUSE_BASEURL` to the self-hosted URL and re-issue keys.
5. Historical traces are intentionally not migrated.

The application code does not change.

## Trade-Offs

- **LLM over dedicated MT API**: better Markdown / Lexical preservation and cheaper at blog volume; cost is occasional verbosity or stylistic drift, mitigated by editor review.
- **Manual trigger only**: editors do not get free background translation, but every call is intentional and reviewable, and cost is bounded.
- **Prompt in Langfuse, not in repo**: faster iteration without redeploys; cost is one extra runtime dependency in the translation hot path (mitigated by 60s local cache + seed fallback).
- **Single Langfuse project, environment-tagged**: simplest setup; if dev traffic ever drowns prod signal, splitting into two projects is one config change.
- **Anthropic-only first**: keeps the surface small; existing OpenAI / DeepL adapters remain available but unused. Multi-provider routing can be added back via `getOptimalTranslationService` when there is real evidence one model handles a language pair better.

## File Map

| File                                                             | Responsibility                                                  |
| ---------------------------------------------------------------- | --------------------------------------------------------------- |
| `apps/admin/src/services/observability/langfuse.ts`              | Langfuse client singleton, env validation, graceful shutdown.   |
| `apps/admin/src/services/translation/adapters/anthropic.ts`      | Anthropic adapter, instrumented with Langfuse trace/generation. |
| `apps/admin/src/services/translation/factory.ts`                 | Registers `anthropic` provider.                                 |
| `apps/admin/src/services/translation/types.ts`                   | Adds `"anthropic"` to `TranslationProvider`.                    |
| `apps/admin/src/services/translation/prompts/translate.field.md` | Seed prompt body (fallback only).                               |
| `apps/admin/src/app/api/translate/route.ts`                      | Editor-facing endpoint.                                         |
| `apps/admin/src/components/TranslateButton/`                     | Custom Payload admin field component.                           |
| `apps/admin/src/scripts/seed-langfuse-prompts.ts`                | One-off Langfuse prompt seeding.                                |
| `apps/admin/.env.example`                                        | Documents new required env vars.                                |

## Verification Checklist

- [ ] `pnpm --filter admin check-types` passes after adapter and route additions.
- [ ] `pnpm --filter admin test` passes; Anthropic adapter is unit-tested with the SDK mocked.
- [ ] Seed script run once per environment; `translate.field` prompt appears in Langfuse UI.
- [ ] Endpoint smoke test: translate a sample Post from `en` to `zh-CN`, draft is updated, published version untouched.
- [ ] Langfuse dashboard: trace appears with three generations (title / excerpt / content), cost > 0, prompt version pinned.
- [ ] Editor flow: button disabled while doc is dirty; toast surfaces cost on success.
- [ ] Outage simulation: with `LANGFUSE_PUBLIC_KEY` invalid, translation still completes using the seed prompt; no 500 surfaced to user.
- [ ] Out-of-budget guard: a 100K-char field returns 400 without calling Anthropic.

## Future Work

- LLM-as-judge eval pipeline against a curated dataset of human-approved translations.
- Per-language style guide / glossary surfaced as additional prompt variables.
- Diff view in the admin UI showing previous translation vs newly generated, with field-level accept / reject.
- Optional Sonnet upgrade for long-form `content` translations when Haiku quality is insufficient on a given language pair.

## Promotion

When the proposal is implemented and stable, move this file to `docs/llm-translation-architecture.md`, drop the `Status: Proposal` line, and link it from the document index in `AGENTS.md` / `CLAUDE.md`.
