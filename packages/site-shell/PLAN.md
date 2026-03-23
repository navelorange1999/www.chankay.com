# Static `site-shell` V1 Plan

## Summary

Build a minimal `@chankay/site-shell` v1 as a purely static Web Component plus one shared CSS token file. Do not integrate CMS, config API, React SDK, or Module Federation.

The component renders a fixed navbar and fixed footer for demo subdomains. Shared brand links are hardcoded in the package. Each demo provides only its own `site_name` and GitHub repository URL through HTML attributes. The shell removes theme switching and shows a GitHub icon link instead.

## Key Changes

### 1. Deliverables

Create one package: `@chankay/site-shell`

Expose:

- custom element: `<chankay-site-shell>`
- token stylesheet: a shared CSS variables file for demos to import
- optional browser bundle that registers the custom element

No runtime fetches. No external config dependency.

### 2. Web Component behavior

`<chankay-site-shell>` renders:

- fixed navbar
  - brand logo: fixed to main-site brand logo
  - links: fixed `Posts` and `Demos`
  - `site_name`: provided by demo via attribute
  - GitHub icon: links to the demo project repository via attribute
- fixed footer
  - fixed layout and fixed styling
  - brand/logo/main-site links remain static
  - no demo-specific footer configuration in v1

Recommended attributes:

- `site-name`
- `repo-url`
- `position="header" | "footer" | "both"`

Defaults:

- `position="both"`
- empty `site-name` renders no site-name text
- missing `repo-url` hides the GitHub action

### 3. Styling and tokens

Ship one shared CSS variables file from `site-shell` and make demos import it directly.

Purpose:

- keep shell colors consistent across all demos
- let demos optionally consume the same token variables for their own page styling
- avoid forcing Tailwind integration

Rules:

- token file contains only the minimum color, surface, border, and text variables needed for visual consistency
- Web Component uses the same variables internally
- footer styles are fixed in v1
- shell renders with isolated component styles while tokens remain globally consumable by host demos

### 4. Internal package structure

Keep one package with lightweight internal separation:

- `tokens/`
  - shared CSS variables source
- `render/`
  - navbar and footer markup generation
- `custom-element/`
  - element definition and attribute handling
- `assets/`
  - logo and icon assets if needed

Do not add config parsing, remote data loading, schema versioning, or adapter layers in v1.

## Test Plan

- component renders fixed navbar and footer with no runtime fetch
- `site-name` shows correctly and can be omitted safely
- `repo-url` shows a working GitHub icon link and hides cleanly when absent
- fixed `Posts` and `Demos` links always point to the intended main-site URLs
- token CSS file can be imported by a demo page and variables resolve correctly
- shell remains visually stable when host page has its own CSS or Tailwind
- `position="header"` and `position="footer"` render only the requested section

## Release Process

- `site-shell` is versioned independently from `www` and `admin`
- publishing `site-shell` does not require a `www` or `admin` release
- production app release tags remain unchanged and continue using `admin-v*` and `www-v*`

Release trigger:

- create and publish a GitHub Release with tag prefix `site-shell-v*`
- example tag: `site-shell-v1.0.1`

Release workflow responsibilities:

- add a dedicated workflow file for package publishing, for example `.github/workflows/site-shell-release.yml`
- install workspace dependencies with `pnpm`
- build only `@chankay/site-shell`
- run `check-types` and test commands scoped to `@chankay/site-shell`
- publish the package to public npm
- attach browser assets to the GitHub Release

Published artifacts:

- npm package: `@chankay/site-shell`
- browser module entry: `dist/register.js`
- shared token stylesheet: `dist/tokens.css`
- GitHub Release asset archive: `site-shell-browser-assets.zip`

Consumer guidance:

- demos with a bundler install `@chankay/site-shell` from npm
- pure static demos load `dist/register.js` and `dist/tokens.css` from a versioned npm CDN path
- demos should pin an explicit package or asset version and must not follow `latest` implicitly

Versioning rules:

- patch: bug fixes and non-breaking style corrections
- minor: additive attributes, additive tokens, or non-breaking behavior additions
- major: breaking attribute changes, breaking token changes, artifact path changes, or breaking DOM and style contract changes

## Assumptions and Defaults

- v1 is intentionally static and not CMS-driven
- main-site brand logo URL and `Posts` and `Demos` URLs are hardcoded in the package
- `site_name` is demo-specific and is passed by attribute, not fetched
- GitHub repository URL is demo-specific and is passed by attribute
- theme toggle is removed entirely in v1
- footer content and layout are fixed and not configurable in v1
