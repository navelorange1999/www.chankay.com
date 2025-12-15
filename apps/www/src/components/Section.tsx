import * as React from "react"
import Link from "next/link"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	HeroSection,
	FeaturesSection,
	ContentSection,
	StatsSection,
	CTASection,
	HandWriting,
	ImageMedia,
	type HeroSectionProps,
	type FeaturesSectionProps,
	type ContentSectionProps,
	type StatsSectionProps,
	type CTASectionProps,
} from "@repo/ui"
import type { MediaInterface } from "@repo/typescript-config/typings/payload-types"

type SpacingConfig = {
	paddingTop?: "none" | "sm" | "md" | "lg"
	paddingBottom?: "none" | "sm" | "md" | "lg"
}

type HeroSectionData = {
	blockType: "hero"
	hero: Omit<HeroSectionProps, "LinkComponent" | "spacing" | "children"> & {
		contentBlocks?: HeroContentBlock[]
	}
	spacing?: SpacingConfig
}

type FeaturesSectionData = {
	blockType: "features"
	features: Omit<FeaturesSectionProps, "spacing">
	spacing?: SpacingConfig
}

type ContentSectionData = {
	blockType: "content"
	content: Omit<ContentSectionProps, "spacing">
	spacing?: SpacingConfig
}

type StatsSectionData = {
	blockType: "stats"
	stats: Omit<StatsSectionProps, "spacing">
	spacing?: SpacingConfig
}

type CTASectionData = {
	blockType: "cta"
	cta: Omit<CTASectionProps, "LinkComponent" | "spacing">
	spacing?: SpacingConfig
}

type Section =
	| HeroSectionData
	| FeaturesSectionData
	| ContentSectionData
	| StatsSectionData
	| CTASectionData

type HeroContentBlock =
	| {
			id?: string
			blockType: "handWriting"
			speed?: number
	  }
	| {
			id?: string
			blockType: "mediaImage"
			media: MediaInterface | string
	  }
	| {
			id?: string
			blockType: "card"
			title: string
			description?: string
	  }

function renderHeroContentBlocks(blocks: HeroContentBlock[] | undefined) {
	if (!blocks || blocks.length === 0) return null

	return (
		<div className="flex flex-col gap-6">
			{blocks.map((block, index) => {
				const key = block.id ?? `${block.blockType}-${index}`

				switch (block.blockType) {
					case "handWriting":
						return (
							<div key={key} className="flex justify-center text-primary">
								<HandWriting className="w-[260px] md:w-[360px]" speed={block.speed ?? 1} />
							</div>
						)

					case "mediaImage":
						return (
							<div key={key} className="mx-auto w-full max-w-3xl">
								<ImageMedia
									pictureClassName="block relative w-full aspect-[16/9] overflow-hidden rounded-xl border"
									imgClassName="object-cover"
									fill
									resource={block.media}
									priority
								/>
							</div>
						)

					case "card":
						return (
							<Card key={key} className="mx-auto w-full max-w-2xl">
								<CardHeader>
									<CardTitle>{block.title}</CardTitle>
									{block.description && <CardDescription>{block.description}</CardDescription>}
								</CardHeader>
								<CardContent />
							</Card>
						)

					default: {
						const exhaustiveCheck: never = block
						console.warn(`Unknown hero block type:`, exhaustiveCheck)
						return null
					}
				}
			})}
		</div>
	)
}

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
				switch (section.blockType) {
					case "hero":
						return (
							<HeroSection
								key={index}
								{...section.hero}
								spacing={section.spacing}
								LinkComponent={Link}
							>
								{renderHeroContentBlocks(section.hero.contentBlocks)}
							</HeroSection>
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
						console.warn(`Unknown section block type:`, exhaustiveCheck)
						return null
					}
				}
			})}
		</>
	)
}
