# RFC: Writable MCP App for `www.chankay.com`

Status: Draft
Last Updated: March 13, 2026
Owner: `apps/mcp`

## Summary

This RFC proposes a new `apps/mcp` application that exposes a private, writable Model Context Protocol (MCP) server for operating the website content model.

The MCP app will support both local `stdio` usage and remote HTTP usage. Its primary purpose is to let AI clients create and update `posts` and `pages` safely without bypassing the existing CMS architecture.

The core design decision is:

- `apps/mcp` owns MCP transport, validation, authorization, tool schemas, and auditability.
- `apps/admin` remains the canonical write authority for CMS mutations.
- `apps/www` remains the presentation layer and revalidation target.

## Context

The current repository already has strong architecture boundaries:

- `apps/admin` is the canonical source for Payload collections, globals, hooks, and admin behavior.
- `apps/www` consumes content through service-layer HTTP access to the Payload API.
- `apps/admin` already has a background processing model for page-generated assets.

Important existing constraints:

- `posts` are writable only for authenticated users.
- `pages` trigger post-save generated asset workflows.
- `pages.structure` is a nested block tree, not a simple document body.
- `posts.content` uses Payload Lexical rich text, which is not a good direct authoring format for MCP tools.

These constraints make a direct "MCP writes to generic Payload REST endpoints" approach too broad for long-term maintenance.

## Problem Statement

The project needs an MCP server that can eventually do more than read public content.

Desired long-term capabilities include:

- create a post draft
- update post metadata
- replace post content
- publish or archive a post
- create a page draft
- replace page structure
- update page SEO
- publish a page

The solution must:

- fit the existing monorepo architecture
- preserve current Payload hooks and side effects
- avoid introducing unnecessary platform cost
- provide a safe path toward remote writable MCP access

## Goals

- Add a dedicated `apps/mcp` application to the monorepo.
- Support local `stdio` transport for development and direct personal use.
- Support remote HTTP transport for private MCP clients.
- Keep write authority inside `apps/admin`.
- Expose task-oriented tools instead of raw CMS mutation access.
- Make tool inputs friendlier than raw Payload internals.
- Preserve existing hooks, drafts, translations, generated assets, and revalidation behavior.
- Support future OAuth-based authorization, even if the first version starts with a private bearer secret.

## Non-Goals

- Expose a public writable MCP endpoint.
- Let MCP write directly to MongoDB.
- Let MCP call generic Payload REST write endpoints with unrestricted payload shapes.
- Build a fully generic page block patch engine in the first version.
- Replace the existing admin UI workflow.

## Decision

The recommended long-term design is:

1. Create `apps/mcp` as a separate app in the monorepo.
2. Deploy `apps/mcp` as its own Vercel project.
3. Let `apps/mcp` expose MCP tools only.
4. Route all content mutations through narrow internal endpoints or action handlers in `apps/admin`.
5. Let `apps/admin` call Payload local APIs and trigger any required revalidation or background jobs.

This keeps the system aligned with the existing project boundaries instead of creating a second hidden CMS runtime.

## Why `apps/mcp` Should Not Write Directly to Payload

Direct writes from MCP to generic Payload APIs would create several long-term problems:

- The permission surface would be too broad.
- Tool schemas would leak CMS internals directly into AI workflows.
- Page updates would be harder to validate because `pages.structure` is a block tree.
- Post authoring would be awkward because `posts.content` is Lexical rich text rather than Markdown.
- Business rules would become fragmented between `apps/mcp` and `apps/admin`.

The safer pattern is:

- `apps/mcp` expresses intent
- `apps/admin` owns content mutation logic
- Payload hooks and side effects stay in one place

## Proposed Repository Layout

```text
apps/mcp/
├── RFC.md
├── package.json
├── tsconfig.json
├── src/
│   ├── config/
│   │   └── env.ts
│   ├── server/
│   │   ├── createServer.ts
│   │   └── registry.ts
│   ├── transports/
│   │   ├── stdio.ts
│   │   └── http.ts
│   ├── auth/
│   │   ├── scopes.ts
│   │   ├── bearer.ts
│   │   └── oauth.ts
│   ├── tools/
│   │   ├── posts/
│   │   ├── pages/
│   │   └── site/
│   ├── resources/
│   │   ├── posts.ts
│   │   ├── pages.ts
│   │   └── site-config.ts
│   ├── services/
│   │   ├── adminInternalClient.ts
│   │   └── payloadReadClient.ts
│   └── types/
│       └── index.ts
└── vercel.json
```

Related new server-side code in `apps/admin`:

```text
apps/admin/src/
├── app/api/internal/mcp/
│   ├── posts/create/route.ts
│   ├── posts/update/route.ts
│   ├── posts/publish/route.ts
│   ├── pages/create/route.ts
│   ├── pages/replace-structure/route.ts
│   └── pages/publish/route.ts
└── services/mcp/
    ├── posts.ts
    ├── pages.ts
    ├── richText.ts
    └── auth.ts
```

## Runtime Model

### Read Path

For read-only tools and resources:

- `apps/mcp` may read from the existing Payload REST API exposed by `apps/admin`
- or from narrowly defined internal read endpoints if needed

This matches the existing `apps/www` service-layer pattern and keeps data access simple.

### Write Path

For mutations:

1. An MCP client calls a tool on `apps/mcp`.
2. `apps/mcp` validates parameters and checks scope.
3. `apps/mcp` calls an internal `apps/admin` action endpoint.
4. `apps/admin` performs the mutation with Payload local APIs.
5. Existing hooks, drafts, translation hooks, page asset pipelines, and timestamps run normally.
6. `apps/admin` triggers frontend revalidation when appropriate.
7. `apps/mcp` returns a tool result with stable identifiers and summary metadata.

## Tool Design Principles

### Principle 1: Task-Oriented Tools

Expose high-level operations, not raw collection CRUD.

Good:

- `create_post_draft`
- `replace_post_content`
- `publish_post`
- `replace_page_structure`

Bad:

- `payload_update_document`
- `write_collection_row`

### Principle 2: Human-Friendly Inputs

Tool inputs should be optimized for authoring ergonomics.

Examples:

- posts should accept Markdown instead of raw Lexical JSON
- page tools should accept a validated page-structure document instead of unrestricted arbitrary patches

### Principle 3: Narrow Result Shapes

Tool outputs should return:

- `id`
- `slug`
- `status`
- `updatedAt`
- any follow-up action summary

Do not return full raw Payload documents by default after every write.

## Proposed V1 Tool Surface

### Read Tools

- `get_post`
- `list_posts`
- `get_page`
- `list_pages`
- `get_site_config`

### Write Tools for Posts

- `create_post_draft`
- `update_post_metadata`
- `replace_post_content`
- `publish_post`
- `archive_post`

### Write Tools for Pages

- `create_page_draft`
- `replace_page_structure`
- `update_page_seo`
- `publish_page`

### Site Tools

- `revalidate_site_paths`

## Post Authoring Strategy

`posts.content` uses Payload Lexical rich text. MCP tools should not require the client to send Lexical JSON.

The recommended contract is:

- MCP tools accept Markdown for long-form post content.
- `apps/admin` converts Markdown to the Lexical structure expected by Payload.
- `apps/admin` remains responsible for validation and persistence.

This keeps the MCP authoring experience practical while still preserving the CMS content model.

## Page Authoring Strategy

`pages.structure` is a nested block tree with multiple structure and leaf block types.

Because of this, the first writable page workflow should be conservative:

- support full structure replacement for a page
- validate the structure against an explicit allowed schema
- avoid arbitrary field-level mutations in the first version

Future versions may introduce path-based updates, but only after the block authoring model is stable.

### Recommended V1 Page Contract

Use a typed page document that maps directly to allowed page blocks and nesting rules.

The first version should support:

- `text`
- `markdown`
- `button`
- `card`
- `mediaImage`
- `container`
- `flex`
- `grid`

More specialized blocks such as generated previews or external embeds can be added later when their operational behavior is clearer in MCP workflows.

## Authorization Model

### Phase 1

Private bearer token only.

Requirements:

- all remote writable tools require a bearer token
- all internal `apps/admin` mutation endpoints require a separate shared secret
- read-only local `stdio` usage can bypass remote HTTP auth in development

### Phase 2

OAuth support for remote MCP clients.

Long-term scope model:

- `content.read`
- `post.write`
- `post.publish`
- `page.write`
- `page.publish`
- `site.revalidate`

The system should be designed so that adding OAuth later does not require rewriting the tool layer.

## Auditability

Every write operation should create structured logs with:

- tool name
- actor identity
- target document id or slug
- result status
- request id
- timing

Optional future enhancement:

- write a dedicated audit collection in Payload
- or emit structured logs to the deployment platform

## Revalidation Strategy

`apps/admin` should remain the owner of revalidation side effects after successful mutations.

This RFC recommends:

- extending the current `apps/www` revalidation contract to support post tags as well as page tags
- centralizing post-save revalidation decisions inside `apps/admin` mutation handlers

This avoids duplicating frontend cache knowledge inside `apps/mcp`.

## Deployment Strategy

### Primary Recommendation

Deploy `apps/mcp` to Vercel as a third project.

Reasons:

- writable MCP is tightly coupled to the existing Vercel-hosted `admin` and `www` apps
- private auth and internal API calls are simpler to manage in one hosting environment
- long-term debugging and operational ownership remain clearer

### Optional Secondary Deployment

If the project later needs a public read-only MCP server, it can be split into a separate Cloudflare-hosted deployment. That is not part of this RFC's primary path.

## Environment Variables

Initial expected variables for `apps/mcp`:

- `ADMIN_INTERNAL_API_URL`
- `MCP_TO_ADMIN_SHARED_SECRET`
- `MCP_BEARER_TOKEN`
- `MCP_BASE_URL`

Potential future variables:

- `MCP_OAUTH_ISSUER_URL`
- `MCP_OAUTH_AUDIENCE`
- `MCP_OAUTH_CLIENT_ID`
- `MCP_OAUTH_CLIENT_SECRET`

Expected internal variables for `apps/admin`:

- `MCP_TO_ADMIN_SHARED_SECRET`

The design intentionally does not require `apps/mcp` to know database credentials or Payload secrets.

## Delivery Plan

### Phase 0: RFC and App Skeleton

- create `apps/mcp`
- add package metadata and transport skeleton
- add this RFC

### Phase 1: Read-Only Foundation

- implement read tools and resources
- support both `stdio` and remote HTTP
- add bearer-token protection for remote usage

### Phase 2: Writable Post Flow

- add internal `apps/admin` mutation handlers for posts
- add Markdown-to-Lexical conversion
- add post revalidation coverage for `apps/www`
- implement `create_post_draft`, `update_post_metadata`, `replace_post_content`, `publish_post`

### Phase 3: Writable Page Flow

- add internal `apps/admin` mutation handlers for pages
- implement validated full-structure replacement
- implement `create_page_draft`, `replace_page_structure`, `update_page_seo`, `publish_page`

### Phase 4: Hardening

- add tool scopes
- add OAuth
- add audit persistence
- add idempotency support where needed

## Risks

- Markdown-to-Lexical conversion may be more complex than expected depending on supported formatting features.
- Page block authoring may require an intermediate schema layer to stay ergonomic.
- Revalidation rules for posts are currently less explicit than for pages and need to be normalized.
- If mutation handlers are too generic, the system may drift back toward raw CRUD exposure.

## Open Questions

- Should post creation automatically assign the current authenticated Payload user as author, or should the tool allow explicit author selection?
- Which page block types should be in the first supported page-writing schema?
- Should `publish_post` and `publish_page` be separate scopes from draft editing from day one?
- Should write operations persist an audit record in Payload immediately, or start with platform logs only?

## Recommendation

Proceed with:

- a Vercel-hosted private `apps/mcp`
- task-oriented writable tools
- internal mutation handlers in `apps/admin`
- Markdown-first post authoring
- validated full-structure page replacement before any fine-grained page patch API

This is the most stable long-term path for adding writable MCP capabilities without breaking the current repository architecture.
