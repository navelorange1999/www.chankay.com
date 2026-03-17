import type { Meta, StoryObj } from "@storybook/react-vite"
import {
	Post,
	PostHeader,
	PostThumbnail,
	PostTitle,
	PostMeta,
	PostMetaInline,
	PostMetaSeparator,
	PostDate,
	PostReadingTime,
	PostExcerpt,
	PostContent,
	PostFooter,
	PostTags,
	PostTag,
} from "@repo/ui"

const meta: Meta<typeof Post> = {
	title: "Components/Post",
	component: Post,
	tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
	render: () => (
		<Post>
			<PostHeader className="px-6 pt-6">
				<PostTitle>Getting Started with Next.js 14</PostTitle>
				<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mt-2">
					<PostDate>March 15, 2024</PostDate>
					<span className="hidden sm:inline">•</span>
					<PostReadingTime>5 min read</PostReadingTime>
				</div>
				<PostTags className="flex flex-wrap gap-1 mt-2">
					<PostTag size="sm" variant="outline">
						Next.js
					</PostTag>
					<PostTag size="sm" variant="outline">
						React
					</PostTag>
				</PostTags>
			</PostHeader>
			<PostContent>
				<p>
					Next.js 14 introduces powerful new features that make building web applications easier
					than ever. In this post, we'll explore the latest updates and how to get started with your
					first project.
				</p>
				<p>
					The new App Router provides a more intuitive way to structure your application, with
					built-in support for layouts, error boundaries, and loading states.
				</p>
			</PostContent>
		</Post>
	),
}

export const WithMarkdown: Story = {
	render: () => {
		const markdownContent = `
# Building Modern Web Applications

Learn how to build **scalable** and *performant* web applications using modern tools and best practices.

## Key Technologies

- React and Next.js for building user interfaces
- TypeScript for type safety
- Tailwind CSS for styling
- Vercel for deployment

### Code Example

\`\`\`javascript
function greeting(name) {
  return \`Hello, \${name}!\`;
}

console.log(greeting('World'));
\`\`\`

> Modern web development has evolved significantly over the past few years.

Check out the [official documentation](https://nextjs.org) for more information.
		`

		return (
			<Post>
				<PostThumbnail>
					<img
						src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80"
						alt="Code on laptop"
						className="h-full w-full object-cover"
					/>
				</PostThumbnail>
				<PostHeader className="px-6 pt-4">
					<PostTitle>Building Modern Web Applications</PostTitle>
					<PostMeta>
						<PostAuthor>Jane Smith</PostAuthor>
						<PostDate>March 10, 2024</PostDate>
						<PostReadingTime>8 min read</PostReadingTime>
					</PostMeta>
				</PostHeader>
				<PostContent asMarkdown content={markdownContent} />
				<PostFooter>
					<PostTags>
						<PostTag>React</PostTag>
						<PostTag>Next.js</PostTag>
						<PostTag>TypeScript</PostTag>
					</PostTags>
				</PostFooter>
			</Post>
		)
	},
}

export const WithThumbnail: Story = {
	render: () => (
		<Post>
			<PostThumbnail>
				<img
					src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80"
					alt="Code on laptop"
					className="h-full w-full object-cover"
				/>
			</PostThumbnail>
			<PostHeader className="px-6 pt-6">
				<PostTitle>Building Modern Web Applications</PostTitle>
				<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mt-2">
					<PostDate>March 10, 2024</PostDate>
					<span className="hidden sm:inline">•</span>
					<PostReadingTime>8 min read</PostReadingTime>
				</div>
				<PostTags className="flex flex-wrap gap-1 mt-2">
					<PostTag size="sm" variant="outline">
						Web Dev
					</PostTag>
					<PostTag size="sm" variant="outline">
						React
					</PostTag>
					<PostTag size="sm" variant="outline">
						TypeScript
					</PostTag>
				</PostTags>
				<PostExcerpt className="mt-4">
					Learn how to build scalable and performant web applications using modern tools and best
					practices. This comprehensive guide covers everything from setup to deployment.
				</PostExcerpt>
			</PostHeader>
			<PostContent>
				<p>
					Modern web development has evolved significantly over the past few years. With new
					frameworks and tools emerging constantly, it's important to stay up-to-date with the
					latest trends and best practices.
				</p>
				<h3>Key Technologies</h3>
				<ul>
					<li>React and Next.js for building user interfaces</li>
					<li>TypeScript for type safety</li>
					<li>Tailwind CSS for styling</li>
					<li>Vercel for deployment</li>
				</ul>
			</PostContent>
		</Post>
	),
}

export const MinimalPost: Story = {
	render: () => (
		<Post>
			<PostHeader className="px-6 pt-6">
				<PostTitle>Quick Tip: CSS Grid Layout</PostTitle>
				<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mt-2">
					<PostDate>March 20, 2024</PostDate>
					<span className="hidden sm:inline">•</span>
					<PostReadingTime>2 min read</PostReadingTime>
				</div>
				<PostTags className="flex flex-wrap gap-1 mt-2">
					<PostTag size="sm" variant="outline">
						CSS
					</PostTag>
					<PostTag size="sm" variant="outline">
						Quick Tips
					</PostTag>
				</PostTags>
			</PostHeader>
			<PostContent>
				<p>
					CSS Grid is a powerful layout system that makes it easy to create complex, responsive
					layouts. Here's a simple example of how to create a basic grid layout.
				</p>
				<pre className="bg-gray-100 p-4 rounded-md">
					<code>{`.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}`}</code>
				</pre>
			</PostContent>
		</Post>
	),
}

export const FullFeaturedPost: Story = {
	render: () => (
		<Post>
			<PostThumbnail>
				<img
					src="https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&q=80"
					alt="Programming setup"
					className="h-full w-full object-cover"
				/>
			</PostThumbnail>
			<PostHeader className="px-6 pt-6">
				<div className="flex items-center justify-between">
					<PostTitle>The Complete Guide to TypeScript in 2026</PostTitle>
					<span className="text-xs text-muted-foreground hidden sm:inline">Featured</span>
				</div>
				<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mt-2">
					<PostDate dateTime="2024-03-15">March 15, 2024</PostDate>
					<span className="hidden sm:inline">•</span>
					<PostReadingTime>15 min read</PostReadingTime>
				</div>
				<PostTags className="flex flex-wrap gap-1 mt-2">
					<PostTag size="sm" variant="outline">
						TypeScript
					</PostTag>
					<PostTag size="sm" variant="outline">
						JavaScript
					</PostTag>
					<PostTag size="sm" variant="outline">
						Programming
					</PostTag>
				</PostTags>
				<PostExcerpt className="mt-4">
					TypeScript has become the de facto standard for large-scale JavaScript applications. This
					comprehensive guide covers everything from basic types to advanced patterns, helping you
					master TypeScript for modern web development.
				</PostExcerpt>
			</PostHeader>
			<PostContent>
				<h3>Introduction</h3>
				<p>
					TypeScript is a statically typed superset of JavaScript that compiles to plain JavaScript.
					It adds optional static typing, classes, and modules to JavaScript, enabling developers to
					use existing JavaScript code and incorporate popular JavaScript libraries.
				</p>
				<h3>Why TypeScript?</h3>
				<p>TypeScript offers several advantages over vanilla JavaScript:</p>
				<ul>
					<li>
						<strong>Type Safety:</strong> Catch errors at compile-time rather than runtime
					</li>
					<li>
						<strong>Better IDE Support:</strong> Enhanced autocomplete and refactoring
					</li>
					<li>
						<strong>Improved Code Quality:</strong> Self-documenting code with types
					</li>
					<li>
						<strong>Modern Features:</strong> Use latest ECMAScript features
					</li>
				</ul>
				<h3>Getting Started</h3>
				<p>To get started with TypeScript, you'll need to install it via npm:</p>
				<pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto">
					<code>npm install -g typescript</code>
				</pre>
				<p>
					Once installed, you can compile TypeScript files using the <code>tsc</code> command:
				</p>
				<pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto">
					<code>tsc myfile.ts</code>
				</pre>
			</PostContent>
		</Post>
	),
}

export const MobileOptimized: Story = {
	render: () => (
		<div className="max-w-sm mx-auto">
			<Post>
				<PostHeader className="px-4 pt-3">
					<PostTitle className="text-xl">Quick CSS Tips & Tricks</PostTitle>
					<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mt-2">
						<PostDate>March 20, 2024</PostDate>
						<span className="hidden sm:inline">•</span>
						<PostReadingTime>3 min read</PostReadingTime>
					</div>
					<PostTags className="flex flex-wrap gap-1 mt-2">
						<PostTag size="sm" variant="outline">
							CSS
						</PostTag>
						<PostTag size="sm" variant="outline">
							Tips
						</PostTag>
					</PostTags>
				</PostHeader>
				<PostContent className="px-4 pb-3">
					<p className="text-sm">
						Discover powerful CSS techniques that will improve your styling workflow and help you
						create more maintainable stylesheets.
					</p>
				</PostContent>
			</Post>
		</div>
	),
}

export const CompactWithInlineTags: Story = {
	render: () => (
		<Post>
			<PostHeader className="px-6 pt-4">
				<PostTitle>Advanced TypeScript Patterns</PostTitle>
				<PostMetaInline className="mt-2">
					<PostDate>March 21, 2024</PostDate>
					<PostMetaSeparator />
					<PostReadingTime>7 min read</PostReadingTime>
					<PostMetaSeparator />
					<PostTag size="sm" variant="outline">
						TypeScript
					</PostTag>
					<PostTag size="sm" variant="outline">
						Advanced
					</PostTag>
				</PostMetaInline>
			</PostHeader>
			<PostContent>
				<p>
					Discover powerful CSS techniques that will improve your styling workflow and help you
					create more maintainable stylesheets.
				</p>
			</PostContent>
		</Post>
	),
}

export const PostGrid: Story = {
	render: () => (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			<Post>
				<PostThumbnail>
					<img
						src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80"
						alt="Code editor"
						className="h-full w-full object-cover"
					/>
				</PostThumbnail>
				<PostHeader className="px-6 pt-4">
					<PostTitle className="text-xl">React Best Practices</PostTitle>
					<div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
						<PostDate>March 14, 2024</PostDate>
						<span>•</span>
						<PostReadingTime>5 min</PostReadingTime>
						<span>•</span>
						<PostTags className="inline-flex gap-1">
							<PostTag size="sm" variant="outline">
								React
							</PostTag>
						</PostTags>
					</div>
				</PostHeader>
				<PostContent className="px-6 py-2">
					<p className="text-sm text-muted-foreground line-clamp-3">
						Learn the best practices for building scalable React applications, including component
						design, state management, and performance optimization.
					</p>
				</PostContent>
			</Post>

			<Post>
				<PostThumbnail>
					<img
						src="https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&q=80"
						alt="Terminal"
						className="h-full w-full object-cover"
					/>
				</PostThumbnail>
				<PostHeader className="px-6 pt-4">
					<PostTitle className="text-xl">Node.js Performance Tips</PostTitle>
					<div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
						<PostDate>March 13, 2024</PostDate>
						<span>•</span>
						<PostReadingTime>8 min</PostReadingTime>
						<span>•</span>
						<PostTags className="inline-flex gap-1">
							<PostTag size="sm" variant="outline">
								Node.js
							</PostTag>
						</PostTags>
					</div>
				</PostHeader>
				<PostContent className="px-6 py-2">
					<p className="text-sm text-muted-foreground line-clamp-3">
						Optimize your Node.js applications with these performance tips, covering everything from
						async patterns to memory management.
					</p>
				</PostContent>
			</Post>

			<Post>
				<PostThumbnail>
					<img
						src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80"
						alt="Database"
						className="h-full w-full object-cover"
					/>
				</PostThumbnail>
				<PostHeader className="px-6 pt-4">
					<PostTitle className="text-xl">PostgreSQL Indexing</PostTitle>
					<div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
						<PostDate>March 12, 2024</PostDate>
						<span>•</span>
						<PostReadingTime>12 min</PostReadingTime>
						<span>•</span>
						<PostTags className="inline-flex gap-1">
							<PostTag size="sm" variant="outline">
								PostgreSQL
							</PostTag>
						</PostTags>
					</div>
				</PostHeader>
				<PostContent className="px-6 py-2">
					<p className="text-sm text-muted-foreground line-clamp-3">
						Master PostgreSQL indexing strategies to dramatically improve your database query
						performance and application speed.
					</p>
				</PostContent>
			</Post>
		</div>
	),
}
