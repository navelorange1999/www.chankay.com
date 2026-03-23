# Architecture and Stack

> Last Updated: March 23, 2026

## Monorepo Structure

```text
www.chankay.com/
├── apps/
│   ├── www/          # Public website (Next.js)
│   ├── admin/        # CMS admin panel (Next.js + Payload)
│   └── storybook/    # Component documentation
├── packages/
│   ├── brand-assets/        # Shared favicon and logo source assets
│   ├── site-shell/          # Static Web Component shell for demo subdomains
│   ├── ui/                  # Shared UI component library
│   ├── typescript-config/   # Shared TypeScript configuration and generated types
│   ├── eslint-config/       # Shared ESLint configuration
│   └── tailwind-config/     # Shared Tailwind configuration
```

## Package Manager

- Use `pnpm`
- Internal package dependencies should use `workspace:*`
- Run workspace-wide install commands from the repository root

## Build System

- Tool: TurboRepo
- Root task orchestration lives in `turbo.json`
- App-specific scripts live in each app's `package.json`

Common commands:

- `pnpm dev`: Start all apps in development mode
- `pnpm dev:www`: Start only the public site
- `pnpm dev:admin`: Start only the admin app
- `pnpm dev:ui`: Start Storybook and UI watch tasks
- `pnpm dev:site-shell`: Start the `site-shell` local preview in watch mode
- `pnpm build`: Build all apps
- `pnpm lint`: Lint the workspace
- `pnpm check-types`: Run TypeScript checks
- `pnpm test`: Run tests across the workspace

## Core Technologies

| Technology            | Purpose               |
| --------------------- | --------------------- |
| React 19              | UI library            |
| Next.js 15 App Router | Application framework |
| TypeScript 5          | Type safety           |
| Payload CMS 3         | Headless CMS          |
| MongoDB via Mongoose  | Data layer            |
| Tailwind CSS 4        | Styling               |

## UI and Frontend Libraries

- Radix UI for accessible primitives
- Motion for animations
- Lucide React for icons
- `next-themes` for theme management

## Development Tooling

- TurboRepo for monorepo task orchestration
- ESLint for linting
- Prettier for formatting
- Vitest for testing
- Commitizen for conventional commits

## Important Repository Areas

- `apps/admin/src/collections/`: Payload collections
- `apps/admin/src/globals/`: Payload globals
- `apps/admin/src/blocks/`: Payload block definitions
- `apps/www/src/app/`: App Router routes
- `apps/www/src/services/payload/`: Frontend Payload data access
- `packages/ui/src/components/`: Shared UI components
- `packages/site-shell/src/`: Static demo shell package sources
- `packages/typescript-config/typings/payload-types.ts`: Generated Payload types

## Architecture Notes

- `apps/admin` is the canonical source for CMS schema and admin behavior.
- `apps/www` consumes CMS data through service helpers and Payload API access.
- `packages/ui` contains presentation-focused components with minimal business logic.
- `packages/brand-assets` is the source of truth for shared favicon and logo files.
- `packages/site-shell` contains a static, framework-agnostic Web Component shell for demo sites.
- Shared configuration packages should remain generic and app-agnostic.
