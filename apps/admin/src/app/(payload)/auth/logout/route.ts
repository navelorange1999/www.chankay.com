import { NextRequest, NextResponse } from "next/server"
import {
	bestEffortLogoutSession,
	clearAuthCookies,
	resolveAuthCookieConfig,
} from "@/auth/logout"

const LOGIN_PATH = "/auth/login"

export async function GET(request: NextRequest) {
	const cookieConfig = await resolveAuthCookieConfig(request)
	await bestEffortLogoutSession(request)

	const response = NextResponse.redirect(new URL(LOGIN_PATH, request.url), 302)

	clearAuthCookies({
		cookieConfig,
		request,
		response,
	})

	return response
}
