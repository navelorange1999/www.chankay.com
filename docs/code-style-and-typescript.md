# Code Style and TypeScript

> Last Updated: March 12, 2026

## General Principles

1. Prefer clarity over cleverness.
2. Follow local codebase patterns before introducing new ones.
3. Preserve type safety.
4. Keep accessibility in scope.
5. Optimize for maintainability first, then micro-optimizations.

## File Naming

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Hooks: `useSomething.ts`
- Types: descriptive `PascalCase`
- Tests: source name with `.test.ts` or `.test.tsx`

## Prettier Configuration

```json
{
  "semi": false,
  "singleQuote": false,
  "tabWidth": 2,
  "useTabs": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always"
}
```

Key points:

- No semicolons
- Double quotes for strings
- Tabs for indentation
- 100 character line limit
- Parentheses around arrow-function parameters

## Import Order

```typescript
import * as React from "react"
import { useEffect, useState } from "react"

import Image from "next/image"
import Link from "next/link"

import { motion } from "motion/react"

import { Button } from "@repo/ui"

import type { UserProps } from "./types"
import { Header } from "./Header"
import { cn } from "@/utils/classnames"

import "./styles.css"
```

Recommended order:

1. React imports
2. Next.js imports
3. Third-party libraries
4. Internal workspace packages
5. Relative imports
6. Styles

## Type Safety Rules

1. Do not use `any` unless there is no practical alternative.
2. Prefer `unknown` over `any` when the type is truly unknown.
3. Export reusable types.
4. Use generics when they improve correctness and reuse.

## Type Definition Examples

```typescript
type ButtonVariant = "default" | "primary" | "secondary" | "destructive"
type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}
```

Avoid vague types:

```typescript
interface Props {
  type: string
  data: any
}
```

## Type-Only Imports

Use type-only imports when possible:

```typescript
import type { ReactNode } from "react"
import type { User, Post, SiteConfig } from "@repo/typescript-config/typings/payload-types"
```

Use regular imports only for runtime values:

```typescript
import { useState } from "react"
```

## Workspace Package Resolution

When an app consumes a local workspace package and needs stable editor types during active package
development, map the package root to its source entry in the app-level `tsconfig.json`.

Example:

```json
{
  "compilerOptions": {
    "paths": {
      "@repo/ui": ["../../packages/ui/src/index.ts"]
    }
  }
}
```

Keep the package's published `exports` and `types` fields pointing to built output. Use `paths`
only for app-local development ergonomics.

Do not map asset subpaths such as `@repo/ui/styles.css` unless the consuming runtime is meant to
process source assets directly.

## Payload CMS Types

Payload generated types live in:

```text
packages/typescript-config/typings/payload-types.ts
```

Import them like this:

```typescript
import type { Post, SiteConfig, User } from "@repo/typescript-config/typings/payload-types"
```
