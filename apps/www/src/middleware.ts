import { NextResponse, type NextRequest } from "next/server"

import { DEFAULT_LOCALE, isSupportedLocale } from "@repo/i18n"

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl
	const [, firstSegment] = pathname.split("/")

	if (isSupportedLocale(firstSegment)) {
		return NextResponse.next()
	}

	const url = request.nextUrl.clone()
	url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`
	return NextResponse.rewrite(url)
}

export const config = {
	matcher: ["/((?!api|_next|.*\\..*).*)"],
}
