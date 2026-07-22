import { NextResponse, type NextRequest } from "next/server"

import { DEFAULT_LOCALE, isSupportedLocale } from "@repo/i18n"

export function resolveMiddlewareRewrite(pathname: string): string | null {
	const [, firstSegment] = pathname.split("/")

	if (isSupportedLocale(firstSegment)) {
		return null
	}

	return `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`
}

export function middleware(request: NextRequest) {
	const rewritePath = resolveMiddlewareRewrite(request.nextUrl.pathname)
	if (!rewritePath) {
		return NextResponse.next()
	}

	const url = request.nextUrl.clone()
	url.pathname = rewritePath
	return NextResponse.rewrite(url)
}

export const config = {
	matcher: ["/((?!api|_next|.*\\..*).*)"],
}
