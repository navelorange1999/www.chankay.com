# Component Guidelines

> Last Updated: March 12, 2026

## Component Location Strategy

### `packages/ui`: Stateless UI Components

Create components in `packages/ui` when they are:

- Purely presentational
- Reusable across multiple apps
- Stateless, or only contain local UI state
- Not tied to a specific API or business workflow

Examples:

```text
packages/ui/src/components/
├── Button/
├── Card/
├── Input/
├── Label/
└── ...
```

### `apps/www` or `apps/admin`: Application Components

Create components in app directories when they are:

- Data-aware
- App-specific
- Coupled to business logic or routing
- Layout and page composition components

Examples:

```text
apps/www/src/components/
├── sections/
├── Footer.tsx
└── Navbar.tsx
```

## Decision Flow

```text
Is the component purely UI without data or business logic?
├─ Yes → packages/ui
└─ No → Is it reusable across apps?
   ├─ Yes → packages/ui with props
   └─ No → apps/[app-name]/src/components
```

## Recommended Component Structure

```typescript
import * as React from "react"
import { cn } from "#utils/classnames"

export interface ComponentProps extends React.ComponentProps<"div"> {
	variant?: "default" | "primary" | "secondary"
	size?: "sm" | "md" | "lg"
}

export function Component({
	variant = "default",
	size = "md",
	className,
	children,
	...props
}: ComponentProps) {
	const [state, setState] = React.useState(false)

	const isActive = variant === "primary"

	const handleClick = () => {
		setState((current) => !current)
	}

	return (
		<div
			className={cn(
				"base-classes",
				variant === "primary" && "primary-classes",
				size === "lg" && "large-classes",
				className
			)}
			{...props}
		>
			{children}
		</div>
	)
}
```

## Server vs Client Components

Default to Server Components unless you need:

- Browser APIs such as `window` or `localStorage`
- Event handlers
- React client hooks such as `useState` or `useEffect`
- Libraries that require the browser at render time

Server example:

```typescript
export default function Page() {
	return <div>Server rendered content</div>
}
```

Client example:

```typescript
"use client"

export function InteractiveButton() {
	const [count, setCount] = useState(0)

	return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

## Compound Components

For more complex UI, prefer the compound pattern:

```typescript
function Card({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="card" className={cn("base-styles", className)} {...props} />
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="card-header" className={cn("header-styles", className)} {...props} />
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="card-content" className={cn("content-styles", className)} {...props} />
}

export { Card, CardContent, CardHeader }
```

## Props Guidelines

1. Extend native HTML props when possible.
2. Prefer optional props with defaults.
3. Destructure explicit props and spread the rest.
4. Use `data-*` attributes for styling hooks.
5. Keep CMS-facing components configurable through props.

Examples:

```typescript
interface ButtonProps extends React.ComponentProps<"button"> {
	variant?: "primary" | "secondary"
}

function Component({ className, children, ...props }: ButtonProps) {
	return <button className={className} {...props}>{children}</button>
}
```

CMS-oriented props:

```typescript
interface HeroProps {
  title: string
  subtitle?: string
  theme: "light" | "dark" | "primary"
  size: "sm" | "md" | "lg"
}
```

Avoid hardcoded content inside components that should be CMS-driven.
