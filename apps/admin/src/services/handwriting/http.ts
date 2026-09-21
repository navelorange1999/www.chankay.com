import { normalizeInput, type HandwritingInput } from "@chankay/handwriting/schema"
import { readJson } from "./readJson"

export function canEditHandwriting(user: unknown): boolean {
	if (!user || typeof user !== "object") return false
	const value = user as Record<string, unknown>
	return value.collection === "users" && (value.role === "admin" || value.role === "editor")
}

export function createPreviewHandler<Artifact extends { fingerprint: string }>(dependencies: {
	authorize: (request: Request) => Promise<boolean>
	generate: (input: HandwritingInput) => Promise<Artifact>
	invalidate: (keys: string[]) => Promise<unknown>
}) {
	return async (request: Request) => {
		const json = (value: unknown, status = 200) =>
			Response.json(value, { status, headers: { "Cache-Control": "no-store" } })
		if (request.headers.get("origin") !== new URL(request.url).origin)
			return json({ error: "Invalid request origin" }, 403)
		if (!(await dependencies.authorize(request)))
			return json({ error: "Sign in as an editor to preview handwriting" }, 401)
		let input: HandwritingInput
		try {
			input = normalizeInput(await readJson(request.body, 4096))
		} catch {
			return json(
				{ error: "Use 1–50 supported English characters and valid handwriting settings." },
				400
			)
		}
		try {
			const artifact = await dependencies.generate(input)
			await dependencies.invalidate([artifact.fingerprint])
			return json(artifact)
		} catch {
			return json(
				{
					error:
						"Handwriting preview is unavailable. Check the model and private storage configuration, then retry.",
				},
				503
			)
		}
	}
}
