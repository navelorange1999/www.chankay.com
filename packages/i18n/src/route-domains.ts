export type RouteDomainKind = "catchAll" | "collection"

export type RouteDomainDefinition = {
	basePath: string
	collection: string
	index?: boolean
	key: string
	kind: RouteDomainKind
	slugField: "slug"
}

export const routeDomains = {
	pages: {
		basePath: "",
		collection: "pages",
		key: "pages",
		kind: "catchAll",
		slugField: "slug",
	},
	posts: {
		basePath: "posts",
		collection: "posts",
		index: true,
		key: "posts",
		kind: "collection",
		slugField: "slug",
	},
} as const satisfies Record<string, RouteDomainDefinition>

export type RouteDomainKey = keyof typeof routeDomains

export function getRouteDomain(domain: RouteDomainKey): RouteDomainDefinition {
	return routeDomains[domain]
}
