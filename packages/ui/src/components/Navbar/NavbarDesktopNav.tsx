"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import type { SiteConfig } from "@repo/typescript-config/typings/payload-types"

import { cn } from "#utils/classnames"
import { useSlidingIndicator } from "#hooks/useSlidingIndicator"
import { resolveActiveNavUrl } from "./utils"

type MenuItem = NonNullable<NonNullable<NonNullable<SiteConfig["navigation"]>["menuItems"]>>[number]

export interface NavbarDesktopNavProps {
	items: MenuItem[]
}

export function NavbarDesktopNav({ items }: NavbarDesktopNavProps) {
	const pathname = usePathname()
	const activeUrl = resolveActiveNavUrl(pathname, items)
	const { containerRef, setItemRef, indicator } = useSlidingIndicator(activeUrl)

	return (
		<div
			ref={containerRef}
			className="relative hidden md:flex md:flex-1 md:items-center md:justify-start md:gap-2 md:pl-10"
		>
			{items.map((item: MenuItem) => {
				const isActive = activeUrl === item.url

				return (
					<Link
						key={item.label}
						ref={(el) => setItemRef(item.url, el)}
						href={item.url}
						className={cn(
							"relative px-3 py-2 text-sm font-medium transition-colors duration-200 hover:text-primary",
							isActive ? "text-primary" : "text-muted-foreground"
						)}
					>
						{item.label}
					</Link>
				)
			})}

			{indicator ? (
				<span
					className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-primary transition-[left,width] duration-300 ease-out"
					style={{
						left: indicator.left,
						width: indicator.width,
					}}
					aria-hidden="true"
				/>
			) : null}
		</div>
	)
}
