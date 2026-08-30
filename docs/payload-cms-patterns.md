# Payload CMS Patterns

> Last Updated: March 12, 2026

## Where Payload Lives

The canonical Payload setup is in `apps/admin`.

Important locations:

- `apps/admin/src/payload.config.ts`
- `apps/admin/src/collections/`
- `apps/admin/src/globals/`
- `apps/admin/src/blocks/`
- `packages/typescript-config/typings/payload-types.ts`

## Collection Structure

Use this pattern as the baseline:

```typescript
import type { CollectionConfig } from "payload"

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    useAsTitle: "title",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "content",
      type: "richText",
    },
  ],
  timestamps: true,
}
```

## Global Structure

Use this pattern for site-level configuration:

```typescript
import type { GlobalConfig } from "payload"

export const SiteConfig: GlobalConfig = {
  slug: "site-config",
  typescript: {
    interface: "SiteConfig",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "siteName",
      type: "text",
      required: true,
    },
  ],
}
```

## Modeling Rules

1. Use collections for repeatable content such as posts, pages, and taxonomies.
2. Use globals for singleton configuration such as site-wide settings.
3. Keep access control explicit.
4. Add `admin.description` or field descriptions when the editorial intent is not obvious.
5. Add validation for constrained fields.
6. Prefer generated Payload types instead of ad hoc hand-written mirrors.

## Relationship to the Frontend

- `apps/admin` defines the schema and editorial behavior.
- `apps/www` consumes content through Payload API access and service wrappers.
- Shared UI components should not depend directly on Payload APIs.

## Localized Field Placement

- Add `localized: true` to editor-controlled, user-facing leaf fields.
- Keep arrays, blocks containers, relationships, URLs, and layout fields shared unless the entire structure must differ by locale.
- For nested blocks or arrays, localize fields such as `label`, `title`, `description`, and `content` rather than their parent container.
- When an existing field becomes localized, ship an idempotent data migration in the same release to wrap the stored value under the default locale.
- Keep fixed application-interface text in the typed `@repo/i18n` catalog instead of adding CMS fields that editors should not control.

## When Adding New Payload Features

Check these areas in order:

1. Collection or global definition
2. Access rules
3. Hooks and side effects
4. Generated types
5. Frontend rendering or data service updates
