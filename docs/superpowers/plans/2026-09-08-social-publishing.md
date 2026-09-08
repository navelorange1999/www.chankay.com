# Social Publishing Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task by task.

**Goal:** Implement the approved manual social publishing architecture with immutable localized snapshots, WeChat drafts, separately confirmed publication, and durable audit state.

**Architecture:** Payload collections hold account configuration and server-owned publications. Admin and native Payload MCP commands share one service; a conditional database claim protects queued remote work. A versioned WeChat adapter owns rendering and provider protocol details.

**Tech Stack:** Payload 3.88, MongoDB, TypeScript, Zod, marked, htmlparser2, Vercel Queue, Vitest.

## Approved scope

The normative design is `docs/proposals/social-publishing-architecture.md`. Implement phases 1–3 and document phase 4's operational gates. Do not publish to a live account, grant MCP permissions, configure production secrets, or read real environment files. Use the existing `feat/social-publishing` worktree.

## Task 1: Adapter contracts, rendering, and provider operations

Files: `apps/admin/src/services/socialPublishing/types.ts`, `adapters/wechat/*`, `adapters/registry.ts`, `credentials.ts`, and colocated `__tests__`.

- [x] Write failing tests for safe Markdown, explicit Media references, unsupported HTML/tables, identity mismatch, malformed provider responses, ambiguous mutation failures, and read-only status reconciliation.
- [x] Define versioned source/prepared payload contracts and implement pure rendering using existing parsers.
- [x] Implement an allowlisted credential reference, bounded HTTP calls, stable-token caching, uploads, remote drafts, publication submission, and status lookup. Never return raw provider errors.
- [x] Run focused Vitest tests with local mocked HTTP only.

## Task 2: Collections and shared command service

Files: `apps/admin/src/collections/SocialAccounts.ts`, `SocialPublications.ts`, `services/socialPublishing/{access,snapshot,state,validation,index}.ts`.

- [x] Test explicit locale reads, role denial, stable snapshot hashing, retry eligibility, idempotent prepare, stale source rejection, and conditional state transitions before implementing them.
- [x] Add account policy fields and immutable destination identity; deny ordinary publication mutations with a server-only context capability.
- [x] Implement authorized preparation and hash-bound draft/publish commands, bounded attempts, atomic approval, and safe compact results.
- [x] Use database conditional updates for command transitions and worker claims; preserve `req`, effective user, and `overrideAccess: false` for user operations.

## Task 3: Queue execution

Files: `services/socialPublishing/{dispatcher,processor}.ts`, `app/api/queue/social-publications/route.ts`, `apps/admin/vercel.json`.

- [x] Test duplicate deliveries, known remote identifiers, disabled accounts, snapshot corruption, credential identity checks, pending status backoff, and dispatch failures.
- [x] Persist remote outcomes before state advancement. Stop ambiguous mutations in `unknown`; never automatically repeat a mutation after uncertain completion.
- [x] Add bounded delayed status checks and serialized local execution using identifier-only messages.

## Task 4: MCP and Admin entry points

Files: `plugins/mcp/social-publication/index.ts`, `services/socialPublishing/endpoints.ts`, `components/socialPublishing/*`, collection/plugin registration, generated Payload types/import map.

- [x] Test strict input parsing, common service calls, tool registration, find-only native collection permissions, and sanitized failures.
- [x] Add Post preparation with account selection and active locale; add snapshot preview, staleness, remote state, draft action, and explicit publication confirmation.
- [x] Regenerate types and import map through Payload APIs directly, bypassing the CLI environment loader; run Next build in an isolated staging directory without environment files.

## Task 5: Verification and operational documentation

- [x] Run `pnpm --filter admin test:run`, `pnpm --filter admin check-types`, `pnpm --filter admin build`, formatting validation, and `git diff --check` without accessing real environment files.
- [x] Review against the acceptance criteria, then review correctness and security; fix material findings.
- [x] Update deployment and Payload conventions in place. Record required WeChat account verification, sandbox acceptance, production credential setup, and explicit MCP permission enablement as pending operator gates.

## Task 6: Published article assets for the authorized WeChat draft trial

- [x] Add publication-only cover and exact Mermaid-definition Media mappings, replayed during staleness checks.
- [x] Test safe tables, missing/unused diagrams, and changed source/assets before remote writes.
- [x] Add browser PNG export using the existing Mermaid dependency, authenticated Media uploads, and cover selection.
- [x] Run tests, TypeScript, isolated build, and browser visual checks.
- [ ] Synchronize the selected Trading article as a remote draft only.

## Verification environment

Use installed Node 24.16.0 because the shell's Node 22.9.0 is below pnpm's minimum. No dependency additions are expected. Automated provider tests use injected HTTP and credentials; no live remote writes are authorized by this implementation task.

## Verification results

At the initial implementation checkpoint, phases 1–3 were complete. Live-account operations and deployment were deferred to the subsequent authorized draft trial.

Admin tests and TypeScript checks pass. The Admin production build passes in an environment-free staged source tree using the already installed dependencies. The existing MCP dependency emits an optional `source-map-support` resolution warning, and Vercel Queue reports its local default region. No application lint warnings remain.

Changed-file formatting and `git diff --check` pass. Full-repository formatting reports ten unchanged baseline files (authentication, one migration, LoginForm, older design/plan files, and workspace YAML); they are outside this feature.

The pnpm wrapper attempted dependency reconciliation against shared worktree links, so verification invokes the installed Vitest, TypeScript, Next, and Prettier binaries directly with Node 24.16.0. No dependencies or lockfile were changed.

Task 6 verification: 231 Admin tests pass when run from `apps/admin`; Admin and UI TypeScript pass; isolated Next build passes with the same existing dependency warnings. Browser visual checks pass for all four actual article diagrams (approximately 76–235 KB each). The article renders to 12,157 bytes of HTML with four images and one table. Preview deployment of `e526151` is Ready at `https://adminchankay-ioabaic5m-navelorange1999s-projects.vercel.app`. Only this redeployment disabled the project Ignore Build Step. The uploaded cover returned HTTP 200. The operator logged in and prepared publication `6a9ff90353c52fef3f97e4af`. Live draft synchronization reached the worker and failed at the token stage with `40164`, a definitive IP allowlist rejection. No WeChat media or draft mutation occurred. The next step requires selecting fixed outbound connectivity, configuring the matching allowlist, and supporting an explicit safe retry after configuration recovery.
