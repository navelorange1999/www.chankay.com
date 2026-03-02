import { SiteConfig } from "@repo/typescript-config/typings/payload-types"
import type { ReactNode } from "react"

type LogoValue = SiteConfig["logo"]

interface ResolveLogoNodeParams {
	showLogo: boolean
	logo: LogoValue
	fallbackLogo?: ReactNode
	renderImageLogo: (logo: Exclude<LogoValue, string | null | undefined>) => ReactNode
}

export const resolveLogoNode = ({
	showLogo,
	logo,
	fallbackLogo,
	renderImageLogo,
}: ResolveLogoNodeParams): ReactNode => {
	if (!showLogo) {
		return null
	}

	if (logo && typeof logo === "object") {
		return renderImageLogo(logo)
	}

	if (fallbackLogo) {
		return fallbackLogo
	}

	return null
}
