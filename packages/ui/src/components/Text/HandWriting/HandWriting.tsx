"use client"

import * as React from "react"
import { motion, type Variants } from "motion/react"
import { cn } from "#/utils/classnames"

import { HELLO_WORLD_VIEW_BOX, HELLO_WORLD_PATHS } from "./constants/hello-world"

export interface HandWritingProps {
	/**
	 * Semantic HTML element to wrap the SVG
	 * Use h1-h6 for headings, p for paragraphs, span for inline text
	 */
	as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div"
	/**
	 * Text content for SEO and accessibility
	 * This will be hidden visually but readable by screen readers and search engines
	 */
	text?: string
	/**
	 * Animation speed multiplier (default: 1)
	 */
	speed?: number
	/**
	 * Additional className for the wrapper element
	 */
	className?: string
	/**
	 * Additional className for the SVG element
	 */
	svgClassName?: string
}

function HandWriting({ as = "div", text, speed = 1, className, svgClassName }: HandWritingProps) {
	const cumulativeDelays = React.useMemo(() => {
		const delays: number[] = []
		let totalDuration = 0

		HELLO_WORLD_PATHS.forEach(({ strokeCount }) => {
			delays.push(totalDuration)
			const duration = (0.5 * strokeCount) / speed
			totalDuration += duration
		})

		return delays
	}, [speed])

	const draw: Variants = {
		hidden: { pathLength: 0, opacity: 0 },
		visible: ({ delay, strokeCount }: { delay: number; strokeCount: number }) => {
			return {
				pathLength: 1,
				opacity: 1,
				transition: {
					pathLength: {
						delay,
						type: "spring",
						duration: (1 * strokeCount) / speed,
						bounce: 0,
					},
					opacity: { delay, duration: 0.01 },
				},
			}
		},
	}

	// Generate unique ID for aria-labelledby
	const titleId = React.useId()
	const descId = React.useId()

	const Wrapper = as

	return (
		<Wrapper className={cn("inline-flex items-center justify-center", className)}>
			{/* Screen reader only text for SEO and accessibility */}
			{text && (
				<span className="sr-only" aria-hidden="false">
					{text}
				</span>
			)}
			<motion.svg
				viewBox={HELLO_WORLD_VIEW_BOX}
				xmlns="http://www.w3.org/2000/svg"
				fill="transparent"
				strokeWidth={6}
				stroke="currentColor"
				strokeLinecap="round"
				className={svgClassName}
				aria-label={text || "Handwriting animation"}
				aria-labelledby={text ? titleId : undefined}
				role="img"
			>
				{/* SVG title and description for SEO */}
				{text && (
					<>
						<title id={titleId}>{text}</title>
						<desc id={descId}>Animated handwriting of: {text}</desc>
					</>
				)}
				{HELLO_WORLD_PATHS.map(({ path, strokeCount }, index) => (
					<motion.path
						key={index}
						d={path}
						initial="hidden"
						animate="visible"
						variants={draw}
						custom={{
							delay: cumulativeDelays[index],
							strokeCount,
						}}
					/>
				))}
			</motion.svg>
		</Wrapper>
	)
}
export default HandWriting
