# Agent Entry Guide

This file is the entry point for LLMs working in this repository. Read it first, then load only the documents that match the task.

## How To Use This Index

1. Start here for project-wide rules and document routing.
2. Read only the relevant files in `docs/` for the current task.
3. Prefer the source code when documentation and code disagree.
4. Update the relevant document in place when project conventions change.
5. Do not create summary handoff documents such as `*_SUMMARY.md` or `*_IMPLEMENTATION.md`.

## Core Project Rules

### Environment File Safety

Never read real environment files under any circumstance.

Allowed:

- `.env.example`
- `*.env.example`

Forbidden:

- `.env`
- `.env.local`
- `.env.production`
- `.env.staging`
- any other `.env.*` file that is not an example template

If environment configuration is needed, read the relevant `.env.example` file only.

### English-Only Technical Content

All technical content must be written in English:

- Code comments
- Documentation
- Commit messages
- Function and variable names
- Type definitions
- Error messages and logs

### CMS-First Design

All user-facing content and configurable styling should be modeled through Payload CMS whenever practical. Avoid hardcoded content in page components.

### UI Packaging Rule

Create stateless and reusable UI components in `packages/ui` first. Keep app-specific data fetching and business logic in `apps/www` or `apps/admin`.

### Documentation Rule

When a new pattern becomes part of the project standard, update the appropriate file in `docs/` and this index if discoverability changes.

## Document Routing

### Repo Overview, Goals, and Working Principles

Read:

- [`README.md`](./README.md)
- [`docs/project-overview.md`](./docs/project-overview.md)

Use when:

- You need a high-level understanding of the product
- You need the main project goals or core principles
- You need the list of applications in the monorepo

### Architecture, Monorepo Layout, and Tooling

Read:

- [`docs/architecture-and-stack.md`](./docs/architecture-and-stack.md)
- [`package.json`](./package.json)
- [`pnpm-workspace.yaml`](./pnpm-workspace.yaml)
- [`turbo.json`](./turbo.json)

Use when:

- You need to understand the monorepo structure
- You need to know how builds, workspaces, and shared packages are organized
- You need command or tooling context

### CMS-Driven Design and Content Modeling

Read:

- [`docs/cms-driven-design.md`](./docs/cms-driven-design.md)
- [`docs/payload-cms-patterns.md`](./docs/payload-cms-patterns.md)
- [`apps/admin/src/payload.config.ts`](./apps/admin/src/payload.config.ts)
- `apps/admin/src/collections/*`
- `apps/admin/src/globals/*`
- `apps/admin/src/blocks/*`

Use when:

- You are designing fields, blocks, or page-builder structures
- You are adding configurable content or styling to the frontend
- You need collection or global conventions

### Component Placement and Reuse

Read:

- [`docs/component-guidelines.md`](./docs/component-guidelines.md)
- `packages/ui/src/components/*`
- `apps/www/src/components/*`
- `apps/admin/src/components/*`

Use when:

- You need to decide whether a component belongs in `packages/ui` or an app
- You are creating reusable UI primitives
- You are implementing app-specific composition components

### Code Style, TypeScript, and Imports

Read:

- [`docs/code-style-and-typescript.md`](./docs/code-style-and-typescript.md)
- [`.prettierrc`](./.prettierrc)
- [`tsconfig.json`](./tsconfig.json)
- `packages/typescript-config/*`

Use when:

- You need naming, formatting, import-order, or typing rules
- You are working with generated Payload types
- You are reviewing code style consistency

### Frontend Styling, Data Fetching, and Performance

Read:

- [`docs/frontend-guidelines.md`](./docs/frontend-guidelines.md)
- [`apps/www/ARCHITECTURE.md`](./apps/www/ARCHITECTURE.md)
- `apps/www/src/services/payload/*`
- `packages/tailwind-config/*`

Use when:

- You are implementing UI styling
- You need server vs client component guidance
- You are working on Payload-backed frontend data fetching
- You need performance or common Next.js patterns

### Testing, Commands, and Delivery Workflow

Read:

- [`docs/testing-and-operations.md`](./docs/testing-and-operations.md)
- `.github/workflows/*`
- app-level `package.json` files

Use when:

- You need test commands or workflow expectations
- You are preparing commits or validating delivery steps
- You need deployment-related command context

### Multilingual Content and URL Structure

Read:

- [`docs/proposals/multilingual-architecture.md`](./docs/proposals/multilingual-architecture.md)
- [`docs/proposals/multilingual-rollout-runbook.md`](./docs/proposals/multilingual-rollout-runbook.md)
- [`packages/i18n/src/*`](./packages/i18n/src)
- [`apps/admin/src/config/locales.ts`](./apps/admin/src/config/locales.ts)
- [`apps/admin/src/payload.config.ts`](./apps/admin/src/payload.config.ts)

Use when:

- You are adding or removing a supported locale
- You are adding `localized: true` fields to a collection or global
- You are touching routing under `apps/www/src/app/[locale]/`
- You need to emit `hreflang`, canonical, or sitemap alternates
- You need to add the locale parameter to a Payload query
- You are running or revising the data normalization migration (see runbook)

### Deployment, Environments, and Vercel

Read:

- [`docs/deployment-and-environments.md`](./docs/deployment-and-environments.md)
- [`vercel.json`](./vercel.json)
- `.github/workflows/*`
- [`apps/admin/.env.example`](./apps/admin/.env.example)
- [`apps/www/.env.example`](./apps/www/.env.example)

Use when:

- You need the current deployment model
- You need to understand preview vs production behavior
- You need environment variable boundaries between apps
- You need to change Vercel-related configuration
- Read only `.env.example` templates and never inspect real `.env.*` files

## Canonical Source Priority

When multiple sources overlap, use this priority order:

1. Source code and configuration files
2. `AGENTS.md`
3. Topic documents in `docs/`
4. `README.md`
5. `CLAUDE.md` compatibility note

## Document Map

- [`docs/project-overview.md`](./docs/project-overview.md): Product context, goals, and non-negotiable principles.
- [`docs/architecture-and-stack.md`](./docs/architecture-and-stack.md): Monorepo layout, package manager, build system, and technology stack.
- [`docs/cms-driven-design.md`](./docs/cms-driven-design.md): CMS-first UI design patterns, examples, and field modeling guidance.
- [`docs/code-style-and-typescript.md`](./docs/code-style-and-typescript.md): Formatting, naming, imports, and TypeScript rules.
- [`docs/component-guidelines.md`](./docs/component-guidelines.md): Component placement, structure, props, and server/client boundaries.
- [`docs/frontend-guidelines.md`](./docs/frontend-guidelines.md): Styling, data fetching, environment variables, performance, and common UI patterns.
- [`docs/payload-cms-patterns.md`](./docs/payload-cms-patterns.md): Payload collection and global conventions.
- [`docs/testing-and-operations.md`](./docs/testing-and-operations.md): Testing guidance, commit workflow, quick commands, and important file locations.
- [`docs/deployment-and-environments.md`](./docs/deployment-and-environments.md): Current Vercel deployment model, environments, shared secrets, and runtime constraints.

### Proposals (work-in-progress designs)

The `docs/proposals/` folder holds design documents for features that are not yet stable. They are normative for the work in flight but should be promoted (moved into `docs/`) once the implementation is shipped and verified.

- [`docs/proposals/multilingual-architecture.md`](./docs/proposals/multilingual-architecture.md): Locale set, URL strategy, Payload localization, routing, middleware, and SEO.
- [`docs/proposals/multilingual-rollout-runbook.md`](./docs/proposals/multilingual-rollout-runbook.md): Operational checklist for migrating clusters, smoke tests, deferred code follow-ups, and rollback.
- [`docs/proposals/llm-translation-architecture.md`](./docs/proposals/llm-translation-architecture.md): Editor-triggered LLM translation with Anthropic + Langfuse Cloud.

## Maintenance Notes

- Keep documents focused by topic. Do not grow a new monolith.
- If a rule applies project-wide, add it here and in the relevant topic document.
- If a rule applies only to one subsystem, document it in that subsystem's topic file.
