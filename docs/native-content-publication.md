# Native Publication for Content Collections

Status: implemented contract  
Updated: 2026-10-08  
Related feature: [Content Taxonomy and Topic Treemap](./content-topic-treemap.md)

> Cleanup implementation: active schemas and readers now use native publication and Category only.
> Production migration journals and public visibility/content parity were verified on October 8, 2026.
> The compatibility and write-tool steps below describe the previous migration release. This cleanup
> release exposes inventory, historical review, and verification only; all migration writes are retired.
> Retain raw values, versions, and journals for at least 30 days and use the reviewed compatible
> release if guarded data rollback becomes necessary. See `docs/deployment-and-environments.md`.

## Tag retirement follow-up

Tags are retired from the active content schema under the [current topic-map contract](./content-topic-treemap.md#tag-retirement-approved-october-8-2026). Native publication continues for Posts, Pages, Categories, Series, and Media. New Post publication validates Category and Series only. Topic statistics read published Posts and Categories. Tag-specific rules below describe the completed historical rollout, not a live resource. Retained Tag journals use an authenticated, exact-ID, read-only historical adapter; old migration writes remain disabled.

## 1. Decision and scope

Use Payload's native `_status` as the single publication state across **Posts, Pages, Tags, Series, Media, and the new Categories collection**. Enable native versions/drafts for these collections and remove custom publication fields after migration. This proposal supersedes the earlier Post-only scope.

Users is an authentication collection, not publishable content. Do not add user publication states or alter login/account access. Payload explicitly distinguishes user audit history from content draft workflows in its [versions guidance](https://payloadcms.com/docs/versions/overview). Site Config is a global and its publication lifecycle is outside this collection migration.

Business progress and processing results remain separate from publication. Rename `Series.status` to `Series.progress`; keep fields such as `previewStatus`, `ogGenerationStatus`, and translation-job status. Their values do not determine public visibility.

The production rollout on October 8, 2026 reconciled 8 Posts, 2 Pages, 17 Tags, and 21 Media records, and created 2 published bilingual Categories. Series had no records to migrate. All 50 migration journals verified before the subsequent homepage editorial change. Anonymous public ID sets and localized content hashes matched the baseline before enabling the topic map.

## 2. Historical baseline before rollout

| Collection | Current state                                                                                                                  | Target                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Posts      | Native drafts plus custom `status`: draft/published/archived. Public access checks only custom status.                         | Retain native drafts; remove custom status after reconciliation.                              |
| Pages      | Custom draft/published status; no versions/drafts; collection read access is unrestricted while website queries filter status. | Enable native drafts, enforce public access in the CMS, and replace website/tool filters.     |
| Tags       | No publication state; public reads.                                                                                            | Enable native drafts; public queries use published taxonomy.                                  |
| Series     | Public reads; custom status describes draft/in-progress/completed/on-hold.                                                     | Enable native drafts; migrate business state to `progress` independently.                     |
| Media      | Public reads; uploaded/generated assets; no publication state.                                                                 | Enable native drafts for media records; make asset creation and references publication-aware. |
| Categories | Proposed new collection.                                                                                                       | Use native drafts from its first release.                                                     |
| Users      | Authentication and account data.                                                                                               | Preserve the existing account lifecycle.                                                      |

Before rollout, the Post/Page MCP publishing tools wrote custom `status`. The former page preview service removed a website query filter without requesting an authenticated native draft read. Generated-media writers also omitted publication state. The rollout changed these consumers together with the schema.

Sources: [collections](../apps/admin/src/collections/index.ts), [Post tools](../apps/admin/src/plugins/mcp/post), [Page tools](../apps/admin/src/plugins/mcp/page), [page queries](../apps/www/src/services/payload/pages.ts), [preview route](<../apps/www/src/app/[locale]/(frontend)/%255Fpreview/[[...slug]]/page.tsx>), and [asset services](../apps/admin/src/services/pageAssets).

## 3. Shared lifecycle contract

Enable `versions.drafts` on each content collection. Keep the existing Post autosave configuration; enable Page autosave with the same 2-second interval. Taxonomy, Series, and Media start with explicit draft saves rather than autosave. Use `maxPerDoc: 10` initially, matching Posts, and retain the existing shared publication state across locales.

Payload stores `draft` and `published`. The admin's Changed indication means a published document has newer draft edits; it is not an additional stored enum. See the [native drafts contract](https://payloadcms.com/docs/versions/drafts).

| Operation                          | Behavior                                                                                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Create or save draft               | Explicit `_status: draft`; `draft: true` when saving incomplete content. New records default to draft.                                          |
| Edit a published document as draft | Save a newer draft version; leave the current public snapshot untouched.                                                                        |
| Publish                            | Select the intended version and explicitly set `_status: published` with a main-document write. Required fields and reference validation apply. |
| Unpublish                          | Set the main document to `_status: draft` with `draft: false`; invalidate public caches. Merely saving a draft version does not unpublish.      |
| Restore a version                  | Preserve explicit draft/publish intent and validate current relationships. Old custom status values must not determine visibility.              |

For Posts, keep `publishedAt`: populate it on the first successful publication if absent, retain it on republish, and never set it during draft autosave. Do not add this field to every collection without a product need.

### Public reads and authorized preview

- Normal public queries use `draft: false` and `_status = published`, enforced by collection access as well as explicit service query constraints. Local API calls enforce access with `overrideAccess: false`.
- Add version-read access rules so anonymous callers cannot inspect unpublished versions through version endpoints. Authentication for editing and publishing retains the existing policies.
- Do not treat missing `_status` as published after cutover. Backfill records before enabling the strict rule.
- Normal website services must not relax publication filtering merely because they run in development.
- Preview is an explicit authorized path using `draft: true` and `no-store`, separated from public rendering and shared caches. Verify caller authorization at both the website and CMS boundaries using the existing server-authenticated preview trust model; an `includeDraft` query flag alone grants no access.
- Add or extend a narrowly scoped CMS preview route for exact Page slug/locale and referenced content. Reuse server-only authentication, validate allowed parameters, and apply a preview-specific access policy. Do not forward a general privileged credential to browsers or permit arbitrary collection queries.
- Preview responses are non-indexable and never cached as public content. The public topic-map endpoint remains published-only even when called from preview or by an authenticated user.

### Series progress

Rename the business field to `progress` with values `planned`, `in-progress`, `completed`, and `on-hold`. Map legacy `draft` to `planned`, and copy the other values unchanged. Update admin columns and the `completedAt` condition to use `progress`.

Publication and progress are independent: a planned series may be publicly introduced, and a completed series may be unpublished. Do not map `completed` to published or `draft` to unpublished solely from the old progress field. The old collection was publicly readable for every progress value.

## 4. Relationships and generated assets

### Taxonomy and Series

Public relationship population must not reveal draft labels or draft edits to published metadata. Publishing a new Post requires a published Category and published selected Tags/Series; draft authors may reference draft records during editing and receive actionable validation on publish.

Withdrawing an already-referenced taxonomy record does not cascade-unpublish its Posts. Public readers instead follow these explicit fallbacks:

- Unpublished Category: the topic map uses Uncategorized.
- Unpublished Tag: omit that tag from the valid tag set; use Untagged if none remain.
- Unpublished Series: omit its public metadata while leaving the Post published. Series never affects topic-map counts.

Reverse Join visibility respects both the parent collection's access and related Post access. Editors retain authorized reverse usage inspection. Topic statistics explicitly query published Category and Tag snapshots, never raw labels from draft records.

### Media

`Media._status` governs the media record and CMS relationship visibility. The repository currently uses public Vercel Blob URLs: hiding a media record does not revoke an already-known blob URL or make the stored file private. Private-object storage and signed delivery are outside this migration; do not claim media drafts provide file confidentiality.

- Existing publicly readable media records are backfilled to published to preserve site images, logos, and generated assets.
- New uploads default to draft. Publishing content must validate its referenced media, including nested Page blocks and SEO image relationships. Show which dependency needs publication rather than silently publishing unrelated shared assets.
- A referenced Media record may be unpublished independently. Public rendering must omit its image/use the existing placeholder instead of producing broken markup; directly embedded external/blob URLs are outside CMS relationship enforcement.
- Page screenshot/OG generation must record the exact owning Page version and desired draft/public target. Draft-generated metadata must not overwrite a published Page or publish draft content through an image.
- When an authorized Page publication includes a newly generated asset owned by that exact version, the controlled publication path may publish that asset and then link it into the published snapshot. It must not publish other draft media. Use stable generation IDs and expected-version checks to reject stale asynchronous results.
- Update `pageAssets` create/update paths, capture operations, and their types/tests. Saving generation status to a draft must remain a draft write; generation status fields are not replaced by `_status`.
- The existing Site Config global must validate published media references on save. If referenced media is later withdrawn, its public renderer uses the same missing-media behavior.

## 5. Consumer and cache changes

| Area                     | Required work                                                                                                                                                                                                                       |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Collection configuration | Native drafts/version access, shared public read predicate, removal/rename of old fields, generated types.                                                                                                                          |
| Admin UI                 | Native draft/publish controls and `_status` columns; Series also displays `progress`.                                                                                                                                               |
| MCP tools                | Post/Page create and publish paths explicitly use native state and intended version; summaries return `_status`. Generic content mutation contracts and descriptions reflect drafts. Existing tool authentication remains enforced. |
| Website services         | Post/Page lists, detail reads, static params, sitemap, and metadata use published snapshots; preview opts into authenticated draft reads. Fully paginate list consumers when validating visibility parity.                          |
| Relationship helpers     | Accept inaccessible relationships without using raw draft documents or displaying stale hidden labels.                                                                                                                              |
| Assets and translation   | Internal writes preserve the target document/version state. Processing success must never imply publication.                                                                                                                        |
| Topic map                | Query published Posts, Categories, and Tags under public access; apply the defined fallback buckets.                                                                                                                                |

Use a public-change-aware revalidation helper. The existing early return for non-published `doc._status` must not skip unpublish transitions from a previously published record.

- Post publish/unpublish/delete: invalidate article/detail/list/sitemap and topic-map caches.
- Page publish/unpublish/delete: invalidate its route, page lists, sitemap, and metadata caches. Withdrawn pages return the normal not-found response.
- Category/Tag publish, unpublish, published edits, or delete: invalidate topic statistics and affected public Post metadata/list caches.
- Series publication or published metadata/progress changes: invalidate Post metadata/list caches, but not topic statistics.
- Media publication changes: invalidate dependent public content/shell/metadata caches. A broad content/layout invalidation is acceptable initially if dependency tracking is not yet available.
- Draft-only changes do not invalidate the public snapshot. Delete handling must not depend on `afterChange`.
- Deliver invalidation only after the CMS write commits. Payload collection/global `afterChange` hooks run before their enclosing transaction commits, so a synchronous request from the hook can allow the website to refill its cache from the old public snapshot. A durable post-commit delivery path with retries is required before activation; failed or rolled-back writes must not emit a successful public change.

No publication decision may be derived from a progress field, processing state, HTTP response status, or an authentication state.

## 6. Migration and rollout

### Inventory and compatibility

Audit the six content collections independently. Record IDs, intended public visibility, selected live snapshots, old status/progress values, relationships, and relevant version IDs. Do not log article bodies or credentials. Use an explicit dry run and expected-value checks to detect changes made during migration.

Deploy compatibility code that understands native fields and old data before switching public readers. New mutation paths use `_status`; old Post/Page readers may temporarily consume a one-way compatibility mirror derived from the main document's native state. Draft autosaves must not overwrite that mirror. This is temporary deployment support, not two authoritative states.

Enable strict native public access only after records are backfilled and parity checks pass. Existing caches must be invalidated as part of cutover.

During the compatibility window, keep legacy Post/Page `status` read-only and keep the old Series `status` hidden and read-only. Preserve their stored values for the inventory and rollback record; editors use native publishing controls and Series `progress`. Remove these fields only after the corresponding live values and versions have been reconciled.

### Mapping by collection

| Collection / legacy condition                     | Migration rule                                                                                                                                                   |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Post: custom published, native published          | Retain the live snapshot and newer drafts.                                                                                                                       |
| Post: custom published, native draft/missing      | Reconcile the already-exposed snapshot and publish only the approved snapshot natively; never auto-publish a newer draft.                                        |
| Post: custom draft/archived, native published     | Preserve hidden visibility by setting the main document to native draft before readers switch.                                                                   |
| Post: custom draft/archived, native draft/missing | Keep unpublished; normalize missing native state to draft. Preserve the former archive label in migration records.                                               |
| Page: custom published                            | Backfill the current published Page snapshot to native published, preserving blocks/SEO/media references.                                                        |
| Page: custom draft                                | Backfill to native draft; remove access through anonymous CMS reads while retaining authorized preview.                                                          |
| Existing Tags, Series, Media                      | Preserve their previously public metadata by backfilling current records to native published. Series progress is migrated separately, including planned records. |
| New Categories                                    | Migration-created approved categories are explicitly published; ordinary editor-created records default to draft.                                                |
| Missing/unknown legacy state                      | Require explicit reconciliation; do not guess publication from names, progress, or reference count.                                                              |

The parity target for Pages is intended production website visibility. The old unrestricted CMS Page API is not a reason to preserve anonymous access to draft Pages.

Backfill is idempotent and must account for version initialization when drafts are newly enabled. Confirm the native API can read/publish/restore the migrated snapshots; writing a raw `_status` field alone is not sufficient evidence. Preserve localized fields and document IDs. Do not rewrite or publish pending versions indiscriminately.

The read-only inventory records IDs, creation/update timestamps, legacy and native states, Series progress, and whether a newer draft version exists. A missing timestamp, conflicting progress value, or unverifiable/newer draft requires manual review before any publishing backfill. The inventory must not read or log article bodies.

Records created after the migration cutoff use native `_status` as their publication authority. For older Posts or Pages whose legacy state says draft while native state says published, a change at or after the cutoff requires review: it may be a deliberate native publication, so an automated conversion must not unpublish it.

Keep rollback records in approved operational storage for at least 30 days after cleanup. They must include the affected state, progress, snapshot/version references, and expected post-migration values; never store secrets in migration artifacts.

### Cutover order

1. Implement shared lifecycle/access, version-aware writers, Page preview authentication, and asset handling against isolated fixtures.
2. Add native drafts and compatibility readers/writers; run collection-specific backfill with the publication switch disabled.
3. Verify public-visible ID sets and content snapshots, preview behavior, published asset dependencies, and all acceptance criteria below.
4. Switch Post/Page/taxonomy/media public reads to native state, update tools, and invalidate caches. Activate the topic map only after this succeeds.
5. Remove custom Post/Page `status`, rename Series state to `progress`, remove compatibility mirrors, regenerate types, and confirm no consumer reads legacy fields.

Rollback restores compatible code and selective captured states only when current values still match migration outputs; conflicts require reconciliation. Do not delete new version collections, documents, media blobs, or later editorial changes as part of rollback. Authentication data is never migrated.

### Operational MCP execution

Deploy Admin with `CONTENT_PUBLICATION_MODE=compatibility` and an explicit ISO UTC `CONTENT_PUBLICATION_LEGACY_BEFORE` boundary while retaining the existing website release. Migration review, apply, Category creation, and rollback require compatibility mode; the supplied cutoff must match the deployed boundary. Inventory and journal verification remain available after cutover.

The operator must explicitly enable the six custom tools below in the existing MCP permission UI after deployment. Tool registration does not grant permission. Every handler also requires `req.user`; all Local API mutations use `overrideAccess: false` and the authenticated request. Transactions are mandatory: an adapter without transaction support is rejected before writes. Wait for collection/index initialization to finish before operating, and retry a transient transaction error only by reviewing a fresh plan.

1. Suspend editorial saves and autosaves for the migration window. Transactions and hashes detect stored changes and pending versions, but concurrent first-version insertion has no existing version row to serialize against. This operational freeze is required, particularly when initializing versions for previously unversioned collections.
2. Run `content_migration_inventory` for every content collection, paging through `totalPages` with at most 50 records per request. This returns metadata only. Review uses full localized records internally to hash content; neither review output nor journals include article bodies.
3. For each record, call `content_migration_review` with `collection`, `id`, `phase: "publication"`, and `legacyBefore`. Preserve the returned `planHash` and `expectedUpdatedAt`. Migrate Media, Tags, and Series first. A latest draft, malformed publication state, ambiguous legacy state, or changed snapshot stops execution; reconcile these records separately instead of publishing them automatically.
4. Call `content_migration_apply` with the exact reviewed inputs and hash. An exposed legacy Page or Post without native publication additionally requires `approveCurrentSnapshot: true`; this approves only the current stored snapshot. Apply checks the entire content and version hash again inside the transaction, performs a native Payload update, checks protected content and native version creation, and appends an immutable `content-migration-runs` journal. Page state-only changes suppress generated-asset regeneration with the reviewed timestamp guard. Missing schema defaults that would change protected fields cause rollback and require separate review.
5. Use `create_migration_category` with `slug: "technical" | "trading"`, explicit `nameEn`/`nameZh`, `publish: true`, and the same cutoff. Category creation is bilingual and transactional; matching existing published Categories are a no-op and conflicting content is rejected. The approved classification mapping is fixed: Tag `6a9a8cb31fd8dde63da92e17` maps to Category slug `technical`; Tag `6a9e55ea926cdf8d848318b3` maps to `trading`. Published Category IDs are resolved from those exact slugs, never inferred from labels.
6. Migrate Page/Post publication, then review and apply each published Post with `phase: "taxonomy"`. The bounded executor requires an unambiguous Category and rejects pending drafts. It preserves the legacy primary Tag, topical Tags, localized content, body, Series relationships, and publication state except for explicitly reviewed field changes. Existing conflicting Categories require editorial reconciliation.
7. Run `content_migration_verify` with each returned `runId`. Re-run review: completed records return an empty patch. Verify all intended public ID sets, native versions, localized snapshots, and dependencies before switching the website or enabling the chart. Keep the operational journal for at least 30 days after cleanup, then disable migration write permissions when the window closes.

Media publication-only migrations preserve the raw `url`, `thumbnailURL`, and `captureWaitForMs` values, including absence. Field hooks run after storage URL generation and retain the stored values only inside an authenticated migration transaction. Ordinary media edits retain normal storage/default behavior, and the executor still rejects any other protected-field change.

For selective data rollback, call `content_migration_rollback` with the immutable journal `runId` while compatibility mode remains active. It refuses any later content, timestamp, or version change; restores supported captured taxonomy relationships or former native states through Payload; verifies protected fields; and appends a compensating journal linked by `rollbackOf`. Restoring a legacy Post's captured null Category uses a narrowly scoped internal context only after journal guards pass, while normal authentication and relationship validation remain enforced.

Originally absent native status and migration-created Categories are additive changes. The tool does not remove them or delete versions. For these records, verification returns `rollbackStrategy: "compatible-code"` and `rollbackEligible: false`: disable the new website feature and restore the compatible application release while retaining initialized versions/Categories. Do not treat metadata verification as evidence that these additive changes were reversed. A later editorial edit always requires reconciliation rather than overwrite.

## 7. Acceptance contract

| ID        | Acceptance criterion                                                                                                                                        | Evidence                                                   |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| NATIVE-01 | Each of the six content collections exposes native draft/publish behavior; custom Post/Page status fields are removed after cleanup.                        | Schema/type review and admin smoke tests.                  |
| NATIVE-02 | Anonymous collection/version reads cannot reveal drafts; authenticated preview can read intended drafts without changing public output.                     | Access and version integration tests for every collection. |
| NATIVE-03 | Draft saves do not alter published snapshots; native publish/unpublish uses the intended version and refreshes public views.                                | Lifecycle integration tests for every collection.          |
| NATIVE-04 | Post `publishedAt` is populated only at first publication and survives republish.                                                                           | Hook/tool tests.                                           |
| NATIVE-05 | Series progress migrates without loss; changing `progress` does not publish/unpublish it.                                                                   | Mapping and independent-state tests.                       |
| NATIVE-06 | Public Page detail/list/sitemap/metadata exclude drafts. Authorized preview and screenshot capture work after CMS access becomes restrictive.               | Signed-out and authorized browser/API tests.               |
| NATIVE-07 | Draft Categories/Tags never leak labels into public articles or topic statistics; withdrawing referenced taxonomy produces the documented buckets.          | Relationship and aggregate fixtures.                       |
| NATIVE-08 | Uploaded/generated Media respects the record lifecycle; draft generation never overwrites live Page metadata, and stale capture jobs cannot publish assets. | Capture/processor version-race tests.                      |
| NATIVE-09 | Existing public assets remain displayed after backfill; inaccessible media produces a deliberate fallback. Public Blob URLs are not represented as private. | Asset migration and browser checks.                        |
| NATIVE-10 | Post/Page tools create drafts and publish the selected version using native state; tool outputs report `_status`; existing authorization remains enforced.  | Tool contract/access tests.                                |
| NATIVE-11 | Publish/unpublish/delete/metadata updates invalidate all affected public caches; pure draft edits leave public snapshots intact.                            | Collection-to-website invalidation tests.                  |
| NATIVE-12 | Every migration mapping is idempotent; intended public visibility and localized content are preserved, and no newer draft is silently published.            | Dry-run/second-run and snapshot comparisons.               |
| NATIVE-13 | Rollback preserves later edits and reports conflicts rather than overwriting them; no documents, versions, or blobs are deleted.                            | Rollback fixtures.                                         |
| NATIVE-14 | Users login/account operations and operational progress/generation fields keep their existing semantics.                                                    | Authentication regression and field-usage checks.          |

Run real Payload integration tests with isolated database fixtures, existing app unit suites, type generation/checks, and public/preview browser checks. UI build success alone does not establish publication correctness. Do not load real environment files in automated agent commands; follow repository operational controls.

## 8. Risks and release inputs

The principal risks are accidentally exposing legacy hidden content, publishing a newer draft while repairing state, making existing public media disappear during backfill, and breaking the preview/asset pipeline when anonymous access is tightened. The mapping tables, dual-boundary preview authorization, expected-version checks, and collection-by-collection acceptance tests are release requirements.

Before rollout, collect the actual record counts/legacy-state combinations and identify the operator-controlled migration/rollback storage. The decision to use native publication across content collections is settled; the data inventory determines the reviewed conversion set rather than changing that policy.
