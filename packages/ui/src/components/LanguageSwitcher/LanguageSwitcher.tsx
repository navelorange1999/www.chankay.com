"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Check, ChevronDown, Globe } from "lucide-react"

import {
	getLocaleConfig,
	getUiStrings,
	resolveLocalizedPath,
	stripLocalePrefix,
	SUPPORTED_LOCALES,
	type SupportedLocale,
} from "@repo/i18n"

import { cn } from "#utils/classnames"
import { useLocale } from "../LocaleProvider"

export interface LanguageSwitcherProps {
	currentLocale?: SupportedLocale
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

const chevronSizes = {
	sm: "h-3 w-3",
	md: "h-4 w-4",
	lg: "h-5 w-5",
} as const

export function LanguageSwitcher({ currentLocale, className, size = "md" }: LanguageSwitcherProps) {
	const localeContext = useLocale()
	const resolvedLocale = currentLocale ?? localeContext.locale
	const strings =
		resolvedLocale === localeContext.locale ? localeContext.strings : getUiStrings(resolvedLocale)
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

	const currentLocaleConfig = getLocaleConfig(resolvedLocale)

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setIsOpen((current) => !current)}
				className={cn(
					"group relative flex items-center gap-2 overflow-hidden rounded-lg text-foreground transition-colors duration-150 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
					sizeClasses[size],
					className
				)}
				aria-expanded={isOpen}
				aria-label={strings.accessibility.selectLanguage}
			>
				<Globe className={cn(iconSizes[size], "text-primary")} />
				<span className="whitespace-nowrap text-sm font-medium">
					{currentLocaleConfig?.name ?? resolvedLocale}
				</span>
				<ChevronDown
					className={cn(
						chevronSizes[size],
						"shrink-0 text-muted-foreground transition-[color,transform] duration-200 group-hover:text-accent-foreground",
						isOpen && "rotate-180"
					)}
				/>
			</button>

			<div
				className={cn(
					"absolute right-0 top-full z-50 mt-2 w-36 origin-top-right rounded-lg border border-border bg-card shadow-md transition duration-150",
					isOpen
						? "pointer-events-auto translate-y-0 scale-100 opacity-100"
						: "pointer-events-none -translate-y-1 scale-95 opacity-0"
				)}
			>
				{SUPPORTED_LOCALES.map((locale) => {
					const config = getLocaleConfig(locale)
					const targetHref = resolveLocalizedPath(locale, unprefixedPath)
					const isActive = locale === resolvedLocale

					return (
						<Link
							key={locale}
							href={targetHref}
							onClick={() => setIsOpen(false)}
							className={cn(
								"flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
								isActive ? "bg-accent text-accent-foreground" : "text-foreground"
							)}
							hrefLang={locale}
						>
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
					aria-label={strings.accessibility.closeLanguageMenu}
					onClick={() => setIsOpen(false)}
				/>
			) : null}
		</div>
	)
}
