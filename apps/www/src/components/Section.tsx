import * as React from "react"
import Link from "next/link"
import {
	HeroSection,
	FeaturesSection,
	ContentSection,
	StatsSection,
	CTASection,
	type HeroSectionProps,
	type FeaturesSectionProps,
	type ContentSectionProps,
	type StatsSectionProps,
	type CTASectionProps,
} from "@repo/ui"

type SpacingConfig = {
	paddingTop?: "none" | "sm" | "md" | "lg"
	paddingBottom?: "none" | "sm" | "md" | "lg"
}

type HeroSectionData = {
	sectionType: "hero"
	hero: Omit<HeroSectionProps, "LinkComponent" | "spacing">
	spacing?: SpacingConfig
}

type FeaturesSectionData = {
	sectionType: "features"
	features: Omit<FeaturesSectionProps, "spacing">
	spacing?: SpacingConfig
}

type ContentSectionData = {
	sectionType: "content"
	content: Omit<ContentSectionProps, "spacing">
	spacing?: SpacingConfig
}

type StatsSectionData = {
	sectionType: "stats"
	stats: Omit<StatsSectionProps, "spacing">
	spacing?: SpacingConfig
}

type CTASectionData = {
	sectionType: "cta"
	cta: Omit<CTASectionProps, "LinkComponent" | "spacing">
	spacing?: SpacingConfig
}

type Section =
	| HeroSectionData
	| FeaturesSectionData
	| ContentSectionData
	| StatsSectionData
	| CTASectionData

export interface SectionProps {
	sections: Section[]
}

export function Section({ sections }: SectionProps) {
	if (!sections || sections.length === 0) {
		return null
	}

	return (
		<>
			{sections.map((section, index) => {
				switch (section.sectionType) {
					case "hero":
						return (
							<HeroSection
								key={index}
								{...section.hero}
								spacing={section.spacing}
								LinkComponent={Link}
							/>
						)

					case "features":
						return <FeaturesSection key={index} {...section.features} spacing={section.spacing} />

					case "content":
						return <ContentSection key={index} {...section.content} spacing={section.spacing} />

					case "stats":
						return <StatsSection key={index} {...section.stats} spacing={section.spacing} />

					case "cta":
						return (
							<CTASection
								key={index}
								{...section.cta}
								spacing={section.spacing}
								LinkComponent={Link}
							/>
						)

					default: {
						const exhaustiveCheck: never = section
						console.warn(`Unknown section type:`, exhaustiveCheck)
						return null
					}
				}
			})}
		</>
	)
}
