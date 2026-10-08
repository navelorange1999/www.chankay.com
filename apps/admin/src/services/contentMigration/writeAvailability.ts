/** Cleanup releases retain migration audit data but cannot mutate migrated content. */
export function requireMigrationWritesAvailable(): void {
	throw new Error(
		"Migration writes are retired after native publication cutover. Use the reviewed compatible release for rollback."
	)
}
