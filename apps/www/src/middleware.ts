import { NextResponse, type NextRequest } from "next/server"

import { DEFAULT_LOCALE, isSupportedLocale } from "@repo/i18n"

const LOCALE_HEADER = "x-locale"

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl
	const [, firstSegment] = pathname.split("/")

	const requestHeaders = new Headers(request.headers)

	if (isSupportedLocale(firstSegment)) {
		requestHeaders.set(LOCALE_HEADER, firstSegment)
		return NextResponse.next({
			request: { headers: requestHeaders },
		})
	}

	requestHeaders.set(LOCALE_HEADER, DEFAULT_LOCALE)
	const url = request.nextUrl.clone()
	url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`
	return NextResponse.rewrite(url, {
		request: { headers: requestHeaders },
	})
}

export const config = {
	matcher: ["/((?!api|_next|.*\\..*).*)"],
}
