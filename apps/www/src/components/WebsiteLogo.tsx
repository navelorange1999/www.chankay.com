import * as React from "react"

import { cn } from "@repo/ui"

export interface WebsiteLogoProps extends React.HTMLAttributes<HTMLSpanElement> {
	title?: string
}

export function WebsiteLogo({
	title = "Website logo",
	className,
	style,
	...props
}: WebsiteLogoProps) {
	return (
		<span
			role="img"
			aria-label={title}
			className={cn("inline-block bg-current", className)}
			style={{
				WebkitMaskImage: "url('/favicon/website-logo.svg')",
				maskImage: "url('/favicon/website-logo.svg')",
				WebkitMaskRepeat: "no-repeat",
				maskRepeat: "no-repeat",
				WebkitMaskPosition: "center",
				maskPosition: "center",
				WebkitMaskSize: "contain",
				maskSize: "contain",
				...style,
			}}
			{...props}
		/>
	)
}
