import type { Access, PayloadRequest } from "payload"

// Object identity cannot be forged by a JSON request body or a context string.
const commandCapability = Object.freeze({})

export function requireOperator(req: PayloadRequest, publisher = false) {
	const user = req.user
	if (
		!user ||
		user.collection !== "users" ||
		(user.role !== "admin" && user.role !== "editor") ||
		(publisher && user.role !== "admin")
	) {
		throw new Error("Social publishing permission denied.")
	}
	return user
}

export const accountAdminAccess: Access = ({ req }) =>
	req.user?.collection === "users" && req.user.role === "admin"
export const socialReadAccess: Access = ({ req }) => req.user?.collection === "users"
export const serviceWriteAccess: Access = ({ req }) =>
	Boolean(req.user?.collection === "users" && req.context.socialPublishing === commandCapability)

export function commandRequest(req: PayloadRequest): PayloadRequest {
	return Object.assign(Object.create(Object.getPrototypeOf(req)), req, {
		context: { ...req.context, socialPublishing: commandCapability },
	})
}
