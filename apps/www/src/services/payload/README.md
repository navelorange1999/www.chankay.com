# Payload Services

This directory contains all business logic related to Payload CMS data fetching.

## Usage Examples

### Using in Server Components

```typescript
// app/(frontend)/page.tsx
import { getHomePage } from "@/services/payload/pages"
import { Nodes } from "@/components/Nodes"

export default async function HomePage() {
	const pageData = await getHomePage()

	if (!pageData) {
		return <div>Page not found</div>
	}

	return <Nodes nodes={pageData.structure} />
}
```

### Fetching a Section Post Archive

```typescript
// app/(frontend)/technical/page.tsx
import { getPostsBySection } from "@/services/payload/posts"

export default async function TechnicalPage() {
	const posts = await getPostsBySection("technical")

	return (
		<div>
			<h1>Technical</h1>
			{posts.map((post) => (
				<article key={post.id}>
					<h2>{post.title}</h2>
				</article>
			))}
		</div>
	)
}
```

### Fetching a Section Post Detail

```typescript
// app/(frontend)/trading/[slug]/page.tsx
import { getPostBySlugForSection } from "@/services/payload/posts"
import { notFound } from "next/navigation"

export default async function TradingPostPage({ params }: { params: { slug: string } }) {
	const post = await getPostBySlugForSection(params.slug, "trading")

	if (!post) {
		notFound()
	}

	return (
		<article>
			<h1>{post.title}</h1>
			{/* Render post content */}
		</article>
	)
}
```

### Generating Static Routes

```typescript
// components/posts/PostSectionArticle.tsx
import { getPostsBySection } from "@/services/payload/posts"

// Generate static routes for all pages
export async function buildPostSectionStaticParams(section: "technical" | "trading") {
  const posts = await getPostsBySection(section)

  return posts.map((post) => ({
    slug: post.slug,
  }))
}
```

The `technical` and `trading` routes share their archive and article components. Legacy
`/posts` and `/posts/[slug]` modules are redirect-only compatibility routes and should
not render archives or article details.

### Using in Client Components

If you need to fetch data on the client side (not recommended unless necessary):

1. Create an API route:

```typescript
// app/api/posts/route.ts
import { getPosts } from "@/services/payload/posts"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get("page")) || 1
  const limit = Number(searchParams.get("limit")) || 10

  const data = await getPosts({ page, limit })

  return NextResponse.json(data)
}
```

2. Call from client:

```typescript
"use client"

import { useState, useEffect } from "react"

export function ClientPosts() {
	const [posts, setPosts] = useState([])

	useEffect(() => {
		fetch("/api/posts?page=1&limit=10")
			.then((res) => res.json())
			.then((data) => setPosts(data.docs))
	}, [])

	return (
		<div>
			{posts.map((post) => (
				<div key={post.id}>{post.title}</div>
			))}
		</div>
	)
}
```

## Adding New Services

### Steps

1. Create a new file in this directory (e.g., `categories.ts`)
2. Import `payloadClient` and related types
3. Implement data fetching functions
4. Export in `index.ts`

### Template

```typescript
// services/payload/yourEntity.ts
import { payloadClient } from "@/utils/payloadClient"
import type { YourEntity } from "@repo/typescript-config/typings/payload-types"

/**
 * Get all YourEntity items
 */
export async function getAllYourEntities(): Promise<YourEntity[]> {
  try {
    const result = await payloadClient.getCollection<YourEntity>("your-entities", {
      limit: 100,
      revalidate: 3600,
      tags: ["your-entities"],
    })

    return result.docs
  } catch (error) {
    console.error("Error fetching your entities:", error)
    return []
  }
}

/**
 * Get a single YourEntity by slug
 */
export async function getYourEntityBySlug(slug: string): Promise<YourEntity | null> {
  try {
    return await payloadClient.getBySlug<YourEntity>("your-entities", slug, {
      depth: 2,
      revalidate: 60,
      tags: [`your-entity:${slug}`],
    })
  } catch (error) {
    console.error(`Error fetching your entity ${slug}:`, error)
    return null
  }
}
```

Then export in `index.ts`:

```typescript
// services/payload/index.ts
export * from "./pages"
export * from "./posts"
export * from "./yourEntity" // New export
```

## Best Practices

1. **Always Handle Errors** - All functions should catch errors and return fallback data
2. **Use Types** - Import and use Payload-generated types
3. **Configure Caching** - Set reasonable revalidate time based on data update frequency
4. **Use Tags** - Add tags to data for on-demand revalidation support
5. **Server First** - Prefer fetching data in Server Components
