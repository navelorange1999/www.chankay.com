import { randomUUID, timingSafeEqual } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { getPayload, jwtSign } from "payload"
import configPromise from "@payload-config"
import { GITHUB_STATE_COOKIE_NAME } from "@/auth/githubStrategy"

type GitHubTokenResponse = {
	access_token?: string
	error?: string
	error_description?: string
}

type GitHubUserProfile = {
	id: number
	login?: string
}

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

const redirectToLogin = (args: {
	clearStateCookie?: boolean
	errorCode: string
	request: NextRequest
}) => {
	const loginURL = new URL("/auth/login", args.request.url)
	loginURL.searchParams.set("error", args.errorCode)

	const response = NextResponse.redirect(loginURL)

	if (args.clearStateCookie) {
		response.cookies.set(GITHUB_STATE_COOKIE_NAME, "", {
			httpOnly: true,
			maxAge: 0,
			path: "/",
			sameSite: "lax",
			secure: getCookieSecureFlag(args.request),
		})
	}

	return response
}

const validateState = (expectedState: string, receivedState: string) => {
	const expectedBuffer = Buffer.from(expectedState)
	const receivedBuffer = Buffer.from(receivedState)

	if (expectedBuffer.length !== receivedBuffer.length) {
		return false
	}

	return timingSafeEqual(expectedBuffer, receivedBuffer)
}

export async function GET(request: NextRequest) {
	const clientId = process.env.GITHUB_CLIENT_ID
	const clientSecret = process.env.GITHUB_CLIENT_SECRET
	const code = request.nextUrl.searchParams.get("code")
	const state = request.nextUrl.searchParams.get("state")
	const stateCookie = request.cookies.get(GITHUB_STATE_COOKIE_NAME)?.value

	if (!clientId || !clientSecret) {
		return redirectToLogin({
			clearStateCookie: true,
			errorCode: "github_config_missing",
			request,
		})
	}

	if (!code || !state || !stateCookie || !validateState(stateCookie, state)) {
		return redirectToLogin({
			clearStateCookie: true,
			errorCode: "oauth_state_invalid",
			request,
		})
	}

	const redirectURI = `${getBaseURL(request)}/api/auth/github/callback`

	try {
		const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
			body: JSON.stringify({
				client_id: clientId,
				client_secret: clientSecret,
				code,
				redirect_uri: redirectURI,
				state,
			}),
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			method: "POST",
		})

		if (!tokenResponse.ok) {
			return redirectToLogin({
				clearStateCookie: true,
				errorCode: "oauth_token_exchange_failed",
				request,
			})
		}

		const tokenData = (await tokenResponse.json()) as GitHubTokenResponse

		if (!tokenData.access_token || tokenData.error) {
			return redirectToLogin({
				clearStateCookie: true,
				errorCode: "oauth_token_exchange_failed",
				request,
			})
		}

		const userResponse = await fetch("https://api.github.com/user", {
			headers: {
				Accept: "application/vnd.github+json",
				Authorization: `Bearer ${tokenData.access_token}`,
				"X-GitHub-Api-Version": "2022-11-28",
			},
		})

		if (!userResponse.ok) {
			return redirectToLogin({
				clearStateCookie: true,
				errorCode: "oauth_user_fetch_failed",
				request,
			})
		}

		const githubProfile = (await userResponse.json()) as GitHubUserProfile
		const providerAccountId = String(githubProfile.id)

		if (!providerAccountId || providerAccountId === "undefined") {
			return redirectToLogin({
				clearStateCookie: true,
				errorCode: "oauth_user_fetch_failed",
				request,
			})
		}

		const payload = await getPayload({
			config: configPromise,
		})
		const usersCollection = payload.collections.users?.config

		if (!usersCollection?.auth) {
			return redirectToLogin({
				clearStateCookie: true,
				errorCode: "github_config_missing",
				request,
			})
		}

		const userResult = await payload.find({
			collection: "users",
			depth: 0,
			limit: 1,
			overrideAccess: true,
			where: {
				"accounts.provider": {
					equals: "github",
				},
				"accounts.providerAccountId": {
					equals: providerAccountId,
				},
			},
		})

		if (userResult.docs.length === 0) {
			return redirectToLogin({
				clearStateCookie: true,
				errorCode: "github_not_authorized",
				request,
			})
		}

		const user = userResult.docs[0]

		if (!user || !("id" in user)) {
			return redirectToLogin({
				clearStateCookie: true,
				errorCode: "github_not_authorized",
				request,
			})
		}

		const expiresInSeconds = usersCollection.auth.tokenExpiration
		const now = new Date()
		const sessionId = randomUUID()
		const sessionExpiry = new Date(now.getTime() + expiresInSeconds * 1000)
		const activeSessions = Array.isArray(user.sessions)
			? user.sessions.filter((sessionItem) => {
					if (!sessionItem?.expiresAt) {
						return false
					}

					return new Date(sessionItem.expiresAt).getTime() > Date.now()
			  })
			: []

		const sessions = [
			...activeSessions,
			{
				createdAt: now.toISOString(),
				expiresAt: sessionExpiry.toISOString(),
				id: sessionId,
			},
		]

		await payload.update({
			collection: "users",
			data: {
				sessions,
			},
			id: user.id,
			overrideAccess: true,
		})

		const { token: sessionToken } = await jwtSign({
			fieldsToSign: {
				collection: "users",
				id: String(user.id),
				sid: sessionId,
			},
			secret: payload.secret,
			tokenExpiration: expiresInSeconds,
		})
		const payloadTokenCookieName = `${payload.config.cookiePrefix}-token`
		const sameSite = resolveCookieSameSite(usersCollection.auth.cookies.sameSite)
		const response = NextResponse.redirect(new URL("/", request.url))

		response.cookies.set(GITHUB_STATE_COOKIE_NAME, "", {
			httpOnly: true,
			maxAge: 0,
			path: "/",
			sameSite: "lax",
			secure: getCookieSecureFlag(request),
		})

		response.cookies.set(payloadTokenCookieName, sessionToken, {
			domain: usersCollection.auth.cookies.domain ?? undefined,
			expires: sessionExpiry,
			httpOnly: true,
			maxAge: expiresInSeconds,
			path: "/",
			sameSite,
			secure: usersCollection.auth.cookies.secure || sameSite === "none",
		})

		return response
	} catch {
		return redirectToLogin({
			clearStateCookie: true,
			errorCode: "oauth_callback_failed",
			request,
		})
	}
}
