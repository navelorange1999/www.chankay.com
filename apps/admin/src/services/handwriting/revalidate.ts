export async function revalidateHandwriting(fingerprints: string[]) {
	const keys = [...new Set(fingerprints)]
	if (!keys.length) return
	if (keys.some((key) => !/^[a-f0-9]{64}$/.test(key))) throw new Error("Invalid fingerprint")
	const secret = process.env.WWW_INTERNAL_SECRET?.trim()
	if (!secret) return
	const origin = process.env.WWW_SITE_URL?.trim() || "https://www.chankay.com"
	// The website accepts at most 100 fingerprints per request.
	for (let offset = 0; offset < keys.length; offset += 100) {
		const response = await fetch(new URL("/api/revalidate", origin), {
			method: "POST",
			headers: { "Content-Type": "application/json", "www-internal-secret": secret },
			body: JSON.stringify({
				collection: "handwriting",
				fingerprints: keys.slice(offset, offset + 100),
			}),
			signal: AbortSignal.timeout(10_000),
		})
		if (!response.ok) throw new Error("Handwriting cache refresh failed")
	}
}
