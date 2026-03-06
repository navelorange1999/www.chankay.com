import type { Meta, StoryObj } from "@storybook/react-vite"
import { Markdown } from "@repo/ui"

const placeholderImage = `data:image/svg+xml,${encodeURIComponent(
	`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="640" viewBox="0 0 1200 640">
	<rect width="1200" height="640" fill="#e8f5ec" />
	<rect x="72" y="72" width="1056" height="496" rx="28" fill="#d2e8d8" />
	<circle cx="210" cy="188" r="54" fill="#81c995" />
	<rect x="312" y="148" width="456" height="34" rx="17" fill="#4a7c59" />
	<rect x="312" y="206" width="592" height="24" rx="12" fill="#5f8f6f" />
	<rect x="312" y="248" width="520" height="24" rx="12" fill="#5f8f6f" />
	<rect x="120" y="336" width="960" height="120" rx="20" fill="#f7fbf8" />
	<rect x="160" y="374" width="380" height="22" rx="11" fill="#759f83" />
	<rect x="160" y="414" width="690" height="20" rx="10" fill="#98b9a2" />
</svg>
`.trim()
)}`

const fullCoverageMarkdown = `
# Markdown Surface

This story is designed to cover the full rendering surface of the component: **typography**, _inline emphasis_, ~~strikethrough~~, [links](https://example.com), and \`inline code\`.

---

## Headings

### Level 3 heading

#### Level 4 heading

##### Level 5 heading

###### Level 6 heading

## Blockquote

> Good markdown styling should feel editorial instead of accidental.
>
> It should also preserve rhythm across paragraphs, code, tables, and media.

## Lists

- Unordered items should keep spacing consistent
- Nested lists should remain readable
  - Second level item
  - Another nested item with **bold text**
- Inline links inside lists should still look like links

1. Ordered lists should keep numbering
2. They should align with surrounding content
3. They should support nested items
   1. Nested ordered item
   2. Another nested ordered item

## Code

\`\`\`ts
type ReleaseNote = {
  title: string
  shippedAt: string
  highlights: string[]
}

export function formatRelease(note: ReleaseNote) {
  return \`\${note.title} shipped on \${note.shippedAt}\`
}
\`\`\`

\`\`\`bash
pnpm --filter @repo/ui build
pnpm --filter storybook build
\`\`\`

\`\`\`
Code blocks without a language should still keep spacing and background.
\`\`\`

## Table

| Surface | Status | Notes |
| --- | :---: | --- |
| Headings | Ready | Uses typography plugin styles |
| Quotes | Ready | Includes border and muted text tone |
| Code blocks | Ready | Uses highlight.js for syntax coloring |
| Tables | Ready | Keeps borders and readable cell spacing |

## Media

![Placeholder editorial graphic](${placeholderImage})

## Final note

The component should work for compact release notes, dense technical docs, and article-style pages without switching styling strategies.
`.trim()

const codeHeavyMarkdown = `
# Code-Focused Example

Use this story to inspect syntax coloring, long lines, and mixed inline formatting like \`const ready = true\`.

> Highlighting should support common languages while still looking acceptable when auto-detected.

\`\`\`tsx
import { Markdown } from "@repo/ui"

export function ChangelogSection() {
  return (
    <section className="space-y-4">
      <h2>Changelog</h2>
      <Markdown content={"## Added\\n\\n- Markdown support"} />
    </section>
  )
}
\`\`\`

\`\`\`json
{
  "component": "Markdown",
  "renderer": "marked",
  "syntaxHighlight": "highlight.js",
  "status": "ready"
}
\`\`\`

\`\`\`diff
+ Added explicit typography coverage
+ Added syntax-highlighted fenced blocks
- Removed raw fallback styling experiments
\`\`\`
`.trim()

const meta: Meta<typeof Markdown> = {
	title: "Components/Markdown",
	component: Markdown,
	tags: ["autodocs"],
	args: {
		content: fullCoverageMarkdown,
	},
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
	render: (args) => (
		<div className="mx-auto max-w-4xl rounded-xl border bg-card p-6 md:p-8">
			<Markdown {...args} />
		</div>
	),
}

export const CodeHeavy: Story = {
	args: {
		content: codeHeavyMarkdown,
	},
	render: (args) => (
		<div className="mx-auto max-w-4xl rounded-xl border bg-card p-6 md:p-8">
			<Markdown {...args} />
		</div>
	),
}

export const DarkMode: Story = {
	args: {
		content: fullCoverageMarkdown,
	},
	render: (args) => (
		<div className="dark bg-background p-6 md:p-10">
			<div className="mx-auto max-w-4xl rounded-xl border bg-card p-6 md:p-8">
				<Markdown {...args} />
			</div>
		</div>
	),
}
