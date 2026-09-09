import {
	RELAY_PROTOCOL_VERSION,
	signRelayRequest,
	validateRelaySecret,
	type RelayMetadata,
} from "@chankay/wechat-relay-protocol"

type RelayEnvironment = Record<string, string | undefined>
type RelayDependencies = {
	now: () => number
	nonce: () => string
}

const wechatOrigin = "https://api.weixin.qq.com"
const allowedPaths = new Set([
	"/cgi-bin/stable_token",
	"/cgi-bin/media/uploadimg",
	"/cgi-bin/material/add_material",
	"/cgi-bin/draft/add",
	"/cgi-bin/draft/get",
])

function invalidConfigurationFetch(): typeof fetch {
	return async () => {
		throw new Error("Invalid WeChat relay configuration.")
	}
}

function readRelayConfiguration(
	environment: RelayEnvironment
): { relayURL: URL; sharedSecret: string } | undefined | null {
	const rawURL = environment.WECHAT_RELAY_URL
	const sharedSecret = environment.WECHAT_RELAY_SHARED_SECRET
	if (!rawURL && !sharedSecret) return undefined
	if (!rawURL || !sharedSecret) return null
	try {
		validateRelaySecret(sharedSecret)
		const relayURL = new URL(rawURL)
		if (
			relayURL.protocol !== "https:" ||
			relayURL.pathname !== "/v1/wechat" ||
			relayURL.search ||
			relayURL.hash ||
			relayURL.username ||
			relayURL.password
		)
			return null
		return { relayURL, sharedSecret }
	} catch {
		return null
	}
}

function requestSignal(input: RequestInfo | URL, init?: RequestInit): AbortSignal | undefined {
	if (init?.signal) return init.signal
	return input instanceof Request ? input.signal : undefined
}

export function createWeChatRelayFetch(
	environment: RelayEnvironment,
	baseFetch: typeof fetch,
	dependencies: RelayDependencies = { now: Date.now, nonce: crypto.randomUUID }
): typeof fetch {
	const configuration = readRelayConfiguration(environment)
	if (configuration === undefined) return baseFetch
	if (configuration === null) return invalidConfigurationFetch()
	return async (input, init) => {
		let request: Request
		try {
			request = new Request(input, init)
		} catch {
			throw new Error("Invalid WeChat relay request.")
		}
		const targetURL = new URL(request.url)
		if (
			request.method !== "POST" ||
			targetURL.origin !== wechatOrigin ||
			targetURL.username ||
			targetURL.password ||
			targetURL.hash ||
			!allowedPaths.has(targetURL.pathname)
		)
			throw new Error("Invalid WeChat relay request.")
		const body = new Uint8Array(await request.arrayBuffer())
		const contentType = request.headers.get("content-type") ?? ""
		const metadata: RelayMetadata = {
			version: RELAY_PROTOCOL_VERSION,
			timestamp: String(Math.floor(dependencies.now() / 1000)),
			nonce: dependencies.nonce(),
			method: "POST",
			target: `${targetURL.pathname}${targetURL.search}`,
			contentType,
		}
		const headers = await signRelayRequest({
			metadata,
			body,
			secret: configuration.sharedSecret,
		})
		if (contentType) headers.set("content-type", contentType)
		return baseFetch(configuration.relayURL, {
			method: "POST",
			redirect: "error",
			signal: requestSignal(input, init),
			headers,
			body,
		})
	}
}
