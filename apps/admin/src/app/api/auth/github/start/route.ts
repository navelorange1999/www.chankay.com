import { randomBytes } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import { GITHUB_STATE_COOKIE_NAME } from "@/auth/githubStrategy"

const OAUTH_STATE_EXPIRY_SECONDS = 60 * 10

const getBaseURL = (request: NextRequest) => {
	if (process.env.NEXT_PUBLIC_SERVER_URL) {
		return process.env.NEXT_PUBLIC_SERVER_URL
	}

	return request.nextUrl.origin
}

const getCookieSecureFlag = (request: NextRequest) => {
	return request.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production"
}

const resolveCookieSameSite = (sameSite: boolean | string | undefined) => {
	if (typeof sameSite === "string") {
		return sameSite.toLowerCase() as "lax" | "none" | "strict"
	}

	return sameSite ? "strict" : undefined
}

export async function GET(request: NextRequest) {
	const clientId = process.env.GITHUB_CLIENT_ID

	if (!clientId) {
		const loginURL = new URL("/auth/login", request.url)
		loginURL.searchParams.set("error", "github_config_missing")

		return NextResponse.redirect(loginURL)
	}

	const state = randomBytes(32).toString("hex")
	const redirectURI = `${getBaseURL(request)}/api/auth/github/callback`
	const authorizeURL = new URL("https://github.com/login/oauth/authorize")

	authorizeURL.searchParams.set("client_id", clientId)
	authorizeURL.searchParams.set("redirect_uri", redirectURI)
	authorizeURL.searchParams.set("scope", "read:user user:email")
	authorizeURL.searchParams.set("state", state)
	authorizeURL.searchParams.set("allow_signup", "false")

	const response = NextResponse.redirect(authorizeURL)
	const defaultTokenCookieName = "payload-token"
	let tokenCookieName = defaultTokenCookieName
	let tokenCookieDomain: string | undefined
	let tokenCookieSameSite: "lax" | "none" | "strict" | undefined
	let tokenCookieSecure = getCookieSecureFlag(request)

	try {
		const payload = await getPayload({
			config: configPromise,
		})
		const usersCollection = payload.collections.users?.config

		if (usersCollection?.auth) {
			tokenCookieName = `${payload.config.cookiePrefix}-token`
			tokenCookieDomain = usersCollection.auth.cookies.domain ?? undefined
			tokenCookieSameSite = resolveCookieSameSite(usersCollection.auth.cookies.sameSite)
			tokenCookieSecure = usersCollection.auth.cookies.secure || tokenCookieSameSite === "none"
		}
	} catch {
		// Continue OAuth flow even if payload config lookup fails.
	}

	response.cookies.set(tokenCookieName, "", {
		domain: tokenCookieDomain,
		expires: new Date(0),
		httpOnly: true,
		maxAge: 0,
		path: "/",
		sameSite: tokenCookieSameSite,
		secure: tokenCookieSecure,
	})

	response.cookies.set(GITHUB_STATE_COOKIE_NAME, state, {
		httpOnly: true,
		maxAge: OAUTH_STATE_EXPIRY_SECONDS,
		path: "/",
		sameSite: "lax",
		secure: getCookieSecureFlag(request),
	})

	return response
}
