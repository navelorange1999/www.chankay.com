import { timingSafeEqual } from "node:crypto"
import { readArtifact } from "@/services/handwriting/blob"

export const runtime = "nodejs"

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ fingerprint: string }> }
) {
	const configured = process.env.WWW_INTERNAL_SECRET?.trim()
	const provided = request.headers.get("www-internal-secret")?.trim()
	const headers = { "Cache-Control": "private, no-store" }
	if (
		!configured ||
		!provided ||
		Buffer.byteLength(configured) !== Buffer.byteLength(provided) ||
		!timingSafeEqual(Buffer.from(configured), Buffer.from(provided))
	) {
		return Response.json({ error: "Unauthorized" }, { status: 401, headers })
	}
	const { fingerprint } = await params
	if (!/^[a-f0-9]{64}$/.test(fingerprint))
		return Response.json({ error: "Invalid fingerprint" }, { status: 400, headers })
	try {
		const artifact = await readArtifact(fingerprint)
		return artifact
			? Response.json(artifact, { headers })
			: Response.json({ error: "Not generated" }, { status: 404, headers })
	} catch {
		return Response.json({ error: "Artifact storage unavailable" }, { status: 503, headers })
	}
}
