import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";

export function middleware(request: NextRequest) {
	// Redirect /login to /auth/login
	if (request.nextUrl.pathname === "/login") {
		return NextResponse.redirect(new URL("/auth/login", request.url));
	}
}

export const config = {
	matcher: "/login",
};
