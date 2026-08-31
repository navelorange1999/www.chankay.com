# Multilingual Polish Design

> Date: August 31, 2026
> Status: Approved for implementation planning

## Overview

The multilingual release is live, but several supporting paths still behave as if all locales share one runtime context. This change makes frontend revalidation locale-scoped, supplies localized accessibility copy through a React context, generates locale-aware Payload post previews, and removes release-only multilingual documentation that no longer represents the running system.

## Problems

1. Payload change hooks omit the active locale, so the www revalidation endpoint invalidates every locale after a locale-scoped edit.
2. Interactive shared UI components contain fixed English accessibility labels and have no common way to discover the active locale.
3. Payload post previews always use the unprefixed English route.
4. The multilingual architecture, rollout runbook, and release-readiness documents describe a completed release and leave stale routing links in `AGENTS.md` and the LLM translation proposal.
5. The root README does not concisely describe the current locale architecture and contains outdated stack prerequisites.

## Requirements

- A collection or global save for a supported locale must request revalidation only for that locale.
- Missing, `all`, or unsupported Payload locale values must retain the safe behavior of revalidating every supported locale.
- SiteConfig layout invalidation must target the resolved path for each requested locale instead of always invalidating the root layout globally.
- Client-side shared UI must read the active locale and typed UI strings from a React context.
- The context must default safely to English when a consumer is rendered without a provider, including Storybook and isolated tests.
- Server components must remain server-rendered when using context would require an unnecessary client boundary.
- Post preview URLs must use the current Payload locale, omit the default-locale prefix, and fall back to the default locale for invalid input.
- Completed multilingual release documents and all references to them must be removed.
- README and `AGENTS.md` must remain accurate and contain no broken links.

## Goals

- Reduce cache invalidation and regeneration work caused by locale-scoped CMS edits.
- Make navigation, theme, language, logo, and footer accessibility labels match the served locale.
- Make editorial previews open the locale being edited.
- Leave a smaller, durable documentation surface after the release.

## Non-Goals

- Changing multilingual URL rules, localized field storage, sitemap generation, or canonical host configuration.
- Moving server-rendered Navbar or Footer trees to client rendering solely to consume context.
- Adding a third-party internationalization library.
- Redesigning the translation workflow or changing editorial content.

## Considered Approaches

| Approach | Advantages | Disadvantages |
| --- | --- | --- |
| Prop-driven strings | Explicit data flow and no context dependency | Accessibility props must be threaded through several layers |
| Components call `getUiStrings` directly | Smallest immediate diff | Each component must receive or infer a locale and becomes coupled to catalog lookup |
| React locale context | One client-side source for locale and typed strings; scales to additional interactive controls | Requires a provider and a deliberate server-component exception |

React locale context is selected. The existing `@repo/i18n` catalog remains the source of string data.

## Architecture

### Locale context

`@repo/ui` will expose `LocaleProvider` and `useLocale`. The provider accepts a validated `SupportedLocale`, derives `UiStrings`, and provides both values. Its default context value uses `DEFAULT_LOCALE`, allowing Storybook and isolated consumers to render without a provider.

The locale layout will place `LocaleProvider` around the interactive UI tree. Client components such as `LanguageSwitcher`, `ThemeToggle`, and `NavbarMobileMenu` will read accessibility labels from the context. Existing component props that remain useful as explicit overrides may be retained for backwards compatibility.

Footer stays server-rendered. Its app wrapper already receives `currentLocale`, so it will resolve the footer accessibility strings on the server and pass serializable labels to the shared Footer. The fallback website logo will similarly receive a localized accessible name from the app wrapper.

### Locale-scoped revalidation

Payload hooks will normalize `req.locale` into either a single supported locale or no locale filter. They will include `locales` in the POST body only when a supported locale is known. The www endpoint already treats an omitted locale list as all supported locales, preserving a safe fallback.

The SiteConfig handler will resolve the locale-specific home path before calling `revalidatePath(..., "layout")`. Collection handlers will retain their existing locale-scoped paths and cache tags.

### Locale-aware post preview

A pure preview URL helper will validate the callback locale, build the unprefixed post path, and pass it through `resolveLocalizedPath`. The Payload preview callback will use its request locale and the existing public site URL configuration.

### Documentation cleanup

The following completed release documents will be deleted:

- `docs/proposals/multilingual-architecture.md`
- `docs/proposals/multilingual-rollout-runbook.md`
- `docs/superpowers/specs/2026-07-22-multilingual-release-readiness-design.md`
- `docs/superpowers/plans/2026-07-22-multilingual-release-readiness.md`

References in `AGENTS.md` and `docs/proposals/llm-translation-architecture.md` will be rewritten. README will gain a concise current-state multilingual section and will align its package map, Node requirement, and Payload version with repository configuration.

## Error Handling and Safety

- Unsupported locales never enter generated paths; they fall back to all-locale revalidation or the default-locale preview.
- Revalidation remains best-effort so CMS writes are not rolled back by a frontend outage.
- No environment values are logged or embedded in generated URLs beyond the already configured public site URL.
- Shared UI keeps English defaults so consumers outside the www locale layout do not throw.

## Testing

- Unit-test locale normalization and request bodies for collection and global revalidation hooks.
- Unit-test default, Chinese, and invalid-locale post preview URLs.
- Extend i18n catalog tests to require complete English and Chinese accessibility strings.
- Render client UI under English and Chinese locale providers and assert localized accessible names.
- Run focused admin, www, i18n, and UI type checks and tests, followed by the relevant workspace verification commands available under the installed Node runtime.

## Risks

| Risk | Mitigation |
| --- | --- |
| Payload supplies `locale: "all"` or omits locale | Treat it as an all-locale revalidation request and default-locale preview |
| A shared UI consumer lacks the provider | Use a stable English context default |
| Context causes broad hydration | Restrict context consumption to existing client components; keep Footer server-rendered |
| Deleted documents leave broken links | Search scoped documentation and source paths for every deleted filename before verification |

## Success Criteria

- A `zh-CN` CMS edit posts only `locales: ["zh-CN"]` and invalidates Chinese paths/tags.
- An English CMS edit posts only `locales: ["en"]` and invalidates English paths/tags.
- Unknown or all-locale edits still invalidate both supported locales.
- Chinese pages expose Chinese accessibility labels for the scoped controls.
- Post preview URLs match the editor locale.
- No repository documentation links to any deleted multilingual release document.
- Focused tests and type checks pass with a clean working tree except for the intended changes.

## Unresolved Questions

None. The user selected React locale context and approved the scope above.
