import { NextRequest, NextResponse } from "next/server"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import { GITHUB_STATE_COOKIE_NAME } from "@/auth/githubStrategy"

type CookieSameSite = "lax" | "none" | "strict" | undefined

export type AuthCookieConfig = {
	tokenCookieDomain?: string
	tokenCookieName: string
	tokenCookieSameSite: CookieSameSite
	tokenCookieSecure: boolean
}

const resolveCookieSameSite = (sameSite: boolean | string | undefined): CookieSameSite => {
	if (typeof sameSite === "string") {
		return sameSite.toLowerCase() as Exclude<CookieSameSite, undefined>
	}

	return sameSite ? "strict" : undefined
}

const getCookieSecureFlag = (request: NextRequest) => {
	return request.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production"
}

export const resolveAuthCookieConfig = async (
	request: NextRequest
): Promise<AuthCookieConfig> => {
	const fallbackConfig: AuthCookieConfig = {
		tokenCookieName: "payload-token",
		tokenCookieSameSite: undefined,
		tokenCookieSecure: getCookieSecureFlag(request),
	}

	try {
		const payload = await getPayload({
			config: configPromise,
		})
		const usersCollection = payload.collections.users?.config

		if (!usersCollection?.auth) {
			return fallbackConfig
		}

		const tokenCookieSameSite = resolveCookieSameSite(usersCollection.auth.cookies.sameSite)

		return {
			tokenCookieDomain: usersCollection.auth.cookies.domain ?? undefined,
			tokenCookieName: `${payload.config.cookiePrefix}-token`,
			tokenCookieSameSite,
			tokenCookieSecure: usersCollection.auth.cookies.secure || tokenCookieSameSite === "none",
		}
	} catch {
		return fallbackConfig
	}
}

export const bestEffortLogoutSession = async (request: NextRequest): Promise<void> => {
	try {
		const logoutURL = new URL("/api/users/logout", request.url)
		await fetch(logoutURL, {
			headers: {
				cookie: request.headers.get("cookie") || "",
			},
			method: "POST",
		})
	} catch {
		// Best effort only. Callers still clear auth cookies regardless.
	}
}

export const clearAuthCookies = (args: {
	cookieConfig: AuthCookieConfig
	request: NextRequest
	response: NextResponse
}) => {
	args.response.cookies.set(args.cookieConfig.tokenCookieName, "", {
		domain: args.cookieConfig.tokenCookieDomain,
		expires: new Date(0),
		httpOnly: true,
		maxAge: 0,
		path: "/",
		sameSite: args.cookieConfig.tokenCookieSameSite,
		secure: args.cookieConfig.tokenCookieSecure,
	})

	args.response.cookies.set(GITHUB_STATE_COOKIE_NAME, "", {
		httpOnly: true,
		maxAge: 0,
		path: "/",
		sameSite: "lax",
		secure: getCookieSecureFlag(args.request),
	})
}
