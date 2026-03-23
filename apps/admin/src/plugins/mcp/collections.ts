const readOnlyMcpAccess = {
	find: true,
	create: false,
	update: false,
	delete: false,
} as const

export const mcpCollections = {
	posts: {
		description: "Blog posts and long-form article content.",
		enabled: readOnlyMcpAccess,
	},
	pages: {
		description: "Structured website pages with nested layout blocks and SEO settings.",
		enabled: readOnlyMcpAccess,
	},
	tags: {
		description: "Taxonomy tags used to categorize and filter posts.",
		enabled: readOnlyMcpAccess,
	},
	series: {
		description: "Editorial series metadata, ordering, and status information.",
		enabled: readOnlyMcpAccess,
	},
	media: {
		description: "Uploaded and generated media assets referenced across the site.",
		enabled: readOnlyMcpAccess,
	},
} as const
