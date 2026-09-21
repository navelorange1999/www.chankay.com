import { getPayload } from "payload"
import config from "@payload-config"
import { canEditHandwriting, createPreviewHandler } from "@/services/handwriting/http"
import { ensureHandwriting } from "@/services/handwriting/service"
import { revalidateHandwriting } from "@/services/handwriting/revalidate"

export const runtime = "nodejs"
export const maxDuration = 60

export const POST = createPreviewHandler({
	authorize: async (request) => {
		const payload = await getPayload({ config })
		const { user } = await payload.auth({ headers: request.headers })
		return canEditHandwriting(user)
	},
	generate: ensureHandwriting,
	invalidate: revalidateHandwriting,
})
