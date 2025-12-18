# Claude AI Code Generation Guidelines

> **Project**: www.chankay.com - Personal Website & Blog Platform
> **Last Updated**: November 25, 2025
> **Architecture**: TurboRepo Monorepo with Next.js 15, Payload CMS 3, React 19

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Structure](#architecture--structure)
3. [Technology Stack](#technology-stack)
4. [CMS-Driven Design](#cms-driven-design)
5. [Code Style & Conventions](#code-style--conventions)
6. [Component Guidelines](#component-guidelines)
7. [TypeScript Guidelines](#typescript-guidelines)
8. [Styling Guidelines](#styling-guidelines)
9. [State Management & Data Fetching](#state-management--data-fetching)
10. [Performance & Optimization](#performance--optimization)
11. [Testing Guidelines](#testing-guidelines)
12. [Common Patterns](#common-patterns)

---

## Project Overview

This is a **personal website and technical blog** built with modern web technologies in a monorepo architecture. The project consists of three main applications:

- **www** (`apps/www`): Public-facing Next.js website
- **admin** (`apps/admin`): Payload CMS admin panel
- **storybook** (`apps/storybook`): Component documentation

### Key Goals

- Fast, modern, and accessible user experience
- Type-safe development with TypeScript
- Reusable component library
- **CMS-driven design** - All content and styling configurable via Payload CMS
- Dark/Light theme support
- Responsive design for all devices

### Design Philosophy

**⚠️ CRITICAL PRINCIPLES**

#### 0. English-Only Communication

**All technical content must be written in English:**

- ✅ Code comments
- ✅ Documentation files (README, ARCHITECTURE, etc.)
- ✅ Commit messages
- ✅ Function/variable names
- ✅ Type definitions and interfaces
- ✅ Error messages and logs
- ✅ API documentation
- ❌ No Chinese or other languages in technical content

**Rationale**: Ensures consistency, international collaboration, and better tooling support.

#### 1. CMS-First Design Principle

All components must be designed with Payload CMS configurability in mind:

1. **Content should be CMS-managed** - Text, images, links, etc.
2. **Styling options should be CMS-configurable** - Colors, spacing, layouts
3. **Component variants should map to CMS fields** - Dropdown selections, toggles
4. **No hardcoded content** - Everything comes from CMS or props

This ensures non-technical users can modify the entire website without touching code.

#### 2. UI Component Structure Principle

**Create stateless UI components in `packages/ui` first:**

1. **Stateless components go in `packages/ui`** - Reusable across www and admin
2. **Stateful/app-specific components go in apps** - Page components, data fetching
3. **Think bottom-up** - Build base UI components before app-specific logic
4. **Maximum reusability** - UI components should work in any context

**Example workflow:**

```
Step 1: Create Button in packages/ui
Step 2: Create Card in packages/ui
Step 3: Create HeroSection in apps/www that uses Button and Card
Step 4: HeroSection fetches data from CMS and passes to UI components
```

#### 3. No Summary Documents

**DO NOT create summary or documentation files after completing tasks:**

- ❌ No `*_SUMMARY.md` files
- ❌ No `*_IMPLEMENTATION.md` files
- ❌ No `COMPLETED.md` or similar
- ✅ Update README if needed
- ✅ Add inline code comments for complex logic (in English)
- ✅ Update CLAUDE.md for new patterns/conventions (in English)

---

## Architecture & Structure

### Monorepo Structure

```
www.chankay.com/
├── apps/
│   ├── www/          # Public website (Next.js 15)
│   ├── admin/        # CMS admin panel (Next.js + Payload)
│   └── storybook/    # Component documentation
├── packages/
│   ├── ui/           # Shared UI component library
│   ├── typescript-config/  # Shared TypeScript configurations
│   ├── eslint-config/      # Shared ESLint configurations
│   └── tailwind-config/    # Shared Tailwind configurations
```

### Package Manager

- **MUST USE**: `pnpm` (version 10.13.1+)
- **Workspace Protocol**: All internal packages use `workspace:*`
- **Installation**: Always run `pnpm install` from the root

### Build System

- **Tool**: TurboRepo
- **Commands**:
  - `pnpm dev` - Start all apps in development mode
  - `pnpm dev:www` - Start only www app
  - `pnpm dev:admin` - Start only admin app
  - `pnpm build` - Build all apps
  - `pnpm lint` - Lint all code
  - `pnpm check-types` - Run TypeScript checks

---

## Technology Stack

### Core Technologies

| Technology       | Version | Purpose                      |
| ---------------- | ------- | ---------------------------- |
| **React**        | 19.1.0  | UI library                   |
| **Next.js**      | 15.3.5+ | React framework (App Router) |
| **TypeScript**   | 5.8.2+  | Type safety                  |
| **Payload CMS**  | 3.46.0+ | Headless CMS                 |
| **MongoDB**      | Latest  | Database (via Mongoose)      |
| **Tailwind CSS** | 4.1.11+ | Styling framework            |

### UI Libraries

- **Radix UI** - Accessible component primitives
- **Framer Motion** (12.23.9+) - Animations
- **Lucide React** - Icons
- **next-themes** - Theme management

### Development Tools

- **TurboRepo** (2.5.4+) - Monorepo build system
- **ESLint** (9.30.0+) - Linting
- **Prettier** (3.3.3) - Code formatting
- **Vitest** - Testing framework
- **Commitizen** - Conventional commits

---

## CMS-Driven Design

### Core Principle

**Every component must be designed to be fully configurable through Payload CMS.**

This means:

- ✅ Content comes from CMS, not hardcoded
- ✅ Styling options are CMS fields
- ✅ Layout variations are selectable in admin
- ✅ Non-developers can modify everything

### Component Design Pattern

When designing a component, always ask:

1. **What content does it display?** → CMS field
2. **What styling variations exist?** → CMS select/radio field
3. **What layout options are needed?** → CMS field
4. **What colors/themes apply?** → CMS color picker
5. **What sizes/spacing options?** → CMS select field

### Example: CMS-Configurable Hero Component

#### ❌ Bad: Hardcoded Component

```typescript
// DON'T DO THIS
export function Hero() {
	return (
		<section className="bg-blue-600 py-20">
			<h1 className="text-4xl font-bold text-white">
				Welcome to My Site
			</h1>
			<p className="text-lg text-white/90">
				I'm a developer who loves building things
			</p>
			<button className="bg-white text-blue-600 px-6 py-3 rounded-lg">
				Learn More
			</button>
		</section>
	)
}
```

#### ✅ Good: CMS-Configurable Component

```typescript
// Component accepts props from CMS
interface HeroProps {
	title: string
	subtitle?: string
	backgroundStyle: "gradient" | "solid" | "image"
	backgroundColor?: string
	backgroundImage?: Media
	alignment: "left" | "center" | "right"
	size: "sm" | "md" | "lg"
	buttons?: Array<{
		label: string
		href: string
		variant: "primary" | "secondary"
	}>
}

export function Hero({
	title,
	subtitle,
	backgroundStyle = "solid",
	backgroundColor = "#3b82f6",
	backgroundImage,
	alignment = "center",
	size = "md",
	buttons = [],
}: HeroProps) {
	const sizeClasses = {
		sm: "py-12",
		md: "py-20",
		lg: "py-32",
	}

	const alignmentClasses = {
		left: "text-left",
		center: "text-center",
		right: "text-right",
	}

	return (
		<section
			className={cn(
				"relative",
				sizeClasses[size],
				alignmentClasses[alignment]
			)}
			style={{
				backgroundColor: backgroundStyle === "solid" ? backgroundColor : undefined,
			}}
		>
			{backgroundStyle === "image" && backgroundImage && (
				<Image
					src={backgroundImage.url}
					alt=""
					fill
					className="object-cover"
				/>
			)}
			<div className="relative container mx-auto px-4">
				<h1 className="text-4xl md:text-6xl font-bold mb-4">
					{title}
				</h1>
				{subtitle && (
					<p className="text-lg md:text-xl mb-8 opacity-90">
						{subtitle}
					</p>
				)}
				{buttons.length > 0 && (
					<div className="flex gap-4 justify-center">
						{buttons.map((button, index) => (
							<Button
								key={index}
								variant={button.variant}
								href={button.href}
							>
								{button.label}
							</Button>
						))}
					</div>
				)}
			</div>
		</section>
	)
}
```

#### Corresponding Payload CMS Collection

```typescript
// apps/admin/src/collections/Sections.ts
import type { CollectionConfig } from "payload"

export const Sections: CollectionConfig = {
  slug: "sections",
  admin: {
    useAsTitle: "title",
  },
  fields: [
    {
      name: "type",
      type: "select",
      required: true,
      options: [
        { label: "Hero", value: "hero" },
        { label: "Features", value: "features" },
        { label: "Content", value: "content" },
      ],
    },
    {
      name: "hero",
      type: "group",
      admin: {
        condition: (data) => data.type === "hero",
      },
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "subtitle",
          type: "textarea",
        },
        {
          name: "backgroundStyle",
          type: "radio",
          required: true,
          defaultValue: "solid",
          options: [
            { label: "Solid Color", value: "solid" },
            { label: "Gradient", value: "gradient" },
            { label: "Image", value: "image" },
          ],
        },
        {
          name: "backgroundColor",
          type: "text",
          admin: {
            condition: (data) => data.hero?.backgroundStyle === "solid",
            components: {
              Field: ColorPickerField, // Custom color picker
            },
          },
        },
        {
          name: "backgroundImage",
          type: "upload",
          relationTo: "media",
          admin: {
            condition: (data) => data.hero?.backgroundStyle === "image",
          },
        },
        {
          name: "alignment",
          type: "radio",
          defaultValue: "center",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
        },
        {
          name: "size",
          type: "radio",
          defaultValue: "md",
          options: [
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
          ],
        },
        {
          name: "buttons",
          type: "array",
          maxRows: 3,
          fields: [
            {
              name: "label",
              type: "text",
              required: true,
            },
            {
              name: "href",
              type: "text",
              required: true,
            },
            {
              name: "variant",
              type: "radio",
              defaultValue: "primary",
              options: [
                { label: "Primary", value: "primary" },
                { label: "Secondary", value: "secondary" },
              ],
            },
          ],
        },
      ],
    },
  ],
}
```

### CMS Field Patterns

#### 1. Layout & Spacing

```typescript
// In Payload CMS
{
	name: "spacing",
	type: "group",
	fields: [
		{
			name: "paddingTop",
			type: "select",
			options: [
				{ label: "None", value: "0" },
				{ label: "Small", value: "sm" },
				{ label: "Medium", value: "md" },
				{ label: "Large", value: "lg" },
			],
		},
		{
			name: "paddingBottom",
			type: "select",
			options: [/* same as above */],
		},
	],
}

// In Component
const spacingMap = {
	"0": "py-0",
	"sm": "py-8",
	"md": "py-16",
	"lg": "py-24",
}
```

#### 2. Color & Theme

```typescript
// In Payload CMS
{
	name: "theme",
	type: "radio",
	options: [
		{ label: "Light", value: "light" },
		{ label: "Dark", value: "dark" },
		{ label: "Primary", value: "primary" },
		{ label: "Custom", value: "custom" },
	],
},
{
	name: "customColors",
	type: "group",
	admin: {
		condition: (data) => data.theme === "custom",
	},
	fields: [
		{
			name: "backgroundColor",
			type: "text",
			admin: {
				components: {
					Field: ColorPickerField,
				},
			},
		},
		{
			name: "textColor",
			type: "text",
			admin: {
				components: {
					Field: ColorPickerField,
				},
			},
		},
	],
}
```

#### 3. Content Variations

```typescript
// In Payload CMS
{
	name: "contentLayout",
	type: "radio",
	options: [
		{ label: "Single Column", value: "single" },
		{ label: "Two Columns", value: "two" },
		{ label: "Three Columns", value: "three" },
		{ label: "Grid", value: "grid" },
	],
},
{
	name: "items",
	type: "array",
	fields: [
		{
			name: "title",
			type: "text",
		},
		{
			name: "content",
			type: "richText",
		},
		{
			name: "image",
			type: "upload",
			relationTo: "media",
		},
	],
}
```

#### 4. Typography

```typescript
// In Payload CMS
{
	name: "typography",
	type: "group",
	fields: [
		{
			name: "headingSize",
			type: "select",
			options: [
				{ label: "Extra Small", value: "xs" },
				{ label: "Small", value: "sm" },
				{ label: "Medium", value: "md" },
				{ label: "Large", value: "lg" },
				{ label: "Extra Large", value: "xl" },
			],
		},
		{
			name: "fontWeight",
			type: "select",
			options: [
				{ label: "Normal", value: "normal" },
				{ label: "Medium", value: "medium" },
				{ label: "Semibold", value: "semibold" },
				{ label: "Bold", value: "bold" },
			],
		},
	],
}
```

### Page Builder Pattern

For maximum flexibility, use a page builder approach:

```typescript
// apps/admin/src/collections/Pages.ts
export const Pages: CollectionConfig = {
  slug: "pages",
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "sections",
      type: "array",
      label: "Page Sections",
      fields: [
        {
          name: "sectionType",
          type: "select",
          required: true,
          options: [
            { label: "Hero", value: "hero" },
            { label: "Features", value: "features" },
            { label: "Content", value: "content" },
            { label: "Gallery", value: "gallery" },
            { label: "Call to Action", value: "cta" },
            { label: "Testimonials", value: "testimonials" },
          ],
        },
        // Each section type has its own configuration
        {
          name: "hero",
          type: "group",
          admin: {
            condition: (data, siblingData) => siblingData.sectionType === "hero",
          },
          fields: [
            /* hero fields */
          ],
        },
        {
          name: "features",
          type: "group",
          admin: {
            condition: (data, siblingData) => siblingData.sectionType === "features",
          },
          fields: [
            /* features fields */
          ],
        },
        // ... more section types
      ],
    },
  ],
}
```

### Component Rendering from CMS

```typescript
// apps/www/src/components/SectionRenderer.tsx
import { Hero } from "./sections/Hero"
import { Features } from "./sections/Features"
import { Content } from "./sections/Content"

interface SectionRendererProps {
	sections: Array<{
		sectionType: string
		[key: string]: any
	}>
}

export function SectionRenderer({ sections }: SectionRendererProps) {
	return (
		<>
			{sections.map((section, index) => {
				switch (section.sectionType) {
					case "hero":
						return <Hero key={index} {...section.hero} />
					case "features":
						return <Features key={index} {...section.features} />
					case "content":
						return <Content key={index} {...section.content} />
					default:
						return null
				}
			})}
		</>
	)
}
```

### Best Practices for CMS-Driven Components

#### ✅ DO

1. **Accept all content as props** - Never hardcode text/images
2. **Provide sensible defaults** - Make optional props with defaults
3. **Map CMS values to classes** - Use lookup objects for consistency
4. **Use conditional rendering** - Show/hide based on CMS fields
5. **Support all theme modes** - Light, dark, and custom themes
6. **Make layouts flexible** - Grid, flex, columns all configurable
7. **Add preview helpers** - Help CMS users visualize changes
8. **Document field purposes** - Add helpful descriptions in CMS

#### ❌ DON'T

1. **Hardcode content** - Everything should come from CMS or props
2. **Limit styling options** - Provide comprehensive configuration
3. **Use fixed layouts** - Make layouts configurable
4. **Ignore responsive design** - All settings should work on mobile
5. **Forget accessibility** - Maintain a11y regardless of CMS config
6. **Overcomplicate** - Keep CMS fields intuitive for non-developers

### Styling Configuration Pattern

```typescript
// Create reusable style maps
export const styleConfig = {
	spacing: {
		none: "p-0",
		sm: "p-4 md:p-6",
		md: "p-6 md:p-12",
		lg: "p-12 md:p-24",
	},
	borderRadius: {
		none: "rounded-none",
		sm: "rounded-sm",
		md: "rounded-md",
		lg: "rounded-lg",
		full: "rounded-full",
	},
	shadows: {
		none: "shadow-none",
		sm: "shadow-sm",
		md: "shadow-md",
		lg: "shadow-lg",
	},
}

// Use in components
<div className={cn(
	styleConfig.spacing[spacing],
	styleConfig.borderRadius[borderRadius],
	styleConfig.shadows[shadow]
)} />
```

### CMS Field Validation

Always add validation to ensure CMS data is valid:

```typescript
{
	name: "backgroundColor",
	type: "text",
	validate: (value) => {
		if (!value) return true
		// Validate hex color
		if (!/^#[0-9A-F]{6}$/i.test(value)) {
			return "Please enter a valid hex color (e.g., #FF5733)"
		}
		return true
	},
}
```

### Summary

**Remember**: The goal is to empower content editors to control the entire website without developer intervention. Every design decision should consider: "Can this be configured in the CMS?"

---

## Code Style & Conventions

### General Principles

1. **Clarity over cleverness** - Write code that's easy to understand
2. **Consistency** - Follow existing patterns in the codebase
3. **Type safety** - Always provide proper TypeScript types
4. **Accessibility** - Ensure all components are accessible
5. **Performance** - Optimize for speed and efficiency

### File Naming

- **Components**: PascalCase (e.g., `Button.tsx`, `NavBar.tsx`)
- **Utilities**: camelCase (e.g., `classnames.ts`, `formatDate.ts`)
- **Hooks**: camelCase with `use` prefix (e.g., `useTheme.ts`)
- **Types**: PascalCase with descriptive names (e.g., `UserProfile.ts`)
- **Tests**: Same as source with `.test.ts(x)` suffix

### Prettier Configuration

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

**Key Points**:

- ❌ NO semicolons
- ✅ Double quotes for strings
- ✅ Tabs for indentation
- ✅ 100 character line limit
- ✅ Always use parentheses around arrow function parameters

### Import Order

```typescript
// 1. React imports
import * as React from "react"
import { useState, useEffect } from "react"

// 2. Next.js imports
import Link from "next/link"
import Image from "next/image"

// 3. Third-party libraries
import { motion } from "motion/react"

// 4. Internal packages
import { Button } from "@repo/ui"

// 5. Relative imports (types first, then components, then utils)
import type { UserProps } from "./types"
import { Header } from "./Header"
import { cn } from "@/utils/classnames"

// 6. Styles
import "./styles.css"
```

---

## Component Guidelines

### Component Location Strategy

**⚠️ IMPORTANT: Where to Create Components**

#### packages/ui - Stateless UI Components

Create components in `packages/ui` when they are:

- ✅ **Purely presentational** - No data fetching, no business logic
- ✅ **Reusable** - Can be used in multiple apps (www, admin, storybook)
- ✅ **Stateless or self-contained state** - Only internal UI state (like open/closed)
- ✅ **Generic** - Not tied to specific data structures or APIs

**Examples:**

```
packages/ui/src/components/
├── Button/
├── Card/
├── Input/
├── Badge/
├── Dialog/
├── Tabs/
└── ...
```

#### apps/www or apps/admin - Application Components

Create components in app directories when they are:

- ✅ **Data-aware** - Fetch data from APIs or CMS
- ✅ **App-specific** - Only used in one application
- ✅ **Business logic** - Contain domain-specific functionality
- ✅ **Layout/Page components** - Page structure and composition

**Examples:**

```
apps/www/src/components/
├── sections/        # Page sections that use data
│   ├── HeroSection.tsx
│   └── (other sections as needed)
├── Footer.tsx       # App-specific footer
└── Navbar.tsx       # App-specific navbar
```

#### Decision Flow

```
Is the component purely UI without data/business logic?
├─ YES → packages/ui
└─ NO → Is it reusable across apps?
    ├─ YES → packages/ui (with props for data)
    └─ NO → apps/[app-name]/src/components
```

### Component Structure

**Always use this structure for components:**

```typescript
import * as React from "react"
import { cn } from "../../utils/classnames"

// 1. Type definitions
export interface ComponentProps extends React.ComponentProps<"div"> {
	variant?: "default" | "primary" | "secondary"
	size?: "sm" | "md" | "lg"
	// ... other props
}

// 2. Component definition
export function Component({
	variant = "default",
	size = "md",
	className,
	children,
	...props
}: ComponentProps) {
	// 3. Hooks (if any)
	const [state, setState] = React.useState(false)

	// 4. Derived values
	const isActive = variant === "primary"

	// 5. Event handlers
	const handleClick = () => {
		// handler logic
	}

	// 6. JSX
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

### Client vs Server Components

**Default to Server Components** unless you need:

- Browser APIs (localStorage, window, etc.)
- Event handlers (onClick, onChange, etc.)
- React hooks (useState, useEffect, etc.)
- next-themes or other client-only libraries

```typescript
// Server Component (default)
export default function Page() {
	return <div>Server rendered content</div>
}

// Client Component (explicit)
"use client"

export function InteractiveButton() {
	const [count, setCount] = useState(0)
	return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### Compound Components Pattern

For complex components, use the compound pattern:

```typescript
// Card.tsx
function Card({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="card" className={cn("base-styles", className)} {...props} />
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="card-header" className={cn("header-styles", className)} {...props} />
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="card-content" className={cn("content-styles", className)} {...props} />
}

export { Card, CardHeader, CardContent }

// Usage
<Card>
	<CardHeader>Title</CardHeader>
	<CardContent>Content</CardContent>
</Card>
```

### Props Guidelines

1. **Extend HTML elements** when possible:

   ```typescript
   interface ButtonProps extends React.ComponentProps<"button"> {
     variant?: "primary" | "secondary"
   }
   ```

2. **Use optional props with defaults**:

   ```typescript
   function Component({ size = "md", variant = "default" }: ComponentProps) {}
   ```

3. **Destructure and spread remaining props**:

   ```typescript
   function Component({ className, children, ...props }: ComponentProps) {
     return <div {...props}>{children}</div>
   }
   ```

4. **Use data attributes for styling hooks**:

   ```typescript
   <div data-slot="card-header" data-state={isOpen ? "open" : "closed"}>
   ```

5. **Design for CMS configurability**:

   ```typescript
   // ✅ Good - Accepts CMS data as props
   interface HeroProps {
     title: string
     subtitle?: string
     theme: "light" | "dark" | "primary"
     size: "sm" | "md" | "lg"
   }

   // ❌ Bad - Hardcoded content
   function Hero() {
     return <h1>Welcome to My Site</h1>
   }
   ```

---

## TypeScript Guidelines

### Type Safety Rules

1. **NEVER use `any`** - Use `unknown` if you truly don't know the type
2. **Prefer `type` for props** - More flexible than `interface`
3. **Export all types** - Make types reusable
4. **Use generics** when appropriate

### Type Definitions

```typescript
// ✅ Good - Descriptive and specific
type ButtonVariant = "default" | "primary" | "secondary" | "destructive"
type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

// ❌ Bad - Too generic
interface Props {
  type: string
  data: any
}
```

### Type Imports

```typescript
// Use type-only imports when possible
import type { User } from "@repo/typescript-config/typings/payload-types"
import type { ReactNode } from "react"

// Regular imports for values
import { useState } from "react"
```

### Payload CMS Types

All Payload types are auto-generated in:

```
packages/typescript-config/typings/payload-types.ts
```

**Import them like this:**

```typescript
import type { User, Post, SiteConfig } from "@repo/typescript-config/typings/payload-types"
```

---

## Styling Guidelines

### Tailwind CSS Usage

**Use the `cn()` utility for conditional classes:**

```typescript
import { cn } from "@/utils/classnames"

// ✅ Good
<div className={cn(
	"base-class another-class",
	isActive && "active-class",
	variant === "primary" && "primary-class",
	className
)} />

// ❌ Bad - Don't use template literals
<div className={`base-class ${isActive ? "active" : ""} ${className}`} />
```

### Class Organization

Order classes by category:

```typescript
className={cn(
	// 1. Layout
	"flex items-center justify-between",
	// 2. Spacing
	"px-4 py-2 gap-2",
	// 3. Sizing
	"w-full h-10",
	// 4. Typography
	"text-sm font-medium",
	// 5. Colors
	"bg-white text-gray-900 border-gray-200",
	// 6. Effects
	"rounded-lg shadow-sm",
	// 7. States
	"hover:bg-gray-50 focus:ring-2",
	// 8. Dark mode
	"dark:bg-gray-800 dark:text-white",
	// 9. Responsive
	"md:w-auto md:px-6",
	// 10. Custom classes
	className
)}
```

### CSS Variables

Use CSS variables from the theme:

```css
/* Available in tailwind.config.js */
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

**Usage:**

```typescript
<div className="bg-background text-foreground border-border" />
<div className="bg-primary text-primary-foreground" />
```

### Dark Mode

```typescript
// Use dark: prefix for dark mode styles
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white" />

// Theme is managed by next-themes
// See apps/www/src/app/(frontend)/layout.tsx
```

### Responsive Design

**Mobile-first approach:**

```typescript
<div className={cn(
	"text-sm",      // Mobile (default)
	"md:text-base", // Tablet (768px+)
	"lg:text-lg"    // Desktop (1024px+)
)} />
```

**Breakpoints:**

- `sm`: 40rem (640px)
- `md`: 48rem (768px)
- `lg`: 64rem (1024px)
- `xl`: 80rem (1280px)
- `2xl`: 86rem (1376px)

---

## State Management & Data Fetching

### Server Components (Preferred)

```typescript
// ✅ Fetch data in Server Components
export default async function Page() {
	const posts = await fetch('http://localhost:3001/api/posts')
	const data = await posts.json()

	return <PostList posts={data} />
}
```

### Client Components

```typescript
"use client"

import { useState, useEffect } from "react"

export function ClientComponent() {
	const [data, setData] = useState(null)

	useEffect(() => {
		fetch('/api/data')
			.then(res => res.json())
			.then(setData)
	}, [])

	return <div>{data}</div>
}
```

### Payload CMS API

```typescript
// Use the PayloadClient utility
import { payloadClient } from "@/utils/payloadClient"

// Get global data
const navbar = await payloadClient.getGlobal<NavbarInterface>("navbar")

// Get collection data (implement as needed)
const posts = await payloadClient.getCollection("posts")
```

### Environment Variables

```typescript
// Access environment variables
const apiUrl = process.env.PAYLOAD_API_URL || "http://localhost:3001"

// In Next.js, prefix with NEXT_PUBLIC_ for client-side access
const publicKey = process.env.NEXT_PUBLIC_API_KEY
```

---

## Performance & Optimization

### Images

**Always use Next.js Image component:**

```typescript
import Image from "next/image"

<Image
	src="/path/to/image.jpg"
	alt="Descriptive alt text"
	width={800}
	height={600}
	priority={false} // Only for above-the-fold images
	placeholder="blur" // Optional blur-up effect
/>
```

### Fonts

```typescript
// Use Next.js font optimization
import { Inter, Geist } from "next/font/google"

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

```typescript
// Use dynamic imports for heavy components
import dynamic from "next/dynamic"

const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
	loading: () => <div>Loading...</div>,
	ssr: false // Disable SSR if needed
})
```

### Animations

**Use Motion efficiently:**

```typescript
import { motion } from "motion/react"

// ✅ Good - Reuse animation variants
const fadeIn = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -20 }
}

<motion.div variants={fadeIn} initial="initial" animate="animate" exit="exit">
	Content
</motion.div>

// ❌ Bad - Inline animation objects
<motion.div
	initial={{ opacity: 0 }}
	animate={{ opacity: 1 }}
	exit={{ opacity: 0 }}
/>
```

---

## Testing Guidelines

### Vitest Configuration

Tests are configured in `apps/admin` using Vitest.

```typescript
// Example test file
import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { Component } from "./Component"

describe("Component", () => {
	it("renders correctly", () => {
		const { getByText } = render(<Component />)
		expect(getByText("Expected text")).toBeInTheDocument()
	})
})
```

### Test Commands

```bash
pnpm test        # Run tests in watch mode
pnpm test:run    # Run tests once
pnpm test:ui     # Open Vitest UI (admin only)
```

---

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
// error.tsx in app directory
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

### Metadata (SEO)

```typescript
// In Server Components or layout.tsx
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

<PageTransition>
	{children}
</PageTransition>
```

### Theme Toggle

```typescript
import { ThemeToggle } from "@repo/ui"

// Renders a button to toggle between light/dark themes
<ThemeToggle />
```

---

## Payload CMS Patterns

### Collection Structure

```typescript
import type { CollectionConfig } from "payload"

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    useAsTitle: "title",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "content",
      type: "richText",
    },
  ],
  timestamps: true,
}
```

### Global Structure

```typescript
import type { GlobalConfig } from "payload"

export const SiteConfig: GlobalConfig = {
  slug: "site-config",
  typescript: {
    interface: "SiteConfig",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "siteName",
      type: "text",
      required: true,
    },
  ],
}
```

---

## Git Commit Guidelines

Use **Commitizen** for conventional commits:

```bash
pnpm cz
```

**Commit format:**

```
type(scope): subject

body

footer
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

---

## Best Practices Summary

### ✅ DO

- **Create stateless UI in packages/ui first** - Build reusable components
- **Design for CMS first** - Make all content and styling configurable
- **Accept props for everything** - No hardcoded content or styles
- Use Server Components by default
- Implement proper TypeScript types
- Follow the established file structure
- Use the `cn()` utility for conditional classes
- Optimize images with Next.js Image
- Write accessible, semantic HTML
- **Provide CMS field options** - Layouts, colors, spacing, etc.
- Add proper error handling
- Document complex logic with inline comments
- Test critical functionality

### ❌ DON'T

- **Put stateful components in packages/ui** - Keep it for pure UI only
- **Create summary documents** - No SUMMARY.md or IMPLEMENTATION.md files
- **Hardcode content** - Everything must come from CMS or props
- **Limit styling options** - Provide comprehensive CMS configuration
- Use `any` type
- Mix tabs and spaces
- Use inline styles
- Ignore TypeScript errors
- Skip accessibility features
- Hardcode environment variables
- Import from node_modules directly in components
- Use class components (use functional components)
- Ignore Prettier formatting

---

## Quick Reference

### Common Commands

```bash
# Development
pnpm dev                # Start all apps
pnpm dev:www            # Start www only
pnpm dev:admin          # Start admin only

# Build
pnpm build              # Build all apps

# Quality
pnpm lint               # Lint all code
pnpm check-types        # TypeScript checks
pnpm format             # Format all files

# Testing
pnpm test               # Run tests
pnpm test:run           # Run tests once

# CMS
pnpm gen                # Generate Payload types
```

### File Locations

- **UI Components**: `packages/ui/src/components/`
- **Payload Collections**: `apps/admin/src/collections/`
- **Payload Globals**: `apps/admin/src/globals/`
- **Frontend Pages**: `apps/www/src/app/(frontend)/`
- **API Routes**: `apps/www/src/app/api/`
- **Types**: `packages/typescript-config/typings/`

---

## Contact & Contribution

When generating code for this project:

1. **Read this guide first**
2. **Check existing patterns** in the codebase
3. **Follow the conventions** outlined here
4. **Ask for clarification** if unsure
5. **Test your changes** before committing

**Remember**: Consistency and maintainability are more important than cleverness.

---

_This guide is a living document. Update it as the project evolves._
