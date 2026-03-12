# Project Overview

> Project: www.chankay.com
> Last Updated: March 12, 2026

This repository contains a personal website and technical blog built in a monorepo architecture.

## Applications

- `apps/www`: Public-facing Next.js website
- `apps/admin`: Payload CMS admin panel
- `apps/storybook`: Component documentation and visual testing environment

## Key Goals

- Fast, modern, and accessible user experience
- Type-safe development with TypeScript
- Reusable component library shared across apps
- CMS-driven design through Payload CMS
- Theme support for light and dark modes
- Responsive design across device sizes

## Design Philosophy

### English-Only Communication

All technical content must be written in English:

- Code comments
- Documentation files
- Commit messages
- Function and variable names
- Type definitions and interfaces
- Error messages and logs
- API documentation

Do not add Chinese or other non-English text to technical artifacts.

### CMS-First Design Principle

All components should be designed with Payload CMS configurability in mind:

1. Content should be CMS-managed.
2. Styling options should be CMS-configurable.
3. Component variants should map to CMS fields.
4. Avoid hardcoded content.

This allows non-technical users to update the site without editing code.

### UI Component Structure Principle

Create stateless UI components in `packages/ui` first:

1. Stateless components belong in `packages/ui`.
2. Stateful and app-specific components belong in `apps/*`.
3. Build bottom-up from reusable UI primitives.
4. Maximize reuse across `www`, `admin`, and `storybook`.

Example workflow:

```text
Step 1: Create Button in packages/ui
Step 2: Create Card in packages/ui
Step 3: Create HeroSection in apps/www that uses Button and Card
Step 4: HeroSection fetches data from CMS and passes props into UI components
```

### No Summary Documents

Do not create summary or handoff documents after completing tasks:

- No `*_SUMMARY.md`
- No `*_IMPLEMENTATION.md`
- No `COMPLETED.md`

Instead:

- Update the relevant document in `docs/`
- Update `README.md` when user-facing setup changes
- Add inline code comments only for non-obvious logic

## Working Expectation

When implementing changes:

1. Read the relevant topic document from `docs/`.
2. Check the existing code for local patterns.
3. Follow the established conventions before inventing new ones.
4. Update the right document if a new convention becomes standard.
