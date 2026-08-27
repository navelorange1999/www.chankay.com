"use client"

import * as React from "react"
import { Check, ChevronDown, Monitor, Moon, Sun } from "lucide-react"

import { cn } from "#utils/classnames"
import { useThemeTransition } from "../../hooks/useThemeTransition"
import { useTheme } from "../../hooks/useTheme"
import type { ThemeMode } from "../../hooks/useTheme"

export interface ThemeToggleProps {
	className?: string
	showSystemOption?: boolean
	variant?: "button" | "dropdown"
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

function resolveDisplayedTheme(
	theme: ThemeMode,
	resolvedTheme: string | undefined
): "light" | "dark" {
	if (theme === "dark" || theme === "light") {
		return theme
	}

	return resolvedTheme === "dark" ? "dark" : "light"
}

function getThemeIcon(
	theme: ThemeMode,
	size: ThemeToggleProps["size"],
	resolvedTheme: string | undefined
) {
	const iconSize = iconSizes[size ?? "md"]

	switch (theme) {
		case "system":
			return <Monitor className={cn(iconSize, "text-primary")} />
		case "dark":
			return <Sun className={cn(iconSize, "text-primary")} />
		case "light":
			return <Moon className={cn(iconSize, "text-primary")} />
		default:
			return resolveDisplayedTheme(theme, resolvedTheme) === "dark" ? (
				<Sun className={cn(iconSize, "text-primary")} />
			) : (
				<Moon className={cn(iconSize, "text-primary")} />
			)
	}
}

export function ThemeToggle({
	className = "",
	showSystemOption = false,
	variant = "button",
	size = "md",
}: ThemeToggleProps) {
	const { theme, resolvedTheme, mounted, setTheme } = useTheme()
	const { getBinaryNextTheme, runThemeTransition } = useThemeTransition({
		resolvedTheme,
		setTheme,
	})
	const [isOpen, setIsOpen] = React.useState(false)

	React.useEffect(() => {
		if (!isOpen) return

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsOpen(false)
			}
		}

		window.addEventListener("keydown", handleKeyDown)

		return () => {
			window.removeEventListener("keydown", handleKeyDown)
		}
	}, [isOpen])

	if (!mounted) {
		return (
			<div className={cn(sizeClasses[size], "rounded-lg", className)}>
				<div className={iconSizes[size]} />
			</div>
		)
	}

	if (variant === "dropdown" && showSystemOption) {
		const themes = [
			{ key: "light" as const, label: "Light" },
			{ key: "dark" as const, label: "Dark" },
			{ key: "system" as const, label: "System" },
		]

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
					aria-label="Select theme"
				>
					<div className="flex items-center gap-2">
						{getThemeIcon(theme, size, resolvedTheme)}
						<ChevronDown
							className={cn(
								iconSizes[size],
								"transition-transform duration-200",
								isOpen && "rotate-180"
							)}
						/>
					</div>
				</button>

				<div
					className={cn(
						"absolute right-0 top-full z-50 mt-2 w-32 origin-top-right rounded-lg border border-border bg-card shadow-lg transition duration-150",
						isOpen
							? "pointer-events-auto translate-y-0 scale-100 opacity-100"
							: "pointer-events-none -translate-y-1 scale-95 opacity-0"
					)}
				>
					{themes.map((themeOption) => (
						<button
							key={themeOption.key}
							type="button"
							onClick={(event) => {
								runThemeTransition(themeOption.key, event.currentTarget)
								setIsOpen(false)
							}}
							className="flex w-full items-center gap-3 px-3 py-2 text-sm text-foreground transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-secondary"
						>
							<div className="flex flex-1 items-center gap-2">
								{getThemeIcon(themeOption.key, size, resolvedTheme)}
								<span>{themeOption.label}</span>
							</div>
							{theme === themeOption.key ? <Check className="h-4 w-4 text-primary" /> : null}
						</button>
					))}
				</div>

				{isOpen ? (
					<button
						type="button"
						className="fixed inset-0 z-40"
						aria-label="Close theme menu"
						onClick={() => setIsOpen(false)}
					/>
				) : null}
			</div>
		)
	}

	return (
		<button
			type="button"
			onClick={(event) => {
				runThemeTransition(getBinaryNextTheme(), event.currentTarget)
			}}
			className={cn(
				"relative overflow-hidden rounded-lg text-foreground transition-colors duration-150 hover:bg-secondary",
				sizeClasses[size],
				className
			)}
			aria-label="Toggle theme"
		>
			<div className="flex items-center justify-center">
				{getThemeIcon(resolveDisplayedTheme(theme, resolvedTheme), size, resolvedTheme)}
			</div>
		</button>
	)
}
