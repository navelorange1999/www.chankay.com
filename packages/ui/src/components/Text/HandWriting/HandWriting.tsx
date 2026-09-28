import * as React from "react"
import { Handwriting } from "@chankay/handwriting/react"
import type { HandwritingArtifact } from "@chankay/handwriting/schema"
import { cn } from "#utils/classnames"

export interface HandWritingProps {
	as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div"
	text?: string
	artifact?: HandwritingArtifact | null
	duration?: number
	animate?: boolean
	strokeWidth?: number
	className?: string
	svgClassName?: string
}

export default function HandWriting({
	as: Wrapper = "div",
	text,
	artifact,
	duration = 5,
	animate = true,
	strokeWidth = 0.75,
	className,
	svgClassName,
}: HandWritingProps) {
	const label = text ?? artifact?.text ?? "Hello world"
	const ready = artifact && artifact.text === label
	return (
		<Wrapper className={cn("inline-flex items-center justify-center", className)}>
			{ready ? (
				<>
					<span className="sr-only">{label}</span>
					<span aria-hidden="true" className="contents">
						<Handwriting
							artifact={artifact}
							duration={duration}
							animate={animate}
							strokeWidth={strokeWidth}
							className={cn("h-full w-full", svgClassName)}
						/>
					</span>
				</>
			) : (
				<span>{label}</span>
			)}
		</Wrapper>
	)
}
