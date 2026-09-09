export const RELAY_PROTOCOL_VERSION = "1" as const

export const RELAY_HEADERS = {
	version: "x-wechat-relay-version",
	timestamp: "x-wechat-relay-timestamp",
	nonce: "x-wechat-relay-nonce",
	method: "x-wechat-relay-method",
	target: "x-wechat-relay-target",
	contentType: "x-wechat-relay-content-type",
	bodyHash: "x-wechat-relay-body-sha256",
	signature: "x-wechat-relay-signature",
} as const

export type RelayMetadata = {
	version: typeof RELAY_PROTOCOL_VERSION
	timestamp: string
	nonce: string
	method: "POST"
	target: string
	contentType: string
}

export type ParsedRelayHeaders = {
	metadata: RelayMetadata
	bodyHash: string
	signature: string
}

const encoder = new TextEncoder()
const hexPattern = /^[a-f0-9]{64}$/

function invalidHeaders(): never {
	throw new Error("Invalid relay headers.")
}

export function validateRelaySecret(secret: string): void {
	if (secret.length < 32 || secret.length > 256 || /[\r\n]/.test(secret))
		throw new Error("Invalid relay secret.")
}

export function validateRelayMetadata(value: RelayMetadata): void {
	if (
		value.version !== RELAY_PROTOCOL_VERSION ||
		!/^\d{10}$/.test(value.timestamp) ||
		!/^[A-Za-z0-9_-]{16,128}$/.test(value.nonce) ||
		value.method !== "POST" ||
		value.target.length < 1 ||
		value.target.length > 4096 ||
		!value.target.startsWith("/") ||
		value.contentType.length > 256 ||
		/[\r\n]/.test(value.target) ||
		/[\r\n]/.test(value.contentType) ||
		!/^[\x20-\x7e]*$/.test(value.contentType)
	)
		throw new Error("Invalid relay metadata.")
}

export function canonicalRelayRequest(metadata: RelayMetadata, bodyHash: string): string {
	validateRelayMetadata(metadata)
	if (!hexPattern.test(bodyHash)) invalidHeaders()
	return [
		metadata.version,
		metadata.timestamp,
		metadata.nonce,
		metadata.method,
		metadata.target,
		metadata.contentType,
		bodyHash,
	].join("\n")
}

function bytesToHex(bytes: ArrayBuffer): string {
	return Array.from(new Uint8Array(bytes), (value) => value.toString(16).padStart(2, "0")).join("")
}

function hexToBytes(value: string): Uint8Array {
	if (!hexPattern.test(value)) invalidHeaders()
	return Uint8Array.from(value.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16))
}

async function bodyDigest(body: Uint8Array): Promise<string> {
	return bytesToHex(await crypto.subtle.digest("SHA-256", body))
}

async function hmacKey(secret: string): Promise<CryptoKey> {
	validateRelaySecret(secret)
	return crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign", "verify"]
	)
}

export async function signRelayRequest(input: {
	metadata: RelayMetadata
	body: Uint8Array
	secret: string
}): Promise<Headers> {
	validateRelayMetadata(input.metadata)
	const bodyHash = await bodyDigest(input.body)
	const canonical = canonicalRelayRequest(input.metadata, bodyHash)
	const signature = bytesToHex(
		await crypto.subtle.sign("HMAC", await hmacKey(input.secret), encoder.encode(canonical))
	)
	const headers = new Headers()
	headers.set(RELAY_HEADERS.version, input.metadata.version)
	headers.set(RELAY_HEADERS.timestamp, input.metadata.timestamp)
	headers.set(RELAY_HEADERS.nonce, input.metadata.nonce)
	headers.set(RELAY_HEADERS.method, input.metadata.method)
	headers.set(RELAY_HEADERS.target, input.metadata.target)
	headers.set(RELAY_HEADERS.contentType, input.metadata.contentType)
	headers.set(RELAY_HEADERS.bodyHash, bodyHash)
	headers.set(RELAY_HEADERS.signature, signature)
	return headers
}

export function readRelayHeaders(input: HeadersInit): ParsedRelayHeaders {
	const headers = new Headers(input)
	const metadata = {
		version: headers.get(RELAY_HEADERS.version),
		timestamp: headers.get(RELAY_HEADERS.timestamp),
		nonce: headers.get(RELAY_HEADERS.nonce),
		method: headers.get(RELAY_HEADERS.method),
		target: headers.get(RELAY_HEADERS.target),
		contentType: headers.get(RELAY_HEADERS.contentType),
	}
	if (
		metadata.version === null ||
		metadata.timestamp === null ||
		metadata.nonce === null ||
		metadata.method === null ||
		metadata.target === null ||
		metadata.contentType === null
	)
		return invalidHeaders()
	const parsedMetadata = metadata as RelayMetadata
	validateRelayMetadata(parsedMetadata)
	const bodyHash = headers.get(RELAY_HEADERS.bodyHash)
	const signature = headers.get(RELAY_HEADERS.signature)
	if (!bodyHash || !signature || !hexPattern.test(bodyHash) || !hexPattern.test(signature))
		return invalidHeaders()
	return { metadata: parsedMetadata, bodyHash, signature }
}

export async function verifyRelayRequest(input: {
	headers: HeadersInit
	body: Uint8Array
	secret: string
}): Promise<boolean> {
	validateRelaySecret(input.secret)
	let parsed: ParsedRelayHeaders
	try {
		parsed = readRelayHeaders(input.headers)
	} catch {
		return false
	}
	const actualBodyHash = await bodyDigest(input.body)
	if (actualBodyHash !== parsed.bodyHash) return false
	const canonical = canonicalRelayRequest(parsed.metadata, parsed.bodyHash)
	return crypto.subtle.verify(
		"HMAC",
		await hmacKey(input.secret),
		hexToBytes(parsed.signature),
		encoder.encode(canonical)
	)
}
