import * as React from "react"

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
	href: string
	children: React.ReactNode
	prefetch?: boolean
	replace?: boolean
	scroll?: boolean
	shallow?: boolean
	locale?: string | false
	passHref?: boolean
	legacyBehavior?: boolean
}

// Mock Next.js Link component for Storybook
const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(({ href, children, ...props }, ref) => {
	return (
		<a ref={ref} href={href} {...props}>
			{children}
		</a>
	)
})

Link.displayName = "Link"

export default Link
