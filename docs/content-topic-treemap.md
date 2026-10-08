# Content Taxonomy and Topic Treemap

Status: Tag retirement in implementation
Updated: 2026-10-08  
Scope: Payload content model, public topic statistics, and the homepage Treemap block

## Current contract: Tag retirement

The [Tag retirement contract](#tag-retirement-approved-october-8-2026) supersedes the original Category → Tag design below. The active model is Category → Article: each unique published article contributes one unit. Tags are removed from the active CMS, MCP, and website. Series remains optional editorial metadata. The chart shows counts directly, zooms categories within the same canvas, and opens article leaves through existing localized routes. Root categories use the same hover and activation behavior as other expandable branches. The old heading, explanation, table, and external detail panel are removed. Nested Categories are a separate follow-up.

The sections below retain the previous rollout evidence and design history; conflicting Tag-specific requirements are no longer current. Historical Mongo records and migration journals remain read-only. Legacy block description and topic-limit fields are retained for snapshot compatibility but are no longer rendered or used.

## Previous production verification (October 8, 2026)

The bilingual homepage topic map is enabled below the GitHub heatmap. Technical contains 5 articles and 12 tag assignments; Trading contains 3 articles and 9 assignments. There are 8 unique published articles, 21 assignments, and no untagged articles. Existing article content, relationships, publication dates, and public media hashes matched the pre-migration baseline.

Production checks covered category-header zoom, reset, topic article lists, keyboard activation, canonical article redirects, English/Chinese labels, mobile and desktop layouts, and light/dark theme tokens. Saving the homepage draft left the public snapshot unchanged; publishing refreshed the homepage without redeploying. Generated page assets completed in the native draft workflow without overwriting the live snapshot.

The final cleanup passed 398 Admin tests, 149 website tests, both application type checks, and cross-release audit-hash fixtures. The 10,000-post latency benchmark was local; it is not a production latency claim. Operational migration records remain outside the repository.

## 1. Overview and decisions

Add a homepage visualization of the topics covered by published posts. The hierarchy is **Category -> Tag**, with rectangle area representing **tag usage**, not unique article count. Series remains available for organizing related articles but does not participate in this chart.

The implementation must deliver:

1. A `categories` collection and one optional category relationship per post during migration.
2. Native reverse relationships on Categories, Tags, and Series using Payload Join fields.
3. A CMS statistics endpoint that returns Category-by-Tag counts without exposing article bodies or draft data.
4. A generic, token-themed Treemap in `packages/ui`, independent of Payload and blog-specific rules.
5. A CMS-configurable homepage block, with responsive presentation and an equivalent data table.
6. A staged migration from `primaryTag` to the new taxonomy, preserving existing topic information.
7. Native `_status` across all content collections under the companion [Native Publication for Content Collections](./native-content-publication.md) contract. That contract is a release prerequisite for the topic map.
8. Category zoom, expansion of grouped topics, and an on-demand article panel for each Category-by-Tag selection, with links to existing article detail pages.

Category describes a broad subject area, Tag describes a cross-cutting topic, and Series describes an optional editorial sequence. A tag may occur in multiple categories; it is not owned by a category.

The interaction decision was approved on 2026-09-29: leaves remain Tags, not articles. Category headers zoom into their tags; Tag activation opens a filtered article panel; article links navigate to existing detail routes. This extends the original display-only scope without changing the statistical unit or adding a third tree level.

The agreed product direction and acceptance criteria are retained below. The production verification above records the audited dataset and deployed behavior; larger-dataset performance evidence remains limited to local fixtures.

## 2. Historical baseline before rollout and constraints

| Area              | Current implementation                                                                                                                        | Implication                                                                                                |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Collections       | Payload registers Users, Media, Posts, Tags, Series, and Pages. There is no Category collection.                                              | Categories require a new schema and registration.                                                          |
| Post taxonomy     | `tags` is a many-valued relationship; `primaryTag` is a separate single relationship to Tags.                                                 | A primary tag may be absent from `tags`; migration must not lose it.                                       |
| Series            | Post has optional `series` and `seriesOrder`. Series includes author, difficulty, progress status, and completion date.                       | Preserve Series as an editorial feature; do not convert it into a broad category.                          |
| Reverse usage     | Tags and Series have ordinary `postCount` number fields, with no maintenance hook found. Neither has a Join field.                            | Existing `postCount` values are not authoritative.                                                         |
| Frontend          | `resolvePostTags` combines `tags` and `primaryTag`. The article page displays the Series title.                                               | Taxonomy migration must update article rendering as well as statistics.                                    |
| Navigation        | Site Config stores editable menu labels and URLs.                                                                                             | Creating Categories does not automatically generate navigation or landing pages.                           |
| Publication       | Posts has both custom `status` and Payload drafts/`_status`.                                                                                  | Reconcile legacy visibility, then use native `_status` as the sole Post publication control.               |
| Publishing helper | The current MCP `publish_post` tool writes `status` but does not explicitly set `_status`; anonymous Post access checks only custom `status`. | Migrate publishing/read paths to native `_status` without exposing legacy hidden articles or newer drafts. |
| Infrastructure    | Payload 3.88.0, MongoDB adapter, separate CMS and public Next.js apps.                                                                        | Keep CMS access and aggregation on the server.                                                             |
| Theme             | `packages/ui/src/tokens.css` defines chart, surface, text, border, radius, and dark-theme tokens.                                             | Do not introduce a separate color palette or use raw Tag colors.                                           |

Repository rules require English technical documentation, CMS-managed user-facing content where practical, generated Payload types, and presentation components in `packages/ui`.

Relevant source:

- [Post model](../apps/admin/src/collections/Posts.ts)
- [Series model](../apps/admin/src/collections/Series.ts); the former Tag model is retired
- [Payload configuration](../apps/admin/src/payload.config.ts)
- [Article utilities](../apps/www/src/utils/posts.ts) and [post queries](../apps/www/src/services/payload/posts.ts)
- [Site configuration](../apps/admin/src/globals/SiteConfig.ts)
- [Cache invalidation hook](../apps/admin/src/hooks/revalidateWww.ts) and [website revalidation route](../apps/www/src/app/api/revalidate/route.ts)

## 3. Goals, non-goals, and alternatives

### Goals

- Make content coverage visible without duplicating the top navigation.
- Make reverse article usage visible in the CMS without synchronizing duplicate relationship arrays.
- Preserve all selected tags and give multi-tag articles an explicit, consistent statistical meaning.
- Let visitors explore a category and reach the published articles behind a tag without leaving the homepage to find a separate taxonomy landing page.
- Keep the renderer reusable for unrelated hierarchical datasets.
- Make migration, publication visibility, visual behavior, and numerical correctness independently verifiable.

### Non-goals

- Series nesting, keyword extraction, AI classification, word frequency, reading-time weighting, or date-range filters.
- New category/tag landing pages, URL changes, SEO restructuring, or automatic navigation generation.
- New taxonomy landing pages, article leaves in the chart, arbitrary pan/pinch zoom, and persistent/shareable drill-down URLs. Article navigation uses existing detail routes.
- A taxonomy tree inside Categories, automatic Category assignment, or requiring a Series on every post.
- A new archive workflow or unrelated data-service refactoring. Shared publication changes for Posts, Pages, Tags, Series, Media, and Categories are specified in the companion native-publication proposal; Users retains its account lifecycle.

### Alternatives considered

| Option                                      | Benefit                                                                  | Trade-off                                                                                                        | Decision                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Category -> Tag, counting tag assignments   | Preserves all topics and matches the requested word-cloud-like overview. | Area is not unique article share; heavily tagged articles contribute more.                                       | Selected, with a permanent metric explanation.                   |
| Category -> one primary Tag, counting posts | Areas add up to unique article count.                                    | Requires an editorial primary-topic rule and ignores secondary tags in the chart.                                | Not selected.                                                    |
| Category -> Series -> Post                  | Each article follows one path.                                           | Shows editorial organization rather than topic coverage and adds a layer.                                        | Not selected.                                                    |
| Direct Mermaid rendering                    | Reuses the existing dependency and the referenced visual style.          | Diagram-source generation and SVG customization complicate token styling, responsive details, and accessibility. | Use as a visual reference, not the runtime interface.            |
| React rendering with `d3-hierarchy` layout  | Separates rectangle layout from React presentation and theme tokens.     | Adds a small, direct layout dependency.                                                                          | Selected; verify the registry package/version when implementing. |

[Mermaid's Treemap documentation](https://mermaid.js.org/syntax/treemap.html) supplies the visual reference. [D3's treemap layout](https://d3js.org/d3-hierarchy/treemap) provides rectangle coordinates; React owns all DOM rendering and text escaping. Do not import the full D3 bundle or generate Mermaid source from CMS labels.

## 4. Data model

### Categories

Create `apps/admin/src/collections/Categories.ts`, export/register it, and regenerate Payload types.

| Field         | Contract                                                                                |
| ------------- | --------------------------------------------------------------------------------------- |
| `name`        | Required localized text.                                                                |
| `slug`        | Required, unique, indexed, shared across locales.                                       |
| `description` | Optional localized text.                                                                |
| `sortOrder`   | Optional number, default `0`; ties resolved by stable ID.                               |
| `colorToken`  | Optional enum `chart-1` through `chart-5`; absent values use a stable ID-derived token. |
| `posts`       | Join to `posts` on `category`; paginated reverse usage.                                 |

Categories are taxonomy records with native versions/drafts, published-only public read, and authenticated mutation access, consistent with the new Tag policy. Prevent deletion while any current Post, including a draft, references the category. Historical versions may retain references; the public adapter must tolerate those after a restore.

Initial categories such as Technical and Trading are editorial examples, not hardcoded frontend branches. Create the actual records through the reviewed migration map.

### Posts

- Add `category`: single relationship to `categories`, indexed and shared across locales.
- Allow it to be absent on drafts and legacy documents during migration. After backfill, require a published Category on a publish operation; do not obstruct incomplete draft autosaves.
- Keep `tags` many-valued and shared across locales. Deduplicate tag IDs when saving and again defensively when aggregating. Tag order has no statistical meaning.
- Keep `series` and `seriesOrder` unchanged. No Category relationship is added to Series in this release because Series does not define the chart hierarchy.
- Deprecate `primaryTag` and custom Post `status` in stages described in Section 10. Neither contributes independently to the final metric.
- Verify adapter indexes for `category`, `tags`, and `series`, which back reverse usage queries. Add missing indexes through the normal Payload schema/migration workflow.

### Shared native publication lifecycle

The [Native Publication for Content Collections](./native-content-publication.md) contract is authoritative for Posts, Pages, Tags, Series, Media, and Categories. It defines native draft/publish behavior, preview authorization, generated assets, legacy migration, and the acceptance matrix. Users is an account collection and does not gain a content publication lifecycle.

For this feature, the required consequences are:

- Read published Post, Category, and Tag snapshots only. Newer draft edits never alter public topic counts or labels.
- Use the defined Uncategorized/Untagged fallbacks when referenced taxonomy is withdrawn; do not cascade-unpublish Posts.
- Preserve `Series.progress` independently of `_status`; neither Series state contributes to the chart.
- Activate the chart after shared publication migration and visibility reconciliation pass. Remove custom Post/Page publication fields and migrate Series business `status` to `progress` through the shared rollout.

### Reverse relationships

| Collection field   | Join target | `on` field |
| ------------------ | ----------- | ---------- |
| `Categories.posts` | `posts`     | `category` |
| `Tags.posts`       | `posts`     | `tags`     |
| `Series.posts`     | `posts`     | `series`   |

A [Payload Join](https://payloadcms.com/docs/fields/join) is virtual: the relationship is stored on the Post, and the reverse list is resolved when read. No hook writes a second list of post IDs. Editors can inspect all articles they are authorized to read; public reads must continue to enforce publication access.

Use a bounded default Join limit, such as 10. Do not use `limit: 0` for public requests because it returns all related records. Exact reverse counts require `count: true` and the appropriate publication filter. Default Join pages and unrelated global counts must never be used to derive the chart.

Remove the stale `postCount` columns from the Tags/Series admin list in the additive release. Retain legacy stored fields during the rollback window, then remove them in schema cleanup. The new chart never reads them.

## 5. Statistical contract

### Eligible articles

Read the published document, not its latest draft version: `draft: false` and `_status = published`. Apply collection/field read access. Custom Post `status` is not part of the final query. A published article with newer draft edits contributes its published taxonomy until those edits are published. See the native lifecycle rules in Section 4.

Use this same public-eligibility rule for anonymous Post reads and public Join results after legacy publication states are reconciled. Publishing tools must write `_status` and deliberately select the version being published. Remove custom `status` readers and writers after the compatibility window; do not maintain two authoritative publication fields. Cutover must preserve previously approved public snapshots and keep previously hidden articles private.

All-time data is the only supported range in version 1. Each Post ID is counted once. Relationships are not localized, so the current shared-publication model has the same numerical totals in English and Chinese; locale selects taxonomy labels with the configured fallback. Translations are not additional articles.

### Counting rules

For an eligible post `p`, let `C(p)` be its valid published category, or the synthetic `uncategorized` bucket. Let `T(p)` be the set of valid, readable, published Tag IDs after deduplication.

```text
tagValue(category, tag) = number of eligible posts assigned to both
untaggedValue(category) = number of eligible posts where T(p) is empty
categoryArea = sum(tagValue for that category) + untaggedValue(category)
totalArea = sum(categoryArea)
totalArea = tagAssignmentCount + untaggedPostCount
```

Each distinct `(post ID, tag ID)` contributes one unit. An untagged post contributes one unit to an explicit synthetic leaf so that it remains represented.

The response and UI distinguish:

- `publishedPostCount`: unique eligible posts.
- `tagAssignmentCount`: actual valid Post-to-Tag assignments.
- `untaggedPostCount`: eligible posts with no valid tags.
- `areaValue`: assignments plus untagged units; this determines area.

The visible explanation must say that one article may contribute to multiple tags and that an untagged article contributes one untagged unit. Do not label area percentages as article percentages. This also makes the bias toward more heavily tagged articles explicit.

### Edge cases and ordering

- A missing, deleted, or unpublished Category places the article in `uncategorized`; do not guess from Series or tag order.
- Ignore broken or unpublished Tag references. If no valid published tags remain, count the article as untagged. Record broken-reference diagnostics separately from intentional draft/unpublished taxonomy, without exposing hidden labels.
- Group by IDs, not localized names. The same Tag under two Categories has two distinct chart node IDs.
- Omit zero-area categories. No articles produces a valid empty response, not an error.
- Sort categories by `sortOrder`, then ID; sort leaves by descending value, then ID. Locale changes must not arbitrarily reshuffle tied nodes.
- Any presentation grouping must preserve the complete area total. Never silently discard small topics.

### Acceptance fixture

The records below and their Category/Tag records have native published versions unless another state is specified. Missing Series, or changing Series, has no effect.

| Post | Category  | Tags              | State                                               |
| ---- | --------- | ----------------- | --------------------------------------------------- |
| P1   | Technical | React, TypeScript | Published                                           |
| P2   | Technical | React             | Published                                           |
| P3   | Technical | none              | Published                                           |
| P4   | Trading   | Risk, Valuation   | Published                                           |
| P5   | Technical | React, React      | Published; duplicate legacy relation                |
| P6   | Technical | React             | Draft only; excluded                                |
| P7   | Trading   | Risk              | Legacy archived; migrated to native draft; excluded |
| P8   | none      | Notes             | Published legacy article                            |

Expected results:

- Technical: React `3`, TypeScript `1`, Untagged `1`; area `5`, unique posts `4`.
- Trading: Risk `1`, Valuation `1`; area `2`, unique posts `1`.
- Uncategorized: Notes `1`; area `1`, unique posts `1`.
- Global: **6 published posts, 7 tag assignments, 1 untagged post, area 8**.
- Category area shares: `62.5%`, `25%`, and `12.5%`; these are not shares of the six articles.

## 6. Architecture and data access

```mermaid
flowchart LR
    E[Editor updates Post relationships] --> P[Payload Posts]
    P --> J[Virtual reverse lists in Categories / Tags / Series]
    P --> Q[CMS published taxonomy query]
    L[Category and Tag labels] --> Q
    Q --> A[Pure Category-by-Tag aggregator]
    A --> API[Public topic-map endpoint]
    API --> S[Website server data service and cache]
    B[CMS Topic Map block] --> N[Website TopicMapNode]
    S --> N
    N --> U[Generic Treemap in packages/ui]
    N --> T[Accessible complete data table]
    U --> X[App-owned category focus and topic selection]
    X --> W[Website article proxy]
    W --> R[CMS public Category AND Tag article query]
    R --> V[Inline paginated article panel]
    V --> D[Existing localized Post detail route]
```

### Why Join totals are insufficient

The total posts for a Category and the total posts for a Tag are marginal counts; they do not describe their intersection. The CMS therefore computes a Category-by-Tag cross-tabulation from the source relationships. Joins provide reverse usage in the CMS, while the statistics service produces the public aggregate. No duplicated usage arrays or counter-maintenance hooks are introduced.

### CMS query strategy

Add a read-only custom endpoint at `GET /api/posts/topic-map`. Its service:

1. Validates the locale against `@repo/i18n`; omitted locale uses the site default.
2. Uses Payload Local API with `overrideAccess: false` under public read scope. Logged-in callers must receive the same public result as anonymous callers; do not include preview state in a shared cache.
3. Queries eligible Posts with `select` limited to ID, category, and tags; `depth: 0`, `joins: false`, a stable ID sort, and bounded pages of 200. Reads every page and deduplicates IDs. Article bodies, titles, authors, and media are not required.
4. Loads published Category/Tag IDs and required display fields with `draft: false`, `_status = published`, and `joins: false` in bounded, fully paginated queries. Never use their latest draft labels. Avoid one query per Tag or Category.
5. Runs a pure aggregation function and returns only public labels, IDs, and aggregate values.

This is a bounded metadata scan inside the CMS, not a browser download of all Posts. Do not replace Payload queries with direct MongoDB access that bypasses collection access rules. A future database aggregation or materialized statistic may replace the internal query if measured scale requires it, preserving the endpoint contract.

The chart is eventually consistent, not a transactional accounting snapshot. Concurrent edits during a multi-page read may be reflected on the next successful refresh. Never return a successful partial result after a page fetch fails or pagination stops unexpectedly.

### API contract

Supported input: `locale` only. Reject unsupported locales and caller-supplied draft, filter, or arbitrary query parameters with `400`. The endpoint returns a versioned shape:

```ts
type TopicMapResponse = {
  schemaVersion: 1
  metric: "tag-usages-with-untagged"
  locale: string
  generatedAt: string
  totals: {
    publishedPostCount: number
    tagAssignmentCount: number
    untaggedPostCount: number
    areaValue: number
  }
  categories: Array<{
    id: string
    kind: "category" | "uncategorized"
    label: string
    colorToken?: "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5"
    publishedPostCount: number
    areaValue: number
    topics: Array<{
      id: string
      tagId: string | null
      kind: "tag" | "untagged"
      label: string
      value: number
    }>
  }>
}
```

Synthetic IDs use a reserved namespace; leaf IDs include the category and tag IDs. All values are finite non-negative integers. Branch `areaValue` must equal the sum of its leaves. Synthetic labels use the site's locale catalog. No post IDs, unpublished labels, bodies, or authentication-dependent data are returned.

`tagId` is the public Tag ID for real topics and `null` for Untagged. The website uses this explicit domain identity to request articles; it never parses composite chart IDs. Category `id` is either a public Category ID or `synthetic:uncategorized`. These additions are part of the initial, not-yet-released schema version 1.

Successful empty data returns `200` with zero totals and `categories: []`. Dependency/query failures return `503` with a stable error code, not fake zero counts. The website validates the response before adapting it for UI.

### Article drill-down API

Add `GET /api/posts/topic-map/articles` in the CMS. The website exposes a narrow same-origin `GET /api/topic-map/articles` handler that validates and forwards only the supported parameters through its server data service. Browser interaction must not require CMS credentials, arbitrary collection access, or access to the CMS preview path.

| Parameter  | Contract                                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| `locale`   | Supported locale; defaults to the site default.                                                             |
| `category` | Required published Category ID or `synthetic:uncategorized`.                                                |
| `topic`    | Required published Tag ID or `synthetic:untagged`. Composite chart IDs and `Other topics` are not accepted. |
| `page`     | Positive safe integer; defaults to 1. Page size is fixed at 10.                                             |

Reject malformed IDs, repeated or unknown parameters, unsupported locales, and caller-supplied filters, sort, page size, or draft flags with `400`. Resolve a valid but no-longer-public real Category/Tag to a generic `404` selection-unavailable response without exposing its hidden label. Dependency failures return `503`; valid selections with no matches return `200` and an empty list.

The response contains `schemaVersion: 1`, `locale`, `generatedAt`, the validated selection, `page`, `limit: 10`, `totalDocs`, `hasNextPage`, and `docs` containing only `id`, `slug`, localized `title`, optional `excerpt`, and `publishedAt`. Do not return bodies, versions, author records, hidden taxonomy, or arbitrary URL fields. The website creates localized links with the existing Post route helper and renders returned strings as escaped text. Article IDs are permitted in this dedicated list response, not the aggregate response.

Query published Post snapshots under the same public access scope as the aggregate, regardless of caller authentication: `draft: false`, `_status = published`, `overrideAccess: false`, `joins: false`, minimal `select`, and deterministic `-publishedAt` then ID ordering. Real selections use the intersection of Category and Tag, not their union; each Post appears once even if legacy tags contain duplicates. Newer drafts never change the list.

Synthetic selections must match the aggregation rules exactly: Uncategorized means no readable published Category; Untagged means no readable published Tag, including broken, withdrawn, and empty relationships. Reuse the eligibility logic and published taxonomy ID sets. For synthetic cases, bounded candidate scans may filter using those sets before computing totals and slicing the requested page; do not paginate first or fetch article bodies. Avoid one query per Post or topic. `Other topics` expands into individual topic choices in the UI and never issues a combined article query whose total could be mistaken for its assignment area.

Both the website proxy and CMS list response use `Cache-Control: no-store`; client requests are lazy and abortable. Do not preload article lists for every tile. A fresh list may differ from the cached aggregate after an editorial change: show the current list total, keep its meaning distinct from chart area, and show a localized empty/unavailable state when needed. Public Post detail access remains authoritative if publication changes again before navigation.

### Caching and invalidation

- Cache the server fetch per locale with a 60-second revalidation interval and a dedicated `topic-map:<locale>` cache tag.
- Extend authenticated revalidation handling for Posts, Tags, and Categories. Invalidate all supported locales after any successful change that can alter public membership, taxonomy, or labels, and after deletion.
- Handle native unpublish transitions, legacy archive migration, and taxonomy edits to already-published documents. The current Post hook's early draft-status return must not suppress removal of previously public data.
- Pure draft saves with no public change do not invalidate the chart, including draft taxonomy edits. Series updates do not affect chart statistics, but may invalidate article metadata under the shared publication contract.
- After successful invalidation, the next page request must observe the refreshed result. The 60-second interval is a fallback for missed hooks, not a promise of background updates without requests or during a CMS outage.
- A failed refresh may retain a previously successful framework cache entry. With no valid data available, omit the visualization without breaking the homepage; CMS preview shows an explicit unavailable state. Do not present unavailable data as zero articles.

## 7. UI boundary and rendering

Create `packages/ui/src/components/Treemap/` and export it through the existing component export pattern. The renderer accepts generic tree data:

```ts
type TreemapNode =
  | { id: string; label: string; value: number; children?: never }
  | { id: string; label: string; children: readonly TreemapNode[]; value?: never }

type TreemapProps = {
  data: TreemapNode
  ariaLabel: string
  className?: string
  nodeTones?: Readonly<Record<string, "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5">>
  focusedNodeId?: string | null
  onFocusChange?: (nodeId: string | null) => void
  onLeafActivate?: (nodeId: string) => void
}
```

The exact prop naming may follow existing UI conventions, but the following boundaries are mandatory:

- No Payload types, Posts/Tags/Series imports, fetching, environment access, locale lookup, or article counting in `packages/ui`.
- Local state for container measurement and presentation is allowed. Layout is a deterministic function of validated tree data and dimensions.
- Optional controlled focus and activation callbacks express generic interactions. Without callbacks the component remains informational; it never builds routes, fetches articles, interprets synthetic topic IDs, or owns domain selection state. Only branch nodes can become the focused root; invalid or removed focus IDs fall back to the full tree.
- Parents have children but no additive value. Sum leaf values only, preventing D3 from counting parent totals a second time.
- CSS custom properties supply surfaces, text, borders, focus indicators, radius, and chart tones. Existing `Tag.color` values do not determine chart colors.
- Use a stable category token mapping across refreshes and locales. Derive gentle fills from chart and surface tokens; render text on a contrast-tested surface. Do not assume `--foreground` contrasts with every chart token.
- Render labels as escaped React text. Arbitrary HTML, Mermaid syntax, scripts, and CSS from content are never interpreted.
- Generic empty and invalid-input handling must not crash the surrounding page. Reject invalid numbers/duplicate IDs deterministically and make errors observable in development.

`apps/www` converts the domain response into the generic tree. Domain-specific labels, summary counts, metric explanation, and long-tail grouping stay in the application adapter.

### Interaction and state contract

| User action                                        | Result                                                                                                                                                         |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Activate a Category header                         | Recompute the chart with that Category as the visible root, filling the same responsive chart container.                                                       |
| Activate a Tag tile or its equivalent table action | Open an inline article panel for exactly the selected Category and Tag; fetch its first page on demand.                                                        |
| Activate Untagged                                  | Open the same panel for posts in that Category with no valid published tags.                                                                                   |
| Activate Other topics                              | Open an inline topic panel showing the omitted topics and their individual usage values, with article-panel actions. This also works within a zoomed Category. |
| Activate an article title                          | Navigate through an ordinary link to the existing localized Post detail route.                                                                                 |
| Activate All categories / breadcrumb               | Return to the full chart, clear the selection and panel, cancel obsolete requests, and reset list pagination.                                                  |
| Close a panel                                      | Preserve the current chart zoom and restore focus to the initiating control or its equivalent table action.                                                    |

Zoom means selecting a subtree and recalculating its rectangle layout, not scaling the whole SVG or increasing chart height. It adds no article level and does not mutate endpoint counts. Keep global unique-post totals labeled as global; show selected-category totals separately. Any displayed area percentage must identify whether its denominator is the full chart or the focused Category. Keep the configured top-N grouping inside the focused Category; Other topics exposes every omitted topic through a scrollable, labeled panel rather than forcing unreadably small rectangles into the chart. The complete server-rendered table remains available in every view.

The application owns `focusedCategoryId`, selected topic, panel mode, and requested article page. Category zoom does not itself fetch articles. Changing topic resets page to 1; switching topics rapidly cancels or ignores stale responses so one topic's articles cannot appear under another heading. Provide distinct loading, empty, error/retry, and selection-unavailable states. Changing locale clears pending requests and resets interaction state; removal of a selected node after refresh returns to the nearest valid view without retaining hidden labels. No selection is persisted to the URL or storage in this release.

Use an inline panel below the chart on both desktop and mobile, styled with the existing tokens. It must fit the viewport, have a visible heading and close control, and use explicit previous/next page controls instead of infinite scroll. Opening a panel moves focus to its heading and announces loading/results; closing it restores focus. Breadcrumbs and panel controls live in the app composition, with localized labels supplied by `@repo/i18n`.

### Responsive and accessible behavior

- Use a two-level view only. Default chart height is 320 CSS pixels below 768px and 420 CSS pixels at wider widths, excluding heading and optional table.
- Recompute geometry for container width changes; do not shrink a desktop screenshot or fixed SVG with unreadable text.
- By default, show the eight largest leaves in each category and combine the remainder into an `Other topics` leaf. This is presentation-only aggregation; its value is the exact sum of omitted leaves. The same grouping is used on mobile and desktop.
- The endpoint and expandable data table retain all topics. `Other topics` must not be described as a unique-post count.
- Hide tile labels when they do not fit, rather than overlapping adjacent tiles. Category labels are also available outside the chart in the table/summary.
- Provide a keyboard-operable, localized `View data` disclosure containing the complete Category-by-Tag table, with usage values and category unique-post totals distinguished. This is also the server-rendered/no-JavaScript fallback.
- Interactive category headers and sufficiently large tiles use native button semantics with keyboard activation, descriptive names, and visible focus; article titles use native links. Do not nest buttons or make a leaf click also trigger category zoom. No action requires hover or double-click. Tiny tiles below the 44px target threshold remain decorative; expose the same actions in the complete table with adequately sized controls. The chart has an accessible name and points to that table.
- Without JavaScript, the complete server-rendered table and its disclosure remain usable; progressive interactive controls must not appear enabled when they cannot work. Every small or label-hidden topic remains reachable through the table when JavaScript is available.
- Text contrast must meet WCAG AA, and the disclosure control must have a visible focus state and a 44px minimum target. Color is not the sole means of identifying a category.
- No animated entrance is required. Respect reduced-motion preferences if transitions are added.

## 8. CMS block and module ownership

Add a `topicMap` block through the existing content/structure block registration and rendering paths. Its fields are:

| Field                  | Behavior                                                                          |
| ---------------------- | --------------------------------------------------------------------------------- |
| `enabled`              | Defaults to false for rollout; disabling removes the block from public rendering. |
| `title`                | Localized, editor-controlled heading.                                             |
| `description`          | Optional localized introduction.                                                  |
| `maxTopicsPerCategory` | Integer 3-20, default 8, controlling the presentation-only tail grouping.         |

The fixed metric explanation, synthetic labels, and control text live in `@repo/i18n`; editors cannot remove the explanation or change the statistical unit. Use existing page layout settings for width and spacing. The block does not accept arbitrary colors, API URLs, or custom statistical formulas.

| Module                                                | Responsibility                                                                                             |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `apps/admin/src/collections`                          | Category schema, Post category relationship, reverse Joins, staged deprecations.                           |
| `apps/admin/src/services` and collection endpoints    | Published metadata query, pure aggregation, public aggregate and filtered article response.                |
| `apps/admin/src/hooks`                                | Relevant mutation invalidation and category deletion validation.                                           |
| `apps/admin/src/migrations`                           | Explicit mapping, idempotent backfill, verification, rollback metadata.                                    |
| `apps/admin/src/blocks`                               | Topic Map block registration and editable fields.                                                          |
| `apps/www/src/services/payload` and article proxy     | Cached aggregate access, uncached article requests, strict validation, and public-only responses.          |
| `apps/www/src/components/nodes` and renderer registry | CMS block composition, domain adapter, interaction state, article/topic panels, links, and complete table. |
| `packages/ui/src/components/Treemap`                  | Generic layout, token styling, controlled subtree focus, and optional activation callbacks.                |
| `apps/storybook`                                      | Independent fixtures demonstrating layout, themes, labels, and boundary cases.                             |
| `packages/i18n` and generated Payload types           | Static UI strings and schema-derived types.                                                                |

## 9. Verification and acceptance criteria

Each item below is mandatory for full delivery; staged rollout may keep the block disabled until the relevant gates pass.

| ID        | Acceptance criterion                                                                                                                                                                                                                             | Evidence                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| DATA-01   | The Section 5 fixture yields exactly 6 posts, 7 assignments, 1 untagged post, and area 8.                                                                                                                                                        | Pure aggregation tests.                                                                                                       |
| DATA-02   | A multi-tag post contributes once per distinct tag; reordering tags or changing Series does not change counts.                                                                                                                                   | Invariant tests.                                                                                                              |
| DATA-03   | Same-named Tags and the same Tag in different Categories remain distinct by ID/path.                                                                                                                                                             | Fixture tests.                                                                                                                |
| DATA-04   | Missing/unpublished categories, empty/unpublished tags, deleted references, zero posts, and more than 200 posts follow the defined rules.                                                                                                        | Boundary and pagination tests.                                                                                                |
| DATA-05   | All parent values equal child sums, including `Other topics`; branch values are not double-counted by layout.                                                                                                                                    | Adapter/layout tests.                                                                                                         |
| CMS-01    | Binding, reassigning, and unbinding a Post updates the appropriate Category/Tag/Series reverse results without mirrored ID arrays.                                                                                                               | Payload integration test on a disposable database.                                                                            |
| CMS-02    | Join results respect read access and pagination; exact counts do not equal merely the first page length.                                                                                                                                         | More than 10 related articles in integration fixtures.                                                                        |
| CMS-03    | New published posts require Category after migration; draft autosaves may omit it. Referenced Categories cannot be deleted.                                                                                                                      | Validation tests and editor smoke test.                                                                                       |
| ACCESS-01 | Draft-only and legacy archived articles migrated to native draft never contribute, including for authenticated endpoint callers. Newer draft taxonomy cannot alter a published article's public counts.                                          | Real Payload draft/version integration tests.                                                                                 |
| ACCESS-02 | Content tools, anonymous reads, and public Join results use native state under the companion publication contract; approved public snapshots remain visible and hidden records remain private.                                                   | Publication-path tests and a before/after reconciliation report.                                                              |
| PUB-01    | Saving draft edits leaves published content and counts unchanged; native unpublish removes the live article and refreshes caches.                                                                                                                | Draft/publish/unpublish integration tests.                                                                                    |
| PUB-02    | `publishedAt` is set only when first publishing, survives republish, and is not set by autosave. Post admin and MCP outputs use native state after cleanup.                                                                                      | Hook/tool tests and admin smoke test.                                                                                         |
| PUB-03    | Every legacy state combination follows the companion publication migration table; hidden native-published records stay private and already-public snapshots are preserved without publishing newer drafts.                                       | Migration fixtures, visibility comparison, and conflict/rollback tests.                                                       |
| API-01    | Aggregate endpoint: invalid inputs return 400; failed page queries return 503; zero articles returns a valid empty 200 response. No partial success or article content is exposed.                                                               | Endpoint contract tests.                                                                                                      |
| API-02    | Article requests validate only the documented parameters, return at most 10 summaries per page, apply Category AND Tag eligibility, and exclude drafts for anonymous and authenticated callers. Synthetic selections match aggregate membership. | CMS/proxy tests with more than 10 matching posts, duplicate tags, withdrawn taxonomy, missing references, and invalid inputs. |
| CACHE-01  | Publish, native unpublish, delete, category/tag reassignment, and label changes refresh the next request after successful invalidation.                                                                                                          | Integration test across hooks and the website handler.                                                                        |
| I18N-01   | English and Chinese show localized/fallback labels with identical counts; translations are not counted twice.                                                                                                                                    | Locale fixtures and visual checks.                                                                                            |
| UI-01     | Treemap works in Storybook with unrelated non-blog data and no Payload or app imports.                                                                                                                                                           | Import review and standalone story.                                                                                           |
| UI-02     | Correct layout at widths 320, 375, 768, 1024, and 1440px; no horizontal page overflow, overlapping labels, or clipped chart outside its container.                                                                                               | Browser screenshots in both themes.                                                                                           |
| UI-03     | Long Chinese/English labels, one leaf, equal values, large skew, and many small topics remain usable through chart and table.                                                                                                                    | Boundary stories and browser checks.                                                                                          |
| UI-04     | Theme changes update chart surfaces immediately using project tokens; text contrast and keyboard/table access meet Section 7.                                                                                                                    | Theme, contrast, keyboard, and no-JavaScript checks.                                                                          |
| UI-05     | With the block disabled, unavailable without cached data, or empty on a public page, no broken placeholder or page failure appears. Preview distinguishes empty from unavailable.                                                                | CMS/public integration checks.                                                                                                |
| INT-01    | Category zoom fills the same container and breadcrumb return restores the overview without changing counts or grouping totals; invalid focus IDs reset safely.                                                                                   | Generic controlled-component and app state tests.                                                                             |
| INT-02    | Activating a Tag opens only articles in that Category and Tag; the same Tag in two Categories yields distinct lists. Article titles link to the correct existing localized detail route.                                                         | End-to-end selection, pagination, and navigation tests.                                                                       |
| INT-03    | Other topics exposes every omitted topic with its usage value and individual article action; no third tree level or ambiguous combined article count is introduced.                                                                              | Long-tail fixtures and focused/overview browser checks.                                                                       |
| INT-04    | Category, Tag, Untagged, Other topics, breadcrumb, close, retry, and pagination actions work on mobile and keyboard; focus moves/restores predictably, small tiles have table equivalents, and no-JavaScript counts remain accessible.           | Keyboard, screen-reader, touch-target, and no-JavaScript checks in both themes.                                               |
| INT-05    | Rapid selection, locale changes, panel closure, and taxonomy withdrawal cannot display stale articles or hidden labels under the current selection. Loading, empty, error, and unavailable states remain distinct.                               | Controlled delayed-response, abort, retry, and publication-race tests.                                                        |
| INT-06    | Initial rendering and category zoom perform no article-list requests; activation fetches only the selected page, without CMS credentials, bodies, or draft fields.                                                                               | Browser network inspection and public-access tests.                                                                           |
| MIG-01    | Backfill is idempotent, preserves intended public visibility and content/localizations, applies only reviewed status conversions, and reports unresolved mappings.                                                                               | Dry-run report and second-run comparison.                                                                                     |
| MIG-02    | A primary tag outside `tags` is preserved as a topic unless explicitly mapped to Category; rollback does not overwrite later editorial edits.                                                                                                    | Migration and rollback fixtures.                                                                                              |
| PERF-01   | A fixture of 10,000 posts, 10 categories, and 100 tags is fully counted without per-topic queries or article-body reads. Cold endpoint p95 is at most 3 seconds over 20 runs on the recorded staging configuration.                              | Query count, selected fields, timing report. This is a target, not a current measurement.                                     |
| PERF-02   | The same fixture returns at most 256 KiB of uncompressed aggregate JSON; the displayed default tree has at most 9 leaves per nonempty category.                                                                                                  | Response-size and adapter checks.                                                                                             |

If performance targets fail, revise the CMS query/cache strategy before release; do not truncate source data to pass. Record the tested environment so timings are reproducible.

Local verification on October 8, 2026 used Payload 3.88, Node 24.19, and an
isolated MongoDB 7 replica set with 10,000 published fixture Posts, 10 Categories,
100 Tags, and three distinct Tags per Post. Twenty uncached service calls had a
671.4 ms p95 and a 672.4 ms maximum; the response was 29,040 bytes and counted all
10,000 Posts and 30,000 assignments. This is local database/service evidence,
not a measurement of deployed endpoint latency; deployment verification remains
required.

Run the relevant admin and website Vitest suites, type checks, UI build, and Storybook build. Existing `@repo/ui` and Storybook test scripts only print placeholders, so their exit codes are not test evidence. Add a real runner or include focused UI layout tests in an existing configured runner, and record the exact test files executed.

Current useful commands include `pnpm --filter admin test:run`, `pnpm --filter www test:run`, `pnpm --filter admin check-types`, `pnpm --filter www check-types`, `pnpm --filter @repo/ui build`, and `pnpm --filter storybook build`. Follow repository environment-safety rules for any command requiring CMS configuration; isolated test fixtures must not load production environment files.

## 10. Migration, rollout, and rollback

### Phase 1: inspect and expand

1. Inventory actual primary-tag values, tag usage, Series membership, publication states, and missing/broken references using an authorized read-only path. Report counts and IDs required for mapping, not article bodies or credentials.
   Inspect records with custom `status = published` but non-published `_status` separately. Reconcile their intended publication state and selected content version with the content owner; never bulk-publish latest drafts merely to make the chart match existing counts.
2. Produce an explicit mapping of legacy classification Tag IDs to Category slugs. Do not classify by localized name similarity or default every unmapped post to Technical.
3. Add Categories, optional `Post.category`, reverse Joins, and the disabled block. Keep `primaryTag` available to the old frontend during the compatibility window.
   Once editorial clients use Category, make the legacy field read-only and stop accepting new `primaryTag` writes before backfill. Existing stored values remain readable until cleanup.
4. Build statistics/UI against synthetic fixtures independently of the live migration.

### Phase 2: backfill and reconcile

Use an idempotent migration with a dry-run mode and an operator-controlled rollback record for the affected fields.

- Preserve an existing valid `Post.category`; do not overwrite an editor's assignment.
- If an existing Category conflicts with a legacy mapping, preserve the original relationships and report the conflict instead of removing classification tags automatically.
- If `primaryTag` has an approved category mapping, assign that Category where missing. Otherwise, preserve it by merging the primary Tag into `tags` if absent.
- Approved legacy classification tags may be removed from `tags` when converted to Category, avoiding a redundant `Technical` topic inside Technical. Record the original values before removal. Never remove other topic tags.
- When no mapped primary tag exists, a single unambiguous mapped classification tag may supply Category. Conflicting candidates remain unresolved for editorial assignment.
- Unresolved legacy articles remain represented under Uncategorized. Require the content owner to accept that explicit fallback or resolve the mapping before public activation.
- The taxonomy dry-run manifest blocks every legacy-public or native-published Post without a Category unless its Post ID appears in an explicit, reviewed Uncategorized acceptance set. Mapping values are published Category IDs after those records exist; the editorial review may display their slugs, but the conversion does not infer IDs from names.
- Generate publication and taxonomy inventories together for review. Compare each Post ID, update timestamp, legacy status, and native status across both scans; if a Post is missing, changed, or either manifest requires editorial review, withhold both action lists and repeat the inventory after reconciliation.
- Taxonomy backfill preserves article bodies, localized content, `series`, `seriesOrder`, publication dates, and publication state. Run native-status conversion as a separate, explicit migration step under the rules below; do not publish newer drafts as a side effect of metadata migration.
- Account separately for the published document and pending drafts. Define and test how later draft publication/version restoration preserves or revalidates Category; do not rewrite historical versions indiscriminately.
- Repeat the migration in dry-run mode: already-migrated records must produce no new changes.

Rollback records belong in approved operational storage, not the repository. The repository contains the migration code and non-sensitive mapping configuration only.

### Native-status migration and cutover

Follow the collection-specific migration tables and cutover sequence in [Native Publication for Content Collections](./native-content-publication.md#6-migration-and-rollout). That contract covers Posts, Pages, taxonomy, Series progress, Media, preview, compatibility writers, and rollback.

Do not activate the chart until the published visibility baseline is reconciled across Posts, Categories, and Tags. Taxonomy backfill and publication conversion are separately reviewable steps; changing a category or migrating `primaryTag` must never implicitly publish an article or a newer draft.

### Phase 3: enable and verify

1. Deploy compatible CMS and website versions; verify statistics and cache invalidation in staging. Complete the shared native-publication cutover and verify Post, Category, and Tag readers against the reconciled published snapshots.
2. Publish the homepage block enabled below the GitHub heatmap with localized title/description.
3. Complete the acceptance matrix, including signed-out behavior, mobile themes, migration totals, and the failure state.
4. Monitor endpoint failures, duration, eligible-post count, assignment count, and broken-reference counters. Never log full records or authenticated request data.

### Phase 4: contract cleanup

After one verified release and reconciliation of legacy data:

- Update `resolvePostTags` and other consumers to use `tags` only; Category is displayed separately only where the product requires it.
- Remove `primaryTag` from the editable Post schema and generated types. Complete custom status cleanup under the shared publication proposal; remove legacy `postCount` schema fields after confirming no consumer relies on them.
- Do not physically purge old stored values as part of this feature. Retain rollback metadata for at least 30 days after schema cleanup; purging it is a separate operational action.
- Update relevant CMS/frontend convention docs and promote this proposal after implementation is shipped and verified.

Rollback first disables the block and restores the previous application version. Additive Category and Join schema changes can remain. Restore migrated relationships only for records whose affected fields still match the migration output; otherwise flag them for manual reconciliation so newer editorial changes are preserved.

## 11. Implementation sequence and completion gates

| Stage | Work                                                                                          | Gate                                                                              |
| ----- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1     | Data inventory, explicit category mapping, and shared publication/version fixtures.           | Mapping and unresolved fallback are reviewable; no destructive conversion.        |
| 2     | Additive schema, joins, native-status compatibility, generated types, migration with dry run. | CMS and migration acceptance items pass.                                          |
| 3     | CMS queries, pure aggregation, aggregate/article endpoints, invalidation.                     | Data/API/access/publication/cache acceptance items pass.                          |
| 4     | Generic UI layout, controlled zoom/activation, and theme integration with standalone stories. | UI package is independently usable and visually verified.                         |
| 5     | Website service/proxy, CMS block, panels/navigation, localization, complete data table.       | End-to-end preview passes interaction, responsive, error, and performance checks. |
| 6     | Controlled backfill, homepage activation, staged schema cleanup.                              | Full acceptance evidence and rollback verification are recorded.                  |

The implementation delivery should include code/test links, representative screenshots, the data reconciliation report, actual validation commands/results, and known limitations. A successful build alone is not acceptance.

## 12. Risks and remaining release inputs

| Risk or unknown                                 | Handling                                                                                                                                                       |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unknown meaning of existing `primaryTag` values | Audit actual records and use an explicit mapping. No automatic reinterpretation by label.                                                                      |
| Tag-heavy articles dominate area                | Permanent usage-based explanation; unique-post counts remain separately labeled.                                                                               |
| Publishing and custom status disagree           | Audit both legacy fields, preserve approved public snapshots during cutover, then query only `_status`; do not publish newer drafts as a repair.               |
| A Tag is shown under multiple Categories        | Composite chart IDs and Category-by-Tag aggregation; this is intentional.                                                                                      |
| Cache hooks miss unpublishing or deletion       | Cover transitions and delete hooks explicitly; retain time-based refresh.                                                                                      |
| Active edits race with backfill or rollback     | Use expected-value checks and flag conflicts; preserve later edits.                                                                                            |
| Unknown dataset size and endpoint cost          | Run PERF-01/02 before activation; preserve API contract if internal query strategy changes.                                                                    |
| Proposed dependency/version availability        | Verify `d3-hierarchy` and any type package in the official registry before installation; declare direct dependencies rather than relying on transitive copies. |

Release inputs still to collect are the initial Category records and legacy mapping, the reviewed Uncategorized remainder, the localized homepage copy, and the recorded staging performance environment. These are finite content/rollout decisions; the statistical model, component boundary, and acceptance rules above do not depend on inventing live CMS data.

## Tag retirement (approved October 8, 2026)

The independent Tags collection is retired. Active Posts retain one Category and optional Series, without Tag relationships. This step does not introduce category nesting or a replacement entity. Historical raw Tag records, legacy Post relationships, and immutable migration journals remain in storage for recovery; they are not registered as live CMS resources.

The public map contract becomes `schemaVersion: 2`, `metric: "published-posts"`. Totals contain `publishedPostCount` and `areaValue`; both equal the number of unique published articles. Each category retains its ID, kind, label, optional color token, publishedPostCount, and areaValue, and contains `articles: Array<{ id: string; slug: string; title: string; value: 1 }>`. Published articles whose Category is missing or unpublished appear in a synthetic uncategorized branch without disclosing private category labels. Article bodies and draft data are never included.

The website renders Category -> Article, with category zoom inside the existing canvas and article leaves linking to canonical article routes. Root categories retain the standard pointer, restrained hover scaling, and click-to-expand behavior; no root-specific exception is applied. Remove the visible heading, description, metric explanation, data-table disclosure, and separate article panel. Retain an accessible region name. Show counts on tiles, pointer and restrained hover feedback on interactive nodes, keyboard access, and reduced-motion support. Category hierarchy is a subsequent change. Dense or skewed datasets may use compact category navigation within the canvas when proportional nested tiles cannot remain readable; entering a category restores its article view in a bounded scrolling canvas.

Implementation sequence:

- [x] Add count conservation and duplicate-ID fixtures to the Admin aggregation tests; remove all tag queries from the public map, retire topic-filtered article endpoints, and verify anonymous publication filters remain enforced.
- [x] Remove Tags registration, Post.tags, Tag MCP resources, tag publication validators, article badges, and website tag-fetch helpers. Regenerate Payload types using synthetic local configuration without loading environment files.
- [x] Adapt the website to the version-2 contract and generic Treemap interactions. Test article-safe URLs, category focus/reset, visible counts, and absent detail panels.
- [x] Preserve historical audit reads without registering an active Tag collection; test old Post and Tag snapshot/version hash compatibility. Keep migration writes disabled.
- [ ] Run both application suites and type checks, inspect UI in both locales/themes and compact layouts, review the diff, then deploy both applications and verify public counts and retired endpoints.

Validation commands use the existing bundled Node runtime directly: `node node_modules/vitest/vitest.mjs run` from each application and `node ../../node_modules/typescript/bin/tsc --noEmit --skipLibCheck`. No dependency changes or destructive database cleanup are required.
