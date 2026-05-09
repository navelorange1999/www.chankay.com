# Claude AI Code Generation Guidelines

This file is now a compatibility pointer.

Start with [`AGENTS.md`](./AGENTS.md), then load the topic documents in `docs/` that match the task:

- [`docs/project-overview.md`](./docs/project-overview.md)
- [`docs/architecture-and-stack.md`](./docs/architecture-and-stack.md)
- [`docs/cms-driven-design.md`](./docs/cms-driven-design.md)
- [`docs/code-style-and-typescript.md`](./docs/code-style-and-typescript.md)
- [`docs/component-guidelines.md`](./docs/component-guidelines.md)
- [`docs/frontend-guidelines.md`](./docs/frontend-guidelines.md)
- [`docs/payload-cms-patterns.md`](./docs/payload-cms-patterns.md)
- [`docs/testing-and-operations.md`](./docs/testing-and-operations.md)
- [`docs/deployment-and-environments.md`](./docs/deployment-and-environments.md)

Work-in-progress designs live under `docs/proposals/`:

- [`docs/proposals/multilingual-architecture.md`](./docs/proposals/multilingual-architecture.md)
- [`docs/proposals/multilingual-rollout-runbook.md`](./docs/proposals/multilingual-rollout-runbook.md)
- [`docs/proposals/llm-translation-architecture.md`](./docs/proposals/llm-translation-architecture.md)

Core rules remain the same:

- Write technical content in English
- Prefer CMS-driven design
- Create stateless reusable UI in `packages/ui` first
- Do not create summary handoff documents

Update the relevant topic file in `docs/` instead of expanding this file again.
