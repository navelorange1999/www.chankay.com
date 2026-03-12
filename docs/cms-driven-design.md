# CMS-Driven Design

> Last Updated: March 12, 2026

## Core Principle

Every user-facing component should be designed to be configurable through Payload CMS whenever practical.

That means:

- Content comes from the CMS, not hardcoded literals
- Styling options are modeled as CMS fields
- Layout variations are selectable in the admin
- Non-developers can update the site without code changes

## Component Design Checklist

When designing a component, ask:

1. What content does it display
2. What styling variations exist
3. What layout options are needed
4. What colors or themes apply
5. What sizes or spacing options are needed

Each answer should usually map to one or more CMS fields.

## Example: Hardcoded vs CMS-Configurable Hero

### Bad: Hardcoded Component

```typescript
export function Hero() {
	return (
		<section className="bg-blue-600 py-20">
			<h1 className="text-4xl font-bold text-white">Welcome to My Site</h1>
			<p className="text-lg text-white/90">I'm a developer who loves building things</p>
			<button className="bg-white px-6 py-3 text-blue-600 rounded-lg">Learn More</button>
		</section>
	)
}
```

### Good: CMS-Configurable Component

```typescript
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
			className={cn("relative", sizeClasses[size], alignmentClasses[alignment])}
			style={{
				backgroundColor: backgroundStyle === "solid" ? backgroundColor : undefined,
			}}
		>
			{backgroundStyle === "image" && backgroundImage && (
				<Image src={backgroundImage.url} alt="" fill className="object-cover" />
			)}
			<div className="relative container mx-auto px-4">
				<h1 className="mb-4 text-4xl font-bold md:text-6xl">{title}</h1>
				{subtitle && <p className="mb-8 text-lg opacity-90 md:text-xl">{subtitle}</p>}
				{buttons.length > 0 && (
					<div className="flex justify-center gap-4">
						{buttons.map((button, index) => (
							<Button key={index} variant={button.variant} href={button.href}>
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

## Example Payload Modeling

```typescript
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
              Field: ColorPickerField,
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

## CMS Field Patterns

### Layout and Spacing

```typescript
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
			options: [
				{ label: "None", value: "0" },
				{ label: "Small", value: "sm" },
				{ label: "Medium", value: "md" },
				{ label: "Large", value: "lg" },
			],
		},
	],
}

const spacingMap = {
	"0": "py-0",
	sm: "py-8",
	md: "py-16",
	lg: "py-24",
}
```

### Color and Theme

```typescript
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

### Content Variations

```typescript
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

### Typography

```typescript
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

## Page Builder Pattern

For maximum flexibility, prefer a page-builder approach:

```typescript
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
      ],
    },
  ],
}
```

## Rendering Pattern

```typescript
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

## Best Practices

### Do

1. Accept all content as props
2. Provide sensible defaults
3. Map CMS values to classes through lookup objects
4. Use conditional rendering based on CMS fields
5. Support theme modes and layout variants
6. Add descriptions to admin fields
7. Validate CMS field values

### Do Not

1. Hardcode user-facing content
2. Limit styling options without a reason
3. Assume a fixed layout
4. Ignore responsive behavior
5. Sacrifice accessibility for configurability
6. Overcomplicate the editorial model

## Reusable Styling Configuration Pattern

```typescript
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
```

## Validation Pattern

```typescript
{
	name: "backgroundColor",
	type: "text",
	validate: (value) => {
		if (!value) return true

		if (!/^#[0-9A-F]{6}$/i.test(value)) {
			return "Please enter a valid hex color (e.g., #FF5733)"
		}

		return true
	},
}
```

## Summary

The target is editor empowerment. Every design decision should answer this question:

Can this behavior be controlled from the CMS without lowering code quality?
