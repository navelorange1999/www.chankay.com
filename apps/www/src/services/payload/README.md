# Payload Services

This directory contains all business logic related to Payload CMS data fetching.

## Usage Examples

### Using in Server Components

```typescript
// app/(frontend)/page.tsx
import { getHomePage } from "@/services/payload/pages"

export default async function HomePage() {
	const pageData = await getHomePage()

	if (!pageData) {
		return <div>Page not found</div>
	}

	return <Section sections={pageData.sections} />
}
```

### Fetching Post List

```typescript
// app/(frontend)/posts/page.tsx
import { getPosts } from "@/services/payload/posts"

export default async function PostsPage() {
	const { docs: posts, totalDocs } = await getPosts({
		limit: 10,
		page: 1,
	})

	return (
		<div>
			<h1>Posts ({totalDocs} total)</h1>
			{posts.map((post) => (
				<article key={post.id}>
					<h2>{post.title}</h2>
				</article>
			))}
		</div>
	)
}
```

### Fetching Single Post

```typescript
// app/(frontend)/posts/[slug]/page.tsx
import { getPostBySlug } from "@/services/payload/posts"
import { notFound } from "next/navigation"

export default async function PostPage({ params }: { params: { slug: string } }) {
	const post = await getPostBySlug(params.slug)

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
// app/(frontend)/posts/[slug]/page.tsx
import { getAllPages } from "@/services/payload/pages"

// Generate static routes for all pages
export async function generateStaticParams() {
  const pages = await getAllPages()

  return pages.map((page) => ({
    slug: page.slug,
  }))
}
```

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
