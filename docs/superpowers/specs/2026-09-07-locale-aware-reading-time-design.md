# Locale-Aware Reading Time Design

## Problem

`Posts.readingTime` is currently persisted as one shared number. Its write hook splits Markdown on
whitespace and divides the result by 200. This works for English prose but treats long Chinese
sentences as single words. Updating another locale also overwrites the shared value, so every
locale displays the reading time calculated from whichever translation was saved last.

## Decision

Replace the persisted write-time estimate with a virtual number field computed in an `afterRead`
field hook. The hook receives the locale-resolved sibling `content`, so each request derives a
reading time from the exact translation being returned. Existing stored values can remain in the
database because the virtual result replaces them at read time; no data migration or backfill is
required.

Move Markdown normalization and estimation into a small typed utility so the algorithm can be
tested without constructing a Payload request.

## Estimation Rules

- Remove fenced code blocks, inline code, images, Markdown punctuation, and link destinations.
- Preserve visible link labels as readable prose.
- Count Han characters at 400 characters per minute.
- Count remaining whitespace-delimited words at 200 words per minute.
- Add both durations for mixed-language prose and round up to the next whole minute.
- Return zero for empty or formatting-only content and at least one minute for any readable text.

These rates are editorial defaults, not precise measurements of an individual reader.

## Payload Integration

Keep the public `readingTime` field name and numeric response shape unchanged so the frontend and
MCP contracts do not need changes. Mark the field `virtual: true`, keep it read-only in Admin, and
replace the `beforeChange` hook with `afterRead`. For normal locale-specific reads,
`siblingData.content` is the resolved Markdown string. Defensive handling of unexpected values
returns zero instead of selecting an arbitrary locale.

## Testing

Add focused unit tests that prove:

- 800 Han characters produce two minutes.
- 400 English words produce two minutes.
- Mixed Chinese and English contributions are added before rounding.
- Markdown links retain their visible labels while code and images are ignored.
- Empty or formatting-only Markdown returns zero.
- The Payload field is virtual and computes from the locale-resolved sibling content at read time.

Run the focused Admin tests, Admin type checking, and the relevant existing Post collection tests.

## Delivery

Ship the code change in the Admin application and deploy Admin before relying on the new behavior.
Because the value is computed during reads, the existing Chinese and English posts will show their
own estimates immediately after deployment without CMS writes.
