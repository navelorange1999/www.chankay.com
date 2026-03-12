# Frontend Guidelines

> Last Updated: March 12, 2026

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

### Animations

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
