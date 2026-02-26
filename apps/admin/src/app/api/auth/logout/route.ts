import { NextRequest, NextResponse } from "next/server"
import {
	bestEffortLogoutSession,
	clearAuthCookies,
	resolveAuthCookieConfig,
} from "@/auth/logout"

export async function POST(request: NextRequest) {
	const cookieConfig = await resolveAuthCookieConfig(request)
	await bestEffortLogoutSession(request)

	const response = NextResponse.json({
		ok: true,
	})

	clearAuthCookies({
		cookieConfig,
		request,
		response,
	})

	return response
}
