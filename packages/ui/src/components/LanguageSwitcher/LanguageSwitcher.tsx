"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Check, ChevronDown, Globe } from "lucide-react"

import {
	getLocaleConfig,
	resolveLocalizedPath,
	stripLocalePrefix,
	SUPPORTED_LOCALES,
	type SupportedLocale,
} from "@repo/i18n"

import { cn } from "#utils/classnames"

export interface LanguageSwitcherProps {
	currentLocale: SupportedLocale
	className?: string
	size?: "sm" | "md" | "lg"
}

const sizeClasses = {
	sm: "p-1.5",
	md: "p-2",
	lg: "p-3",
} as const

const iconSizes = {
	sm: "h-4 w-4",
	md: "h-5 w-5",
	lg: "h-6 w-6",
} as const

export function LanguageSwitcher({ currentLocale, className, size = "md" }: LanguageSwitcherProps) {
	const pathname = usePathname() ?? "/"
	const [isOpen, setIsOpen] = React.useState(false)
	const { path: unprefixedPath } = stripLocalePrefix(pathname)

	React.useEffect(() => {
		if (!isOpen) return

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsOpen(false)
			}
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [isOpen])

	const currentLocaleConfig = getLocaleConfig(currentLocale)

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setIsOpen((current) => !current)}
				className={cn(
					"relative flex items-center gap-2 overflow-hidden rounded-lg text-foreground transition-colors duration-150 hover:bg-secondary",
					sizeClasses[size],
					className
				)}
				aria-expanded={isOpen}
				aria-label="Select language"
			>
				<Globe className={cn(iconSizes[size], "text-primary")} />
				<span className="hidden text-sm font-medium md:inline">
					{currentLocaleConfig?.flag ?? currentLocale}
				</span>
				<ChevronDown
					className={cn(
						iconSizes[size],
						"transition-transform duration-200",
						isOpen && "rotate-180"
					)}
				/>
			</button>

			<div
				className={cn(
					"absolute right-0 top-full z-50 mt-2 w-44 origin-top-right rounded-lg border border-border bg-card shadow-lg transition duration-150",
					isOpen
						? "pointer-events-auto translate-y-0 scale-100 opacity-100"
						: "pointer-events-none -translate-y-1 scale-95 opacity-0"
				)}
			>
				{SUPPORTED_LOCALES.map((locale) => {
					const config = getLocaleConfig(locale)
					const targetHref = resolveLocalizedPath(locale, unprefixedPath)
					const isActive = locale === currentLocale

					return (
						<Link
							key={locale}
							href={targetHref}
							onClick={() => setIsOpen(false)}
							className="flex w-full items-center gap-3 px-3 py-2 text-sm text-foreground transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-secondary"
							hrefLang={locale}
						>
							<span className="text-base leading-none">{config?.flag ?? "🌐"}</span>
							<span className="flex-1">{config?.name ?? locale}</span>
							{isActive ? <Check className="h-4 w-4 text-primary" /> : null}
						</Link>
					)
				})}
			</div>

			{isOpen ? (
				<button
					type="button"
					className="fixed inset-0 z-40"
					aria-label="Close language menu"
					onClick={() => setIsOpen(false)}
				/>
			) : null}
		</div>
	)
}
