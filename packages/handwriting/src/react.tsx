import type { CSSProperties } from "react"
import { validateArtifact, type HandwritingArtifact } from "./schema.js"
export interface HandwritingProps {
	artifact: HandwritingArtifact
	speed?: number
	animate?: boolean
	strokeWidth?: number
	className?: string
	style?: CSSProperties
}
const animationStyles = `
@keyframes chankay-handwriting-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
.chankay-handwriting .chankay-handwriting-path[data-animated="true"] {
  stroke-dasharray: 1;
  animation: chankay-handwriting-draw var(--chankay-handwriting-duration) linear var(--chankay-handwriting-delay) both;
}
@media (prefers-reduced-motion: reduce) {
  .chankay-handwriting .chankay-handwriting-path[data-animated="true"] {
    animation: none; stroke-dashoffset: 0;
  }
}`
/** Server-renderable SVG: no model, browser API, hydration, or client directive is needed. */
export function Handwriting({
	artifact,
	speed = 1,
	animate = true,
	strokeWidth = 0.75,
	className,
	style,
}: HandwritingProps) {
	const validated = validateArtifact(artifact)
	if (!Number.isFinite(speed) || speed < 0.1 || speed > 10)
		throw new Error("Animation speed must be between 0.1 and 10.")
	if (!Number.isFinite(strokeWidth) || strokeWidth < 0.1 || strokeWidth > 3)
		throw new Error("Stroke width must be between 0.1 and 3.")
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox={validated.viewBox.join(" ")}
			role="img"
			aria-label={validated.text}
			className={["chankay-handwriting", className].filter(Boolean).join(" ")}
			style={style}
		>
			<title>{validated.text}</title>
			{animate && <style>{animationStyles}</style>}
			<g
				fill="none"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				{validated.strokes.map((stroke, index) => (
					<path
						key={index}
						className="chankay-handwriting-path"
						d={stroke.d}
						pathLength={1}
						data-animated={animate ? "true" : undefined}
						style={
							animate
								? ({
										"--chankay-handwriting-duration": `${stroke.duration / speed}s`,
										"--chankay-handwriting-delay": `${stroke.delay / speed}s`,
									} as CSSProperties)
								: undefined
						}
					/>
				))}
			</g>
		</svg>
	)
}
