import type { Payload } from "payload"

import {
	collectPublicationInventory,
	type PublicationInventoryRow,
} from "../publicationMigration/inventory"
import { buildPublicationManifest } from "../publicationMigration/manifest"
import { collectTaxonomyInventory, type TaxonomyInventoryRow } from "../taxonomyMigration/inventory"
import { buildTaxonomyManifest } from "../taxonomyMigration/manifest"

type CrossBlocker = { id: string; reason: string }

export function buildContentMigrationReview(
	publicationRows: readonly PublicationInventoryRow[],
	taxonomyRows: readonly TaxonomyInventoryRow[],
	acceptedUncategorizedPostIds: ReadonlySet<string> = new Set()
) {
	const publication = buildPublicationManifest(publicationRows)
	const taxonomy = buildTaxonomyManifest(taxonomyRows, acceptedUncategorizedPostIds)
	const crossBlocked: CrossBlocker[] = []
	const publicationPosts = new Map(
		publicationRows.filter((row) => row.collection === "posts").map((row) => [row.id, row])
	)
	const taxonomyPosts = new Map(taxonomyRows.map((row) => [row.id, row]))

	for (const [id, row] of publicationPosts) {
		const counterpart = taxonomyPosts.get(id)
		if (!counterpart) {
			crossBlocked.push({ id, reason: "Post is missing from the taxonomy inventory." })
			continue
		}
		if (
			row.updatedAt !== counterpart.updatedAt ||
			row.legacyStatus !== counterpart.legacyStatus ||
			row.nativeStatus !== counterpart.nativeStatus
		) {
			crossBlocked.push({ id, reason: "Publication and taxonomy snapshots differ." })
		}
	}
	for (const id of taxonomyPosts.keys()) {
		if (!publicationPosts.has(id)) {
			crossBlocked.push({ id, reason: "Post is missing from the publication inventory." })
		}
	}

	const ready =
		crossBlocked.length === 0 && publication.blocked.length === 0 && taxonomy.blocked.length === 0
	return {
		ready,
		crossBlocked,
		publication: { ...publication, actions: ready ? publication.actions : [] },
		taxonomy: { ...taxonomy, actions: ready ? taxonomy.actions : [] },
	}
}

export async function collectContentMigrationReview(
	payload: Pick<Payload, "db">,
	options: {
		legacyBefore: string
		categoryByTagId: Readonly<Record<string, string>>
		acceptedUncategorizedPostIds?: ReadonlySet<string>
	}
) {
	const publicationRows = await collectPublicationInventory(payload, options.legacyBefore)
	const taxonomyRows = await collectTaxonomyInventory(payload, options.categoryByTagId)
	return {
		...buildContentMigrationReview(
			publicationRows,
			taxonomyRows,
			options.acceptedUncategorizedPostIds
		),
		inventories: { publication: publicationRows, taxonomy: taxonomyRows },
	}
}
