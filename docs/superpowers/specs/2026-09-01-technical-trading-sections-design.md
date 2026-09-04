# Technical and Trading Post Sections Design

## Goal

Split the public writing experience into distinct Technical and Trading sections while preserving the existing Posts collection, editor experience, article presentation, and MCP workflows.

The public navigation becomes `Demos → Technical → Trading`. Technical and Trading are primary classifications, not separate content types.

## Scope

This design includes:

- Technical and Trading archive pages.
- Section-specific article URLs.
- Classification through the existing `primaryTag` relationship.
- Compatibility redirects from existing `/posts` URLs.
- Local Payload MCP data setup and browser validation.
- Locale-aware metadata, sitemap entries, and frontend revalidation.

This design does not include:

- A separate Trading collection.
- Trading-specific fields such as ticker, direction, entry price, or position status.
- Production CMS writes or deployment.
- A redesign of the existing article card or article detail UI.

## Content Model

Posts remains the only article collection. Its existing fields, drafts, publishing workflow, Markdown content, SEO fields, and MCP tools continue to serve both sections.

The existing categorization fields have distinct responsibilities:

- `primaryTag` identifies the public section. The initial values are Technical and Trading.
- `tags` contains optional secondary topics such as React, AI, BTC, or market structure.
- `series` groups ordered, multi-article sequences and does not determine the public section.

`primaryTag` becomes required for Posts. The implementation must not hard-code an enum that prevents future primary sections. Existing Posts without a primary tag are treated as Technical during the compatibility period, and the local data setup assigns Technical explicitly to the current documents.

The Technical and Trading Tag names and descriptions are localized. Archive headings and introductory copy come from these Tag documents so that user-facing content remains CMS-driven.

## Routes and Navigation

The public routes are:

- `/technical`
- `/technical/[slug]`
- `/trading`
- `/trading/[slug]`

Locale-prefixed variants use the existing locale routing rules, including `/zh-CN/technical` and `/zh-CN/trading`.

SiteConfig navigation is updated from `Demos → Posts` to `Demos → Technical → Trading`. The menu item order is preserved on desktop and mobile.

Compatibility redirects are permanent:

- `/posts` redirects to `/technical`.
- `/posts/[slug]` resolves the Post and redirects to its section-specific URL.
- A legacy Post without `primaryTag` redirects to `/technical/[slug]`.

## Frontend Architecture

Technical and Trading use shared archive and article-detail components. The route supplies a section descriptor containing the expected primary Tag slug and URL base. The shared implementation owns rendering, metadata, empty states, and Post card behavior.

The Payload service adds a section-aware query that returns published Posts whose `primaryTag` matches the requested Tag. It first resolves the Tag safely and then filters Posts by the relationship identifier. A missing Tag produces an empty archive result rather than an unfiltered Post query.

The article route loads the Post by slug and verifies its primary section. A section mismatch returns not found, preventing the same canonical article from being served under both section paths.

The existing visual language remains unchanged. Each archive uses the current Post list/card presentation with the localized Tag name and description as its heading. Empty sections render an explicit localized empty state.

## SEO, Localization, and Revalidation

Canonical URLs use the section-specific route. Locale alternates and `hreflang` entries follow the existing multilingual conventions.

The sitemap emits each published Post at its Technical or Trading URL for every available locale. A Post without a primary Tag is emitted under Technical during the compatibility period. Old `/posts` URLs are excluded from the sitemap.

Post and Tag changes revalidate the appropriate section archives and article routes. SiteConfig changes continue to revalidate navigation through the existing global revalidation contract.

## Local MCP Preview Workflow

All preview content changes target `local-chankay-payload`; production MCP is not used.

The workflow is read-before-write:

1. Read Tags, Posts, and SiteConfig and confirm the expected local documents.
2. Create localized Technical and Trading Tags if they do not already exist.
3. Assign Technical as `primaryTag` for the two existing local Posts by document ID.
4. Replace the Posts navigation item with Technical and insert Trading immediately after it, preserving unrelated SiteConfig fields and menu items.
5. Create one clearly labeled local sample Trading Post with neutral demonstration content and publish it only in the local CMS so both archive and detail states can be reviewed.
6. Read back every changed document and compare the intended fields.
7. Run the local frontend and inspect Technical and Trading on desktop and mobile.

The sample Post must not present invented market opinions as the user's real view. Production data setup and publication require a separate explicit decision after local validation.

## Error Handling

- If either primary Tag query returns zero or multiple matching documents, stop before writing and report the ambiguity.
- If an expected Post or SiteConfig document cannot be resolved uniquely, do not mutate it.
- If the local MCP returns an authorization error, stop and request correction of the local MCP credentials; do not try the production endpoint.
- If a Post references an unknown primary Tag, the public section route returns not found. Legacy Posts with no primary Tag retain the documented Technical fallback.
- Payload and frontend errors must not fall back to showing an unfiltered archive.

## Verification

Focused automated coverage includes:

- Primary-section query behavior for Technical, Trading, missing Tags, and empty results.
- Section URL resolution and legacy fallback behavior.
- Technical and Trading archive rendering.
- Section-specific article rendering and mismatch rejection.
- Permanent redirects from `/posts` and `/posts/[slug]`.
- Canonical URLs, locale alternates, and sitemap section paths.
- Localized routes and empty-state copy.
- Revalidation tags and paths for Post, Tag, and SiteConfig changes.

Manual local validation includes:

- Navigation order on desktop and mobile.
- Technical archive containing the two existing articles.
- Trading archive containing the labeled local sample article.
- Article details matching the existing Post experience.
- English and Chinese locale behavior.
- Redirect behavior for the old Post URLs.

## Rollout Boundary

Implementation and validation stop at the local environment. No production CMS data, migration, deployment, or MCP write is part of this design. After the local result is approved, production rollout must be planned separately with exact data changes and rollback behavior.
