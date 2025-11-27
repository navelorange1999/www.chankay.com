import type { Meta, StoryObj } from "@storybook/react-vite"
import { ContentSection } from "@repo/ui"

const meta: Meta<typeof ContentSection> = {
	title: "Sections/ContentSection",
	component: ContentSection,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
	},
	argTypes: {
		width: {
			control: "select",
			options: ["narrow", "normal", "wide", "full"],
		},
	},
}

export default meta

type Story = StoryObj<typeof meta>

const sampleContent = `
<h2>About Our Platform</h2>
<p>We provide cutting-edge solutions for modern web development. Our platform is built with the latest technologies and best practices to ensure your projects are fast, reliable, and scalable.</p>

<h3>Key Features</h3>
<ul>
	<li><strong>Performance:</strong> Lightning-fast load times and optimized delivery</li>
	<li><strong>Security:</strong> Enterprise-grade security measures built-in</li>
	<li><strong>Scalability:</strong> Grow from zero to millions of users seamlessly</li>
	<li><strong>Developer Experience:</strong> Intuitive APIs and comprehensive documentation</li>
</ul>

<h3>Why Choose Us?</h3>
<p>Our platform has been trusted by thousands of developers worldwide to build their most critical applications. With 99.99% uptime and 24/7 support, we're here to help you succeed.</p>

<blockquote>
	"This platform transformed how we build and deploy our applications. The developer experience is unmatched."
	<br>
	<cite>— Happy Customer</cite>
</blockquote>
`

export const Default: Story = {
	args: {
		title: "Our Story",
		body: sampleContent,
		width: "normal",
	},
}

export const NarrowWidth: Story = {
	args: {
		title: "Blog Post",
		body: `
<p>This is a blog post with narrow width, perfect for reading longer content. The narrow width ensures optimal line length for readability.</p>
<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
<h3>Subheading</h3>
<p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
		`,
		width: "narrow",
	},
}

export const WideWidth: Story = {
	args: {
		title: "Documentation",
		body: `
<div class="grid grid-cols-2 gap-4">
	<div>
		<h3>Getting Started</h3>
		<p>Quick start guide to get you up and running.</p>
	</div>
	<div>
		<h3>API Reference</h3>
		<p>Complete API documentation for all endpoints.</p>
	</div>
</div>
		`,
		width: "wide",
	},
}

export const FullWidth: Story = {
	args: {
		title: "Dashboard",
		body: `
<p>Full-width content is perfect for dashboards and data-heavy pages.</p>
<div class="bg-gray-100 p-8 rounded-lg dark:bg-gray-800">
	<p>Wide content area for complex layouts</p>
</div>
		`,
		width: "full",
	},
}

export const NoTitle: Story = {
	args: {
		body: `
<p>Sometimes you don't need a title. This content section focuses purely on the body content without any heading.</p>
<p>Perfect for embedding rich content or continuing a narrative from previous sections.</p>
		`,
		width: "normal",
	},
}

export const WithCodeBlock: Story = {
	args: {
		title: "Quick Start Guide",
		body: `
<h3>Installation</h3>
<p>Get started with our platform in just a few steps:</p>

<pre><code>npm install @repo/ui
pnpm add @repo/ui
yarn add @repo/ui</code></pre>

<h3>Usage</h3>
<p>Import and use our components in your project:</p>

<pre><code>import { Button } from "@repo/ui"

export default function App() {
  return &lt;Button&gt;Click me&lt;/Button&gt;
}</code></pre>
		`,
		width: "normal",
	},
}

export const MinimalContent: Story = {
	args: {
		title: "Simple Section",
		body: "<p>A minimal content section with just a title and a single paragraph.</p>",
		width: "normal",
	},
}

export const RichContent: Story = {
	args: {
		title: "Feature Highlights",
		body: `
<div class="space-y-6">
	<div class="flex items-start gap-4">
		<div class="text-4xl">🚀</div>
		<div>
			<h3 class="text-xl font-bold mb-2">Fast Performance</h3>
			<p>Built for speed with optimized rendering and code splitting.</p>
		</div>
	</div>
	
	<div class="flex items-start gap-4">
		<div class="text-4xl">🎨</div>
		<div>
			<h3 class="text-xl font-bold mb-2">Beautiful Design</h3>
			<p>Carefully crafted components with attention to detail.</p>
		</div>
	</div>
	
	<div class="flex items-start gap-4">
		<div class="text-4xl">🔒</div>
		<div>
			<h3 class="text-xl font-bold mb-2">Secure by Default</h3>
			<p>Security best practices built into every component.</p>
		</div>
	</div>
</div>
		`,
		width: "normal",
	},
}
