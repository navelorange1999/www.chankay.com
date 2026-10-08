import type { Payload } from "payload"

/** Preserve retired MongoDB fields only in internal audit reads, without changing live API schemas. */
export function migrationReadAdapter(
	payload: Pick<Payload, "db">
): Pick<Payload["db"], "find" | "findVersions"> {
	// Payload 3.88 strips unknown fields on reads; scope this option to audit calls only.
	const adapter = Object.create(payload.db) as Payload["db"]
	Object.defineProperty(adapter, "allowAdditionalKeys", { value: true })
	return adapter
}
