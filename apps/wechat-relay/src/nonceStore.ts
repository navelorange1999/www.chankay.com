export class NonceStore {
	private readonly entries = new Map<string, number>()

	constructor(private readonly maxEntries = 10_000) {
		if (!Number.isSafeInteger(maxEntries) || maxEntries < 1)
			throw new Error("Invalid nonce store configuration.")
	}

	consume(nonce: string, expiresAt: number, now: number): boolean {
		if (!Number.isFinite(expiresAt) || !Number.isFinite(now) || expiresAt <= now)
			throw new Error("Invalid nonce lifetime.")
		for (const [key, expiry] of this.entries) {
			if (expiry <= now) this.entries.delete(key)
		}
		if (this.entries.has(nonce)) return false
		while (this.entries.size >= this.maxEntries) {
			const oldest = this.entries.keys().next().value
			if (oldest === undefined) break
			this.entries.delete(oldest)
		}
		this.entries.set(nonce, expiresAt)
		return true
	}
}
