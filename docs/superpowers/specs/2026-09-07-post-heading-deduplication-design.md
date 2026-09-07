# Post Heading Deduplication Design

## Problem

Post detail pages render the CMS `title` through the shared `PostTitle` component, which is hard-coded as an `h2`. The Markdown `content` is rendered independently and may begin with a matching level-one heading. When both fields contain the article title, the page shows the same title twice and produces an inverted heading hierarchy: `h2` followed by `h1`.

The Payload admin currently reinforces this mistake because the content placeholder starts with `# Write your post`. There is no validation preventing an `h1` in post body Markdown.

## Goals

- Render the canonical title as the single `h1` on a post detail page.
- Keep post titles as `h2` on the post index, where multiple cards share a page.
- Reject Markdown body content containing level-one headings so the title cannot be duplicated in new or edited posts.
- Clean the affected published post without changing unrelated fields or locales.
- Cover the heading semantics and validation with focused automated tests.

## Non-goals

- Automatically rewrite arbitrary Markdown during frontend rendering.
- Change heading levels below `h1`.
- Migrate every post without first identifying affected records.
- Refactor the broader Post component library.

## Design

### Semantic post title

Make `PostTitle` accept an explicit semantic element with `h2` as its default. The post index therefore keeps its current behavior. The shared `PostSectionArticle` detail component opts into `h1`, covering both technical and trading article routes while the legacy post route continues to redirect.

The component API remains narrow: only `h1` and `h2` are supported because those are the two established contexts. Styling remains unchanged and independent of the chosen element.

### Markdown body validation

Add a small pure validator for post Markdown content. It examines Markdown headings outside fenced code blocks and rejects any level-one heading. Raw HTML headings are not accepted as a bypass: an opening `<h1>` tag is rejected as well.

Attach the validator to the localized `content` field in the Posts collection. Preserve the existing required-field behavior and return a clear editor-facing message explaining that the post title is managed by the Title field and body sections must start at `##`.

Change the content placeholder from an `h1` example to an `h2` section example.

### Existing content repair

Read the target post from the intended Payload environment by a unique identifier. Confirm exactly one result, its locale, current title, and current leading Markdown before writing.

Patch only the affected locale's `content` field, removing the leading heading when it matches the canonical title. Preserve all other content and fields. Read the document back and verify that:

- the localized title is unchanged;
- the localized content no longer starts with or contains an `h1`;
- the remaining body begins with the original introductory content;
- publication state and unrelated fields are unchanged.

If the target environment, post identifier, or locale cannot be resolved uniquely, stop before mutation and request the missing information.

## Testing

Use test-driven development for each behavior:

1. A component test proves `PostTitle` defaults to `h2` and can render as `h1`.
2. Validator tests prove ordinary body content and `##` headings pass.
3. Validator tests prove ATX `#` headings, setext level-one headings, and raw `<h1>` headings fail.
4. Validator tests prove heading-like text inside fenced code blocks is ignored.
5. Existing type checks, lint, and relevant test suites remain green.

The CMS update is verified by a read-before-write/read-after-write comparison rather than an automated test against production data.

## Safety and rollout

- Do not inspect credential files or print authentication values.
- Use existing environment-variable-based Payload authentication.
- Perform no CMS write until the exact document, locale, and patch are reviewed.
- Make a narrowly scoped PATCH and verify the stored result immediately.
- The frontend change is backward compatible for post cards because `h2` remains the default.
