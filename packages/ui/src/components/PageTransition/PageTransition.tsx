"use client"

import * as React from "react"

import { AnimatePresence, motion, type Transition } from "motion/react"
import { usePathname } from "next/navigation"

interface PageTransitionProps {
	children: React.ReactNode
}

const pageVariants = {
	initial: {
		opacity: 0,
		x: -20,
		scale: 0.98,
	},
	in: {
		opacity: 1,
		x: 0,
		scale: 1,
	},
	out: {
		opacity: 0,
		x: 20,
		scale: 0.98,
	},
}

const pageTransition: Transition = {
	type: "tween",
	ease: "anticipate",
	duration: 0.4,
}

export function PageTransition({ children }: PageTransitionProps) {
	const pathname = usePathname()
	const isFirstRender = React.useRef(true)

	React.useEffect(() => {
		isFirstRender.current = false
	}, [])

	return (
		<AnimatePresence mode="wait">
			<motion.div
				key={pathname}
				initial={isFirstRender.current ? false : "initial"}
				animate="in"
				exit="out"
				variants={pageVariants}
				transition={pageTransition}
				className="w-full"
			>
				{children}
			</motion.div>
		</AnimatePresence>
	)
}
