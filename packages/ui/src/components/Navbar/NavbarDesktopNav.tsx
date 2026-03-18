"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"

import type { SiteConfig } from "@repo/typescript-config/typings/payload-types"

import { cn } from "#utils/classnames"
import { useSlidingIndicator } from "#hooks/useSlidingIndicator"

type MenuItem = NonNullable<NonNullable<NonNullable<SiteConfig["navigation"]>["menuItems"]>>[number]

export interface NavbarDesktopNavProps {
	items: MenuItem[]
}

export function NavbarDesktopNav({ items }: NavbarDesktopNavProps) {
	const pathname = usePathname()
	const { containerRef, setItemRef, indicator } = useSlidingIndicator(pathname)

	return (
		<div
			ref={containerRef}
			className="relative hidden md:flex md:flex-1 md:items-center md:justify-start md:pl-10 md:gap-2"
		>
			{items.map((item: MenuItem) => {
				const isActive = pathname === item.url

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
				<motion.span
					className="absolute bottom-0 h-0.5 rounded-full bg-primary pointer-events-none"
					animate={{
						left: indicator.left,
						width: indicator.width,
					}}
					transition={{
						type: "spring",
						stiffness: 350,
						damping: 30,
					}}
				/>
			) : null}
		</div>
	)
}
