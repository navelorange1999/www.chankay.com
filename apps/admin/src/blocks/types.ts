import type { CollectionConfig } from "payload"

export type BlockDefinition = NonNullable<
	Extract<NonNullable<CollectionConfig["fields"]>[number], { type: "blocks" }>["blocks"]
>[number]
