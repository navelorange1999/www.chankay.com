# `@chankay/site-shell`

Static Web Component shell for Chankay demo sites.

## What it provides

- `<chankay-site-shell>` custom element
- fixed Chankay navbar and footer for demo sites
- shared token stylesheet for host apps
- browser-ready registration entry for static sites

## Package outputs

- `dist/index.js`: programmatic API, including `mountSiteShell()`
- `dist/register.js`: browser entry that registers `<chankay-site-shell>`
- `dist/tokens.css`: shared token stylesheet for shell and host demos

## Installation

```bash
pnpm add @chankay/site-shell
```

## Integration workflow

### 1. Choose an integration mode

- static or plain HTML demos: load `dist/register.js` and `dist/tokens.css`
- bundled demos: install the package and use either the custom element or `mountSiteShell()`

Always pin an explicit version. Do not consume `latest` implicitly.

### 2. Reserve shell slots in the host demo

For the clearest layout control, reserve separate header and footer slots in the demo page:

```html
<div id="demo-shell-header"></div>
<main>...</main>
<div id="demo-shell-footer"></div>
```

You can also use a single element with `position="both"` when the host page does not need separate mounting points.

### 3. Static demo integration

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@chankay/site-shell@1.0.0/dist/tokens.css"
/>
<script type="module">
  import "https://cdn.jsdelivr.net/npm/@chankay/site-shell@1.0.0/dist/register.js"
</script>

<chankay-site-shell
  position="header"
  site-name="Bezier Playground"
  repo-url="https://github.com/chankay/bezier-demo"
></chankay-site-shell>
<main>...</main>
<chankay-site-shell position="footer"></chankay-site-shell>
```

### 4. Bundled demo integration

```ts
import "@chankay/site-shell/register"

import { mountSiteShell } from "@chankay/site-shell"

mountSiteShell({
  target: "#demo-shell-header",
  position: "header",
  siteName: "Bezier Playground",
  repoUrl: "https://github.com/chankay/bezier-demo",
})

mountSiteShell({
  target: "#demo-shell-footer",
  position: "footer",
})
```

### 5. Optional shared token usage

Import `@chankay/site-shell/tokens.css` into the host demo when you want host content to reuse the same palette and spacing baseline as the shell.

The published stylesheet is built from the shared token source in
`packages/ui/src/tokens.css`, then extended with `site-shell`-specific aliases.

## Public API

### Custom element attributes

- `site-name`: Optional demo label rendered next to the fixed Chankay brand.
- `repo-url`: Optional GitHub repository URL for the demo project.
- `position`: Optional section selector. Accepts `header`, `footer`, or `both`.

Behavior defaults:

- omitted `site-name`: hides the demo name label
- omitted `repo-url`: hides the GitHub icon action
- omitted `position`: defaults to `both`

### Programmatic API

```ts
import { mountSiteShell } from "@chankay/site-shell"
```

`mountSiteShell()` accepts:

- `target`: `Element` or CSS selector
- `position`: `header`, `footer`, or `both`
- `siteName`: optional demo label
- `repoUrl`: optional GitHub repository URL

## Development workflow

### Local preview

From the repository root:

```bash
pnpm run dev:site-shell
```

Then open `http://127.0.0.1:4310/dev/preview.html`.

- TypeScript changes rebuild automatically into `dist/`
- token changes from `packages/ui/src/tokens.css` and `src/tokens.aliases.css` rebuild `dist/tokens.css`
- Refresh the browser after edits to preview the latest output

### Common package commands

```bash
pnpm run dev:site-shell
pnpm --filter @chankay/site-shell build
pnpm --filter @chankay/site-shell check-types
pnpm --filter @chankay/site-shell test:run
pnpm --filter @chankay/site-shell preview:dev
pnpm --filter @chankay/site-shell preview
```

Use `preview` when you want a one-off local server without watch mode.

### Source layout

- `src/custom-element/`: custom element definition and registration
- `src/render/`: static navbar and footer markup and styles
- `src/tokens.aliases.css`: `site-shell`-specific CSS variable aliases
- `scripts/copy-tokens.mjs`: builds `dist/tokens.css` from the shared token source
- `dev/preview.html`: local preview host page

## Release workflow

### Versioning

- `patch`: bug fixes and non-breaking style corrections
- `minor`: additive attributes, additive tokens, or non-breaking behavior additions
- `major`: breaking attribute changes, breaking token changes, or breaking DOM/style contract changes

### Publishing

1. Update the package implementation and docs.
2. Validate locally:
   - `pnpm --filter @chankay/site-shell build`
   - `pnpm --filter @chankay/site-shell check-types`
   - `pnpm --filter @chankay/site-shell test:run`
3. Publish a GitHub Release with tag `site-shell-vX.Y.Z`.

The workflow in `.github/workflows/site-shell-release.yml` then:

- installs workspace dependencies
- builds `@chankay/site-shell`
- runs type checks and tests
- publishes `@chankay/site-shell` to public npm
- uploads browser assets to the GitHub Release

### Release artifacts

- npm package: `@chankay/site-shell`
- browser entry: `dist/register.js`
- token stylesheet: `dist/tokens.css`
- release archive: `site-shell-browser-assets.zip`
