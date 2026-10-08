import type { Access } from "payload"
import {
	getPublicationWhere,
	type PublicationCollection,
} from "@/services/publicationCompatibility"

export const publishedOrAuthenticated: Access = ({ req }) =>
	req.user ? true : { _status: { equals: "published" } }

export function createPublishedOrAuthenticated(collection: PublicationCollection): Access {
	return ({ req }) => (req.user ? true : getPublicationWhere(collection))
}
