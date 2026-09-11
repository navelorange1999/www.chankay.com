import type { Endpoint } from "payload"
import {
	createSocialDraft,
	prepareSocialPublication,
	publishSocialPublication,
	retrySocialDraftAfterRemoteInspection,
} from "./index"
import { requireOperator } from "./access"
import { readPublication, publicationSummary, verifySnapshot } from "./records"
import { identifier, prepareSchema, relationshipID } from "./validation"
import { loadSource } from "./source"
import { hashSnapshot } from "./snapshot"
import { safeError } from "./types"

const commands = {
	prepare: prepareSocialPublication,
	"create-draft": createSocialDraft,
	"retry-draft-after-remote-inspection": retrySocialDraftAfterRemoteInspection,
	publish: publishSocialPublication,
}
export const socialPublicationEndpoints: Endpoint[] = [
	...Object.entries(commands).map(
		([path, command]): Endpoint => ({
			path: `/${path}`,
			method: "post",
			handler: async (req) => {
				try {
					requireOperator(req, path === "publish")
					const body: unknown = await req.json?.()
					return Response.json(await command(body, req))
				} catch (error) {
					return Response.json({ error: safeError(error, "prepare") }, { status: 400 })
				}
			},
		})
	),
	{
		path: "/:id/review",
		method: "get",
		handler: async (req) => {
			try {
				requireOperator(req)
				const doc = await readPublication(identifier.parse(req.routeParams?.id), req)
				verifySnapshot(doc)
				let stale = true
				try {
					const { source } = await loadSource(
						{
							assets: doc.snapshot.assets,
							postId: relationshipID(doc.sourcePost),
							accountId: relationshipID(doc.account),
							locale: prepareSchema.shape.locale.parse(doc.sourceLocale),
						},
						req
					)
					stale = hashSnapshot(source) !== doc.sourceHash
				} catch {
					/* Unavailable source is not eligible for a new mutation. */
				}
				return Response.json({
					...publicationSummary(doc),
					stale,
					html: doc.preparedPayload.html,
					source: doc.snapshot,
				})
			} catch (error) {
				return Response.json({ error: safeError(error, "prepare") }, { status: 400 })
			}
		},
	},
]
