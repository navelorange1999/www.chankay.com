"use client";

import * as React from "react";
import {useState} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {Menu, X} from "lucide-react";
import {motion, AnimatePresence} from "framer-motion";
import Image from "next/image";

import {NavbarProps} from "@repo/typescript-config/typings/payload-types";
import {ThemeToggle} from "../ThemeProvider";

export const Navbar: React.FC<NavbarProps> = ({
	logo,
	title,
	items = [],
	className = "",
}) => {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const pathname = usePathname();

	const toggleMobileMenu = () => {
		setMobileMenuOpen(!mobileMenuOpen);
	};

	return (
		<nav
			className={`${className} bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700`}
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					{/* Logo */}
					<div className="flex-shrink-0">
						<Link href="/" className="flex items-center">
							{logo ? (
								<Image
									width={32}
									height={32}
									className="h-8 w-8"
									src={logo}
									alt={title || "Kay Chan Site"}
								/>
							) : (
								<>
									<div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
										<span className="text-white font-bold text-lg">
											L
										</span>
									</div>
									<span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white"></span>
								</>
							)}
						</Link>
					</div>

					{/* Desktop Navigation - Centered */}
					<div className="hidden md:flex md:items-center md:space-x-8 flex-1 justify-center">
						<AnimatePresence mode="wait">
							{items?.map((item, index) => {
								const isActive = pathname === item.href;
								return (
									<motion.div
										key={item.label}
										initial={{opacity: 0, x: -20}}
										animate={{opacity: 1, x: 0}}
										exit={{opacity: 0, x: 20}}
										transition={{
											duration: 0.3,
											delay: index * 0.1,
											ease: "easeInOut",
										}}
										whileHover={{scale: 1.05}}
										whileTap={{scale: 0.95}}
									>
										<Link
											href={item.href}
											className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200 hover:text-yellow-600 ${
												isActive
													? "text-yellow-600 dark:text-yellow-400"
													: "text-gray-700 dark:text-gray-300"
											}`}
										>
											{item.label}
											{isActive && (
												<motion.span
													className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-600 dark:bg-yellow-400 rounded-full"
													layoutId="activeIndicator"
													transition={{
														type: "spring",
														stiffness: 300,
														damping: 30,
													}}
												/>
											)}
										</Link>
									</motion.div>
								);
							})}
						</AnimatePresence>
					</div>

					{/* Theme Toggle - Desktop */}
					<div className="hidden md:flex md:items-center">
						<ThemeToggle />
					</div>

					{/* Mobile menu button */}
					<div className="md:hidden flex items-center space-x-2">
						{/* Mobile Theme Toggle */}
						<ThemeToggle />

						{/* Hamburger Menu */}
						<button
							onClick={toggleMobileMenu}
							className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
							aria-label="Toggle mobile menu"
						>
							{mobileMenuOpen ? (
								<X className="h-6 w-6" />
							) : (
								<Menu className="h-6 w-6" />
							)}
						</button>
					</div>
				</div>

				{/* Mobile Navigation Menu */}
				<AnimatePresence>
					{mobileMenuOpen && (
						<motion.div
							className="md:hidden"
							initial={{opacity: 0, height: 0}}
							animate={{opacity: 1, height: "auto"}}
							exit={{opacity: 0, height: 0}}
							transition={{duration: 0.3, ease: "easeInOut"}}
						>
							<div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200 dark:border-gray-700">
								{items?.map((item, index) => {
									const isActive = pathname === item.href;
									return (
										<motion.div
											key={item.label}
											initial={{opacity: 0, x: -30}}
											animate={{opacity: 1, x: 0}}
											transition={{
												duration: 0.3,
												delay: index * 0.1,
												ease: "easeOut",
											}}
										>
											<Link
												href={item.href}
												onClick={() =>
													setMobileMenuOpen(false)
												}
												className={`block px-3 py-2 text-base font-medium rounded-lg transition-colors duration-200 hover:text-yellow-600 hover:bg-gray-50 dark:hover:bg-gray-700 ${
													isActive
														? "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-gray-700"
														: "text-gray-700 dark:text-gray-300"
												}`}
											>
												{item.label}
											</Link>
										</motion.div>
									);
								})}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</nav>
	);
};
