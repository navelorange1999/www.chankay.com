const readOnlyMcpAccess = {
	find: true,
	create: false,
	update: false,
	delete: false,
} as const

const adminMcpAccess = {
	find: true,
	create: true,
	update: true,
	delete: true,
} as const

export const mcpCollections = {
	"social-accounts": {
		description: "Social publishing destinations. Configuration changes require Admin.",
		enabled: readOnlyMcpAccess,
	},
	"social-publications": {
		description:
			"Immutable publication snapshots and audit status. Mutations use custom tools only.",
		enabled: readOnlyMcpAccess,
	},
	posts: {
		description: "Blog posts and long-form article content.",
		enabled: adminMcpAccess,
	},
	pages: {
		description: "Structured website pages with nested layout blocks and SEO settings.",
		enabled: adminMcpAccess,
	},
	tags: {
		description: "Taxonomy tags used to categorize and filter posts.",
		enabled: adminMcpAccess,
	},
	series: {
		description: "Editorial series metadata, ordering, and status information.",
		enabled: adminMcpAccess,
	},
	media: {
		description: "Uploaded and generated media assets referenced across the site.",
		enabled: readOnlyMcpAccess,
	},
} as const
