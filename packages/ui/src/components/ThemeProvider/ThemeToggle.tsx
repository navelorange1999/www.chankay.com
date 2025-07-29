"use client";

import {useTheme} from "next-themes";
import {Sun, Moon} from "lucide-react";
import {motion, AnimatePresence} from "framer-motion";
import {useEffect, useState} from "react";

interface ThemeToggleProps {
	className?: string;
}

export function ThemeToggle({className = ""}: ThemeToggleProps) {
	const [mounted, setMounted] = useState(false);
	const {theme, setTheme} = useTheme();

	useEffect(() => {
		setMounted(true);
	}, []);

	const toggleTheme = () => {
		setTheme(theme === "dark" ? "light" : "dark");
	};

	if (!mounted) {
		return (
			<div className={`p-2 rounded-lg ${className}`}>
				<div className="h-5 w-5" />
			</div>
		);
	}

	return (
		<motion.button
			onClick={toggleTheme}
			className={`relative p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 overflow-hidden ${className}`}
			aria-label="Toggle theme"
			whileHover={{scale: 1.1}}
			whileTap={{scale: 0.9}}
		>
			{/* Background glow effect */}
			<motion.div
				className="absolute inset-0 rounded-lg"
				animate={{
					background:
						theme === "dark"
							? "radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 70%)"
							: "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
				}}
				transition={{duration: 0.2}}
			/>

			{/* Icon container */}
			<div className="relative z-10">
				<AnimatePresence mode="wait" initial={false}>
					<motion.div
						key={theme === "dark" ? "sun" : "moon"}
						initial={{
							rotate: theme === "dark" ? -90 : 90,
							opacity: 0,
							scale: 0.3,
						}}
						animate={{
							rotate: 0,
							opacity: 1,
							scale: 1,
						}}
						exit={{
							rotate: theme === "dark" ? 90 : -90,
							opacity: 0,
							scale: 0.3,
						}}
						transition={{
							duration: 0.25,
							ease: [0.4, 0, 0.2, 1],
						}}
						className="flex items-center justify-center"
					>
						{theme === "dark" ? (
							<motion.div
								animate={{
									rotate: [0, 360],
								}}
								transition={{
									duration: 15,
									repeat: Number.POSITIVE_INFINITY,
									ease: "linear",
								}}
							>
								<Sun className="h-5 w-5 text-yellow-500" />
							</motion.div>
						) : (
							<motion.div
								animate={{
									rotate: [0, -5, 5, 0],
								}}
								transition={{
									duration: 3,
									repeat: Number.POSITIVE_INFINITY,
									ease: "easeInOut",
								}}
							>
								<Moon className="h-5 w-5 text-blue-500" />
							</motion.div>
						)}
					</motion.div>
				</AnimatePresence>
			</div>

			{/* Ripple effect */}
			<motion.div
				className="absolute inset-0 rounded-lg"
				initial={{scale: 0, opacity: 0.5}}
				animate={{scale: 0, opacity: 0.5}}
				whileTap={{scale: 1.2, opacity: 0}}
				transition={{duration: 0.2}}
				style={{
					background:
						theme === "dark"
							? "radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)"
							: "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)",
				}}
			/>
		</motion.button>
	);
}
