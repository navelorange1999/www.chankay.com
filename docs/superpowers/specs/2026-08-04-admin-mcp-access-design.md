# Admin MCP Access Design

## Goal

Allow authorized Payload MCP keys to perform full CRUD operations on editorial collections needed for multilingual content work, while keeping media assets read-only.

## Design

Add an `adminMcpAccess` capability object beside `readOnlyMcpAccess` in `apps/admin/src/plugins/mcp/collections.ts`. It enables `find`, `create`, `update`, and `delete`.

Apply `adminMcpAccess` to:

- `posts`
- `pages`
- `tags`
- `series`

Keep `media` on `readOnlyMcpAccess`. The Payload MCP API-key collection continues to control which enabled tools an individual key may use, so exposing these operations does not remove MCP authentication or per-key capability controls.

## Safety Boundaries

- Do not change Payload collection access-control functions.
- Do not enable write or delete access for `media`.
- Do not add migration execution or configuration-editing tools.
- Do not modify MCP authentication or expose credentials.

## Verification

Add a focused unit test that asserts:

- `posts`, `pages`, `tags`, and `series` receive all four CRUD capabilities.
- `media` remains read-only.
- The access objects are immutable literals so capability values remain boolean literals accepted by the Payload MCP plugin configuration.

Run the focused test and the admin TypeScript check.
