import { validateRelaySecret } from "@chankay/wechat-relay-protocol"

export type RelayConfig = {
	host: "127.0.0.1" | "0.0.0.0"
	port: number
	sharedSecret: string
}

export function readRelayConfig(
	environment: Record<string, string | undefined> = process.env
): RelayConfig {
	try {
		const sharedSecret = environment.WECHAT_RELAY_SHARED_SECRET ?? ""
		validateRelaySecret(sharedSecret)
		const host = environment.WECHAT_RELAY_HOST ?? "127.0.0.1"
		if (host !== "127.0.0.1" && host !== "0.0.0.0") throw new Error()
		const rawPort = environment.WECHAT_RELAY_PORT ?? "8787"
		if (!/^\d{4,5}$/.test(rawPort)) throw new Error()
		const port = Number(rawPort)
		if (!Number.isSafeInteger(port) || port < 1024 || port > 65535) throw new Error()
		return { host, port, sharedSecret }
	} catch {
		throw new Error("Invalid relay configuration.")
	}
}
