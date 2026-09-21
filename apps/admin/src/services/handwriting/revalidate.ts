export async function revalidateHandwriting(fingerprints: string[]) {
	const keys = [...new Set(fingerprints)]
	if (!keys.length) return
	if (keys.some((key) => !/^[a-f0-9]{64}$/.test(key))) throw new Error("Invalid fingerprint")
	const secret = process.env.WWW_INTERNAL_SECRET?.trim()
	if (!secret) return
	const origin = process.env.WWW_SITE_URL?.trim() || "https://www.chankay.com"
	const response = await fetch(new URL("/api/revalidate", origin), {
		method: "POST",
		headers: { "Content-Type": "application/json", "www-internal-secret": secret },
		body: JSON.stringify({ collection: "handwriting", fingerprints: keys }),
		signal: AbortSignal.timeout(10_000),
	})
	if (!response.ok) throw new Error("Handwriting cache refresh failed")
}
