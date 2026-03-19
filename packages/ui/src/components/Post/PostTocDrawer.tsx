"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { List, X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "#utils/classnames"
import { Button } from "../Button"

interface PostTocDrawerProps {
	children: React.ReactNode
	className?: string
	title?: string
}

export function PostTocDrawer({ children, className, title = "On this page" }: PostTocDrawerProps) {
	const [isOpen, setIsOpen] = React.useState(false)
	const [isMounted, setIsMounted] = React.useState(false)

	React.useEffect(() => {
		setIsMounted(true)
	}, [])

	React.useEffect(() => {
		if (!isMounted || !isOpen) {
			return
		}

		const previousOverflow = document.body.style.overflow
		document.body.style.overflow = "hidden"

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsOpen(false)
			}
		}

		window.addEventListener("keydown", handleKeyDown)

		return () => {
			document.body.style.overflow = previousOverflow
			window.removeEventListener("keydown", handleKeyDown)
		}
	}, [isMounted, isOpen])

	return (
		<>
			<Button
				size="icon"
				variant="outline"
				className={cn("rounded-lg text-foreground/70 hover:text-foreground", className)}
				onClick={() => setIsOpen(true)}
				aria-expanded={isOpen}
				aria-label={title}
			>
				<List className="h-4 w-4" />
			</Button>

			{isMounted
				? createPortal(
						<AnimatePresence>
							{isOpen ? (
								<div className="fixed inset-x-0 bottom-0 top-[var(--navbar-height,4rem)] z-[60] lg:hidden">
									<motion.button
										type="button"
										className="absolute inset-0 bg-background/55 backdrop-blur-[1px]"
										aria-label="Close table of contents"
										onClick={() => setIsOpen(false)}
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.2, ease: "easeOut" }}
									/>

									<motion.div
										className="absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col border-l border-border bg-background shadow-2xl"
										initial={{ x: "100%" }}
										animate={{ x: 0 }}
										exit={{ x: "100%" }}
										transition={{ duration: 0.24, ease: "easeOut" }}
									>
										<div className="flex items-center justify-between border-b border-border px-4 py-4">
											<div className="flex items-center gap-2">
												<List className="h-4 w-4 text-muted-foreground" />
												<span className="text-sm font-medium text-foreground">{title}</span>
											</div>

											<Button
												size="icon"
												variant="ghost"
												className="rounded-lg"
												onClick={() => setIsOpen(false)}
												aria-label="Close table of contents"
											>
												<X className="h-4 w-4" />
											</Button>
										</div>

										<div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
									</motion.div>
								</div>
							) : null}
						</AnimatePresence>,
						document.body
					)
				: null}
		</>
	)
}
