"use client"

import { motion, Variants } from "motion/react"
import { useMemo } from "react"

import { HELLO_WORLD_VIEW_BOX, HELLO_WORLD_PATHS } from "./constants/hello-world"

type Props = React.ComponentProps<typeof motion.svg> & {
	speed?: number
}

function HandWriting({ className, speed = 1, ...props }: Props) {
	const cumulativeDelays = useMemo(() => {
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

	return (
		<motion.svg
			initial="hidden"
			animate="visible"
			viewBox={HELLO_WORLD_VIEW_BOX}
			xmlns="http://www.w3.org/2000/svg"
			fill="transparent"
			strokeWidth={6}
			stroke="currentColor"
			strokeLinecap="round"
			className={className}
			{...props}
		>
			{HELLO_WORLD_PATHS.map(({ path, strokeCount }, index) => (
				<motion.path
					key={index}
					d={path}
					variants={draw}
					custom={{
						delay: cumulativeDelays[index],
						strokeCount,
					}}
				/>
			))}
		</motion.svg>
	)
}
export default HandWriting
