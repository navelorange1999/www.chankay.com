import type { SiteConfig } from "@repo/typescript-config/typings/payload-types"

type MenuItem = NonNullable<NonNullable<NonNullable<SiteConfig["navigation"]>["menuItems"]>>[number]

function normalizePath(path: string): string {
	if (path === "/") return "/"
	return path.replace(/\/+$/, "")
}

export function isNavItemActive(pathname: string, itemUrl: string): boolean {
	const normalizedPathname = normalizePath(pathname)
	const normalizedItemUrl = normalizePath(itemUrl)

	if (normalizedItemUrl === "/") {
		return normalizedPathname === "/"
	}

	return (
		normalizedPathname === normalizedItemUrl ||
		normalizedPathname.startsWith(`${normalizedItemUrl}/`)
	)
}

export function resolveActiveNavUrl(pathname: string, items: MenuItem[]): string {
	let activeUrl = ""

	for (const item of items) {
		if (!isNavItemActive(pathname, item.url)) {
			continue
		}

		if (item.url.length > activeUrl.length) {
			activeUrl = item.url
		}
	}

	return activeUrl
}
