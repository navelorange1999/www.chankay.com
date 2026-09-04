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
	technical: {
		basePath: "technical",
		collection: "posts",
		index: true,
		key: "technical",
		kind: "collection",
		slugField: "slug",
	},
	trading: {
		basePath: "trading",
		collection: "posts",
		index: true,
		key: "trading",
		kind: "collection",
		slugField: "slug",
	},
} as const satisfies Record<string, RouteDomainDefinition>

export type RouteDomainKey = keyof typeof routeDomains

export function getRouteDomain(domain: RouteDomainKey): RouteDomainDefinition {
	return routeDomains[domain]
}
