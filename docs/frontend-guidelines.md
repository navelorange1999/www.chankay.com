# Frontend Guidelines

## Post Comments

Only the published post detail route renders comments. The stateless section lives
in `packages/ui`, while the Giscus client and CMS configuration resolution live in
`apps/www/src/components/posts` and `apps/www/src/utils/postComments.ts`.

Use the official `@giscus/react` component with lazy iframe loading. Its theme follows
the site's resolved theme and its interface language follows the active locale.
The iframe uses the light and dark stylesheets in `apps/www/public/giscus/` because
the host page's CSS cannot style its contents. Their colors are generated from
`packages/ui/src/tokens.css` by `pnpm --filter www generate:giscus-themes`; edit
the shared tokens, then regenerate the stylesheets rather than changing them by
hand. Website builds generate them, and `test:run` checks they are current. Giscus
loads the stylesheet from the current site origin, and `apps/www/next.config.js`
permits `https://giscus.app` to load those public stylesheets across origins.
Discussion mapping uses `specific`, the immutable term `post:<Payload document ID>`,
and strict matching. Never use the localized URL, title, or mutable slug as identity.
English and Chinese translations intentionally share one discussion. Preserve post
IDs when migrating CMS data to keep the discussion mapping intact.

Missing, disabled, or invalid configuration renders no comment section. Draft and
archived posts never render the embed. A server-rendered GitHub discussions link
remains available if the third-party widget cannot load. Keep the comments outside
the article reading-progress target and do not make a Giscus API call during page
generation. The discussion repository's `giscus.json` permits only production
website origins; explicitly authorize any additional preview origin before testing
comments there.

Article detail requests explicitly revalidate both the post and site configuration
after 60 seconds, even when the deployment's default Payload cache lifetime is
longer. This is a fallback when CMS push revalidation is unavailable. Next.js
refreshes stale entries on subsequent requests, so the first request after expiry
may still receive the previous state; this is not an immediate moderation control.

> Last Updated: March 12, 2026

## Animation Duration

HandWriting and Heatmap expose `duration` in seconds. It covers the complete animation,
including staggered starts and the final stroke or cell fade. HandWriting defaults to 5 seconds.
Heatmap renders immediately when duration is omitted. CMS fields require at least 0.1 seconds.
Use matching durations to align animation lengths; independently mounted components still start
when they mount and do not share a playback clock.

HandWriting scales its overlapping stroke timings to fit the duration and uses a timed tween.
Heatmap fills non-empty cells in chronological order, with the final fade ending at the duration;
empty dates and calendar padding do not consume animation time.

When deploying this change, run `20260928120000_animation_duration` using the admin migration
workflow before editors save existing pages with the new schema. It updates nested blocks in
pages and page versions, converting handwriting `speed` to `7.5 / speed` and copying heatmap
`display.animateFill` to `display.duration`. Existing durations are preserved, including a cleared
heatmap duration. The migration retains legacy values for rollback and can be rerun safely.

## Tailwind CSS Usage

Use the `cn()` utility for conditional classes:

```typescript
import { cn } from "@/utils/classnames"

<div
	className={cn(
		"base-class another-class",
		isActive && "active-class",
		variant === "primary" && "primary-class",
		className
	)}
/>
```

Avoid template literals for complex conditional class composition.

## Class Organization

Order classes by concern:

```typescript
className={cn(
	"flex items-center justify-between",
	"px-4 py-2 gap-2",
	"w-full h-10",
	"text-sm font-medium",
	"bg-white text-gray-900 border-gray-200",
	"rounded-lg shadow-sm",
	"hover:bg-gray-50 focus:ring-2",
	"dark:bg-gray-800 dark:text-white",
	"md:w-auto md:px-6",
	className
)}
```

## CSS Variables

Prefer theme variables where possible:

```text
--background
--foreground
--primary
--primary-foreground
--secondary
--secondary-foreground
--accent
--accent-foreground
--card
--card-foreground
--muted
--muted-foreground
--border
--input
--ring
```

Usage:

```typescript
<div className="bg-background text-foreground border-border" />
<div className="bg-primary text-primary-foreground" />
```

## Dark Mode

Use `dark:` variants when needed:

```typescript
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white" />
```

Theme switching is managed through `next-themes`.

## Responsive Design

Use a mobile-first approach:

```typescript
<div className="text-sm md:text-base lg:text-lg" />
```

Breakpoints:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1376px

## Data Fetching

### Server Components First

Prefer fetching data in Server Components:

```typescript
export default async function Page() {
	const posts = await fetch("http://localhost:3001/api/posts")
	const data = await posts.json()

	return <PostList posts={data} />
}
```

### Client Components

Use client-side fetching only when necessary:

```typescript
"use client"

import { useEffect, useState } from "react"

export function ClientComponent() {
	const [data, setData] = useState(null)

	useEffect(() => {
		fetch("/api/data")
			.then((response) => response.json())
			.then(setData)
	}, [])

	return <div>{data}</div>
}
```

### Payload CMS Access

Use the project Payload client utilities:

```typescript
import { payloadClient } from "@/utils/payloadClient"

const siteConfig = await payloadClient.getGlobal<SiteConfig>("site-config")
const posts = await payloadClient.getCollection("posts")
```

For current project structure and service boundaries, also read `apps/www/ARCHITECTURE.md`.

## Environment Variables

```typescript
const apiUrl = process.env.PAYLOAD_API_URL || "http://localhost:3001"
const publicKey = process.env.NEXT_PUBLIC_API_KEY
```

Only `NEXT_PUBLIC_*` variables are safe for client-side usage.

## Performance and Optimization

### Images

Always use `next/image` for site images:

```typescript
import Image from "next/image"

<Image
	src="/path/to/image.jpg"
	alt="Descriptive alt text"
	width={800}
	height={600}
	priority={false}
	placeholder="blur"
/>
```

### Fonts

Use Next.js font optimization:

```typescript
import { Geist, Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export default function Layout({ children }) {
	return (
		<html className={inter.className}>
			<body>{children}</body>
		</html>
	)
}
```

### Code Splitting

Use dynamic imports for heavy components:

```typescript
import dynamic from "next/dynamic"

const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
	loading: () => <div>Loading...</div>,
	ssr: false,
})
```

### Markdown and Mermaid

Keep Markdown parsing and syntax highlighting on the server when possible. If a Markdown surface
contains Mermaid diagrams, isolate only the Mermaid hydration in a small Client Component instead of
marking the entire Markdown renderer as client-only.

### Animations

Theme view transitions must synchronously commit React theme updates inside the
view-transition update callback before the browser captures the new view. Root
attribute observers should react to changes in the resolved light/dark value;
`next-themes` may write the same attributes again. Mermaid hydration follows this
rule to avoid duplicate SVG rendering during the reveal animation.

Reuse animation variants instead of inlining animation objects repeatedly:

```typescript
import { motion } from "motion/react"

const fadeIn = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -20 },
}

<motion.div variants={fadeIn} initial="initial" animate="animate" exit="exit" />
```

## Common Patterns

### Loading States

```typescript
export default function Page() {
	return (
		<Suspense fallback={<LoadingSkeleton />}>
			<AsyncComponent />
		</Suspense>
	)
}
```

### Error Handling

```typescript
"use client"

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	return (
		<div>
			<h2>Something went wrong!</h2>
			<button onClick={() => reset()}>Try again</button>
		</div>
	)
}
```

### Metadata

Published Category relationships determine Post section membership. Categories
with slugs `technical` and `trading` retain their existing localized section
URLs, archive descriptions, and metadata. Do not infer a section from `primaryTag`,
an unreadable relationship, or a missing Category. Other and uncategorized Posts
render at the existing localized `/posts/[slug]` route; this route redirects to
the section URL only when the Post has a readable published section Category.
The sitemap and canonical metadata use the same resolver.

Manage editorial metadata in Payload CMS. The homepage uses its localized
`pages.seo.metaTitle` as a complete title without the site's title suffix, and
`pages.seo.metaDescription` as its description. Other pages retain the site title
template. `site-config.siteName` is the brand name; `metaTitle` is only the default
SEO title and must not replace the brand name. Open Graph and Twitter metadata
reuse the page's localized title, description, and CMS-selected image.

Use `site-config.siteUrl` for the public canonical origin, matching the final
destination of domain redirects. Canonical links, language alternates, Open Graph
URLs, and the sitemap use that setting. `/robots.txt` is generated from CMS:
`robotsSettings.customRobotsTxt` replaces the default crawler rules when provided,
while sitemap directives are always replaced with the current Site URL. Default
rules exclude preview paths in every supported locale. `allowIndexing` controls
the HTML robots meta tag; crawler blocking is separate so crawlers can still read
`noindex`. Shared SEO setting changes invalidate every locale.

Homepage `WebSite` JSON-LD derives its identity from SiteConfig and its description
from the homepage SEO settings. The optional Site Author group contains a localized
public name and a shared public profile URL. An empty name omits the `Person`
object. Do not infer an author from CMS login accounts or fabricate profile details.
Serialize JSON-LD with HTML-safe escaping before embedding it. These settings do
not modify page-builder content or visible homepage design.

```typescript
export const metadata = {
  title: "Page Title",
  description: "Page description for SEO",
  openGraph: {
    title: "OG Title",
    description: "OG Description",
    images: ["/og-image.jpg"],
  },
}
```

### Page Transitions

```typescript
import { PageTransition } from "@repo/ui"

<PageTransition>{children}</PageTransition>
```

### Theme Toggle

```typescript
import { ThemeToggle } from "@repo/ui"

<ThemeToggle />
```

## Animation duration

Handwriting and heatmap blocks use `duration` in seconds for the complete animation. Handwriting defaults to five seconds; an empty heatmap duration displays immediately. The handwriting renderer scales the generated artifact timeline to the requested duration. Heatmap timing includes the final fade and ignores unfilled calendar cells. Both retain reduced-motion behavior.

The animation-duration migration populates handwriting duration from `7.5 / speed` and heatmap duration from `display.animateFill`, preserving legacy fields and existing explicit durations. It covers pages and stored page versions, including nested block slots. Equal durations align playback lengths; independently mounted blocks do not share a start clock.

## Page Alignment and Content Width

The shared `Container` owns page width and responsive horizontal gutters: a maximum
width of 80rem, with 1rem / 1.5rem / 2rem gutters at the base / sm / lg breakpoints.
Navbar, footer, and the locale layout use this same default. Nested containers
automatically have zero horizontal padding, including containers below Flex and Grid.
Do not add compensating padding to CMS blocks or require editors to remove containers.

Content blocks fill their parent by default. Sections own vertical spacing and backgrounds;
Grid and Flex own gaps; cards own internal padding. Topic maps and post indexes must not
set an independent page maximum width. Heatmap regions fill the available width while
calendar cells retain their size and overflow behavior. In vertical mode,
the heatmap uses its intrinsic width and centers the total, calendar, and legend as
one group when there is spare space; its width remains capped by the parent.

Use `Container size="reading"` for a reading column (48rem maximum). Article layouts
apply this within their existing table-of-contents grid. Standard lists use the full
page content width. `size="full"` means the width of the parent, not the viewport.
Legacy CMS `default`, `wide`, and `full` values remain supported without a data migration.
Full-bleed section backgrounds must be composed outside the page container and contain
a standard Container for their text; do not use viewport-width hacks inside nested blocks.
