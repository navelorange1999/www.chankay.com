# Frontend Architecture

This document describes the data fetching architecture for `apps/www`.

## Architecture Overview

```
src/
├── app/                    # Next.js App Router
│   └── (frontend)/
│       └── page.tsx        # ✅ Page components, call services
│
├── services/              # Business logic layer
│   └── payload/
│       ├── index.ts       # Export all services
│       ├── pages.ts       # Page-related data fetching
│       └── posts.ts       # Post-related data fetching
│
├── utils/                 # Base utility layer
│   └── payloadClient.ts   # Low-level API client
│
└── components/            # UI components
    ├── Section.tsx
    ├── Navbar.tsx
    └── Footer.tsx
```

## Layer Description

### 1. Utils Layer - `payloadClient.ts`

**Responsibility**: Provide low-level methods for interacting with Payload CMS API

**Features**:

- Generic HTTP request wrapper
- Unified error handling
- Cache and revalidation configuration
- Type safety

**Main Methods**:

```typescript
payloadClient.getGlobal<T>(slug, options) // Get global data
payloadClient.getCollection<T>(collection, options) // Get collection data
payloadClient.getBySlug<T>(collection, slug, options) // Get single document by slug
```

### 2. Services Layer - `services/payload/`

**Responsibility**: Encapsulate data fetching logic for specific business scenarios

**Features**:

- Entity-specific (Page, Post, etc.)
- Contains business logic and default configuration
- Provides semantic API
- Unified error handling and fallback strategies

**Examples**:

```typescript
// services/payload/pages.ts
getHomePage() // Get homepage data
getPageBySlug(slug) // Get specific page
getAllPages() // Get all pages

// services/payload/posts.ts
getPosts(options) // Get post list
getPostBySlug(slug) // Get single post
getLatestPosts(limit) // Get latest posts
```

### 3. App Layer - `app/(frontend)/`

**Responsibility**: Page components responsible for rendering UI

**Features**:

- Server Components first
- Call services layer to fetch data
- Focus only on UI rendering logic

**Examples**:

```typescript
import { getHomePage } from "@/services/payload/pages"

export default async function HomePage() {
	const pageData = await getHomePage()
	return <Section sections={pageData.sections} />
}
```

## Why Not Use `/api` Routes?

In Next.js App Router:

- ✅ **Server Components fetch data directly** - Recommended approach, best performance
- ❌ **Fetching through `/api` routes** - Unnecessary network hop, adds latency

`/api` routes should only be used for:

- APIs needed by Client Components
- Webhooks
- Third-party service callbacks
- Form Actions (if not using Server Actions)

## Data Flow

```
Page Component
    ↓ (calls)
Services Layer (pages.ts, posts.ts)
    ↓ (calls)
PayloadClient (payloadClient.ts)
    ↓ (HTTP)
Payload CMS API
```

## Caching Strategy

All data fetching supports Next.js ISR (Incremental Static Regeneration):

```typescript
// Configure in PayloadClient
{
  next: {
    revalidate: 60,              // Revalidate after 60 seconds
    tags: ['page:home']          // Support on-demand revalidation
  }
}
```

Trigger revalidation with:

```typescript
import { revalidateTag } from "next/cache"

revalidateTag("page:home") // Revalidate homepage data
```

## Type Safety

All data fetching methods use Payload-generated types:

```typescript
import type { Page, Post } from "@repo/typescript-config/typings/payload-types"

export async function getHomePage(): Promise<Page | null> {
  // ...
}
```

## Extension Guide

### Adding New Data Sources

1. Create a new file in `services/payload/` (e.g., `categories.ts`)
2. Use `payloadClient` to implement specific data fetching methods
3. Export in `services/payload/index.ts`
4. Import and use in page components

**Example**:

```typescript
// services/payload/categories.ts
import { payloadClient } from "@/utils/payloadClient"
import type { Category } from "@repo/typescript-config/typings/payload-types"

export async function getAllCategories(): Promise<Category[]> {
  try {
    const result = await payloadClient.getCollection<Category>("categories", {
      limit: 100,
      revalidate: 3600,
      tags: ["categories"],
    })
    return result.docs
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}
```

### Adding New PayloadClient Methods

If you need more complex query logic, add new methods to the `PayloadClient` class:

```typescript
// utils/payloadClient.ts
export class PayloadClient {
  // ... existing methods

  async search<T>(collection: string, query: string, options?: PayloadQueryOptions): Promise<T[]> {
    // Implement search logic
  }
}
```

## Best Practices

1. **Maintain Single Responsibility**

   - Utils layer: HTTP requests only
   - Services layer: Business logic only
   - App layer: UI rendering only

2. **Error Handling**

   - Services layer should catch errors and return fallback data
   - Don't let errors bubble up to page components

3. **Type Safety**

   - Use Payload-generated types
   - Avoid using `any`

4. **Cache Configuration**

   - Set reasonable `revalidate` time based on data update frequency
   - Use `tags` for on-demand revalidation

5. **Composition Over Inheritance**
   - No need for complex class inheritance structures
   - Use function composition to reuse logic
