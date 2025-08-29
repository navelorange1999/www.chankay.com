"use client"

import { useTheme } from "../../hooks/useTheme"
import { Sun, Moon, Monitor, ChevronDown, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { cn } from "../../utils/classnames"

export interface ThemeToggleProps {
	className?: string
	showSystemOption?: boolean
	variant?: "button" | "dropdown"
	size?: "sm" | "md" | "lg"
}

export function ThemeToggle({
	className = "",
	showSystemOption = false,
	variant = "button",
	size = "md",
}: ThemeToggleProps) {
	const { theme, resolvedTheme, mounted, toggleTheme, setTheme } = useTheme()
	const [isOpen, setIsOpen] = useState(false)

	if (!mounted) {
		const sizeClasses = {
			sm: "p-1.5",
			md: "p-2",
			lg: "p-3",
		}
		const iconSizes = {
			sm: "h-4 w-4",
			md: "h-5 w-5",
			lg: "h-6 w-6",
		}

		return (
			<div className={cn(sizeClasses[size], "rounded-lg", className)}>
				<div className={iconSizes[size]} />
			</div>
		)
	}

	const sizeClasses = {
		sm: "p-1.5",
		md: "p-2",
		lg: "p-3",
	}

	const iconSizes = {
		sm: "h-4 w-4",
		md: "h-5 w-5",
		lg: "h-6 w-6",
	}

	const getThemeIcon = (currentTheme: string, isResolved?: boolean) => {
		const displayTheme = isResolved ? resolvedTheme : currentTheme

		switch (currentTheme) {
			case "system":
				return <Monitor className={cn(iconSizes[size], "text-purple-500")} />
			case "dark":
				return <Sun className={cn(iconSizes[size], "text-yellow-500")} />
			case "light":
				return <Moon className={cn(iconSizes[size], "text-blue-500")} />
			default:
				return displayTheme === "dark" ? (
					<Sun className={cn(iconSizes[size], "text-yellow-500")} />
				) : (
					<Moon className={cn(iconSizes[size], "text-blue-500")} />
				)
		}
	}

	if (variant === "dropdown" && showSystemOption) {
		const themes = [
			{ key: "light", label: "Light", icon: <Sun className={iconSizes[size]} /> },
			{ key: "dark", label: "Dark", icon: <Moon className={iconSizes[size]} /> },
			{ key: "system", label: "System", icon: <Monitor className={iconSizes[size]} /> },
		]

		return (
			<div className="relative">
				<motion.button
					onClick={() => setIsOpen(!isOpen)}
					className={cn(
						"relative flex items-center gap-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 overflow-hidden",
						sizeClasses[size],
						className
					)}
					aria-label="Select theme"
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
				>
					<div className="relative z-10 flex items-center gap-2">
						<AnimatePresence mode="wait" initial={false}>
							<motion.div
								key={theme}
								initial={{ rotate: -90, opacity: 0, scale: 0.3 }}
								animate={{ rotate: 0, opacity: 1, scale: 1 }}
								exit={{ rotate: 90, opacity: 0, scale: 0.3 }}
								transition={{ duration: 0.2 }}
							>
								{getThemeIcon(theme)}
							</motion.div>
						</AnimatePresence>
						<ChevronDown
							className={cn(
								"transition-transform duration-200",
								iconSizes[size],
								isOpen && "rotate-180"
							)}
						/>
					</div>
				</motion.button>

				<AnimatePresence>
					{isOpen && (
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: -10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: -10 }}
							transition={{ duration: 0.15 }}
							className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
						>
							{themes.map((themeOption) => (
								<button
									key={themeOption.key}
									onClick={() => {
										setTheme(themeOption.key as any)
										setIsOpen(false)
									}}
									className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors"
								>
									<div className="flex items-center gap-2 flex-1">
										{themeOption.icon}
										<span>{themeOption.label}</span>
									</div>
									{theme === themeOption.key && <Check className="h-4 w-4 text-blue-500" />}
								</button>
							))}
						</motion.div>
					)}
				</AnimatePresence>

				{/* Backdrop to close dropdown */}
				{isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
			</div>
		)
	}

	return (
		<motion.button
			onClick={
				showSystemOption ? toggleTheme : () => setTheme(resolvedTheme === "dark" ? "light" : "dark")
			}
			className={cn(
				"relative rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 overflow-hidden",
				sizeClasses[size],
				className
			)}
			aria-label="Toggle theme"
			whileHover={{ scale: 1.1 }}
			whileTap={{ scale: 0.9 }}
		>
			{/* Background glow effect */}
			<motion.div
				className="absolute inset-0 rounded-lg"
				animate={{
					background:
						resolvedTheme === "dark"
							? "radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 70%)"
							: "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
				}}
				transition={{ duration: 0.2 }}
			/>

			{/* Icon container */}
			<div className="relative z-10">
				<AnimatePresence mode="wait" initial={false}>
					<motion.div
						key={showSystemOption ? theme : resolvedTheme}
						initial={{
							rotate: resolvedTheme === "dark" ? -90 : 90,
							opacity: 0,
							scale: 0.3,
						}}
						animate={{
							rotate: 0,
							opacity: 1,
							scale: 1,
						}}
						exit={{
							rotate: resolvedTheme === "dark" ? 90 : -90,
							opacity: 0,
							scale: 0.3,
						}}
						transition={{
							duration: 0.25,
							ease: [0.4, 0, 0.2, 1],
						}}
						className="flex items-center justify-center"
					>
						{showSystemOption ? (
							getThemeIcon(theme)
						) : resolvedTheme === "dark" ? (
							<motion.div
								animate={{ rotate: [0, 360] }}
								transition={{
									duration: 15,
									repeat: Number.POSITIVE_INFINITY,
									ease: "linear",
								}}
							>
								<Sun className={cn(iconSizes[size], "text-yellow-500")} />
							</motion.div>
						) : (
							<motion.div
								animate={{ rotate: [0, -5, 5, 0] }}
								transition={{
									duration: 3,
									repeat: Number.POSITIVE_INFINITY,
									ease: "easeInOut",
								}}
							>
								<Moon className={cn(iconSizes[size], "text-blue-500")} />
							</motion.div>
						)}
					</motion.div>
				</AnimatePresence>
			</div>

			{/* Ripple effect */}
			<motion.div
				className="absolute inset-0 rounded-lg"
				initial={{ scale: 0, opacity: 0.5 }}
				animate={{ scale: 0, opacity: 0.5 }}
				whileTap={{ scale: 1.2, opacity: 0 }}
				transition={{ duration: 0.2 }}
				style={{
					background:
						resolvedTheme === "dark"
							? "radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)"
							: "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)",
				}}
			/>
		</motion.button>
	)
}
