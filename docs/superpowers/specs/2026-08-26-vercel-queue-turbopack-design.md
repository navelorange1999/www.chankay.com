# Vercel Queue Turbopack Compatibility Design

## Context

After upgrading the admin application to Payload 3.88.0, its Next.js dependency is pinned to 15.4.11. The admin development server continues to use Turbopack. When Turbopack bundles `@vercel/queue@0.1.4`, it analyzes the package's development-only `import(absolutePath)` call and rewrites the absolute route path as `./ROOT/apps/admin`. The resulting unresolved module causes `/admin` to return HTTP 500 in local development.

The production build uses Webpack and completes with only a dynamic-dependency warning, so the failure is specific to the local Turbopack bundling path.

## Decision

Add `@vercel/queue` to `serverExternalPackages` in `apps/admin/next.config.js`.

This keeps Turbopack enabled while instructing Next.js to load the Node-oriented Queue SDK at runtime instead of bundling and statically analyzing its internal dynamic import. No queue route, dispatch behavior, Payload configuration, or MCP behavior changes.

## Alternatives Considered

1. Conditionally import `@vercel/queue` inside the dispatcher and callback route. This spreads compatibility logic across application code and may still be statically analyzed by Turbopack.
2. Change the Next.js or Payload version again. This broadens the dependency upgrade and conflicts with the requirement to stay on Payload 3.88.0.
3. Disable Turbopack. This avoids the failure but violates the local-development requirement.

## Testing

1. Add a focused regression test that imports the effective admin Next.js configuration and asserts that `@vercel/queue` is listed in `serverExternalPackages`.
2. Run the focused test first and confirm that it fails before the configuration change.
3. Add the configuration entry and confirm that the focused test passes.
4. Run the admin test suite, typecheck, and production build.
5. Restart the local admin development server with Turbopack and verify that `http://localhost:3001/admin` no longer fails with the `./ROOT/apps/admin` module-resolution error.

## Scope

The change is limited to the admin Next.js configuration, its regression test, and this design documentation. Queue execution semantics and deployment configuration remain unchanged.
