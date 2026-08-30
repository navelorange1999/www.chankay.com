# SiteConfig MCP Update Design

## Goal

Add a general-purpose `update_site_config` MCP tool that lets authorized MCP clients update the Payload `site-config` global for a supported locale.

## Scope

The tool updates SiteConfig business fields through Payload's normal global update API. It is not limited to translation fields and does not duplicate the SiteConfig schema inside the MCP layer.

The tool does not add deletion, migration execution, configuration editing, or media mutation capabilities.

## Tool Contract

The tool accepts:

- `locale`: a required locale code supported by `@repo/i18n`.
- `data`: a non-empty JSON object containing the SiteConfig patch.

Example:

```json
{
  "locale": "zh-CN",
  "data": {
    "navigation": {
      "menuItems": []
    }
  }
}
```

The handler validates the locale and patch shape before calling Payload. Payload remains responsible for field types, required values, nested structures, hooks, and schema validation.

## Data Flow

1. The MCP endpoint authenticates the API key and verifies that the key may call `update_site_config`.
2. The tool rejects unsupported locales and empty or non-object patches.
3. The handler obtains the configured Payload instance.
4. The handler calls `payload.updateGlobal` with `slug: "site-config"`, the requested locale, and the supplied patch.
5. Payload applies schema validation and existing SiteConfig hooks, including frontend revalidation.
6. The tool returns the requested locale and the updated SiteConfig document for immediate read-back verification.

## Security Boundaries

- Authentication and per-key custom-tool authorization remain owned by the Payload MCP plugin.
- Locale validation uses the shared supported-locale configuration.
- The tool accepts only a non-empty plain JSON object for `data`.
- The handler does not expose credentials, execute migrations, delete data, or bypass Payload schema validation.
- Existing collection and global access configuration remains unchanged.

## Error Handling

- Missing or unsupported locale: return a clear validation error before calling Payload.
- Missing, empty, array, or non-object `data`: return a clear validation error before calling Payload.
- Payload validation and hook failures: propagate the original failure to the MCP caller so no false success is reported.

## Testing

Use test-driven development for the tool handler:

- A valid locale and patch call `updateGlobal` with the expected slug, locale, and data.
- The result contains the locale and updated SiteConfig document.
- Unsupported locales are rejected without calling Payload.
- Empty and non-object patches are rejected without calling Payload.
- Payload errors propagate to the caller.
- The SiteConfig tool registry exposes both `get_site_config` and `update_site_config`.

Run the focused MCP tests, the complete admin test suite, the admin TypeScript check, and `git diff --check` before completion.
