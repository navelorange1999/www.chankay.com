export function createArtifactCache<Input, Artifact>(dependencies: {
	read: (key: string) => Promise<Artifact | null>
	write: (key: string, artifact: Artifact) => Promise<Artifact>
	generate: (input: Input) => Promise<Artifact>
}) {
	const pending = new Map<string, Promise<Artifact>>()
	return {
		ensure(key: string, input: Input): Promise<Artifact> {
			const existing = pending.get(key)
			if (existing) return existing
			if (pending.size >= 32) return Promise.reject(new Error("Generation is busy. Try again."))
			const task = (async () => {
				const cached = await dependencies.read(key)
				if (cached !== null) return cached
				const generated = await dependencies.generate(input)
				return dependencies.write(key, generated)
			})().finally(() => pending.delete(key))
			pending.set(key, task)
			return task
		},
	}
}
