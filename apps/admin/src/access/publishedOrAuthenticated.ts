import type { Access } from "payload"

export const publishedOrAuthenticated: Access = ({ req }) =>
	req.user ? true : { _status: { equals: "published" } }
