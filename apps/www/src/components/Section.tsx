import * as React from "react"
import Link from "next/link"
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	HeroSection,
	HandWriting,
	ImageMedia,
	Text,
	type HeroSectionProps,
} from "@repo/ui"
import type { MediaInterface } from "@repo/typescript-config/typings/payload-types"

type SpacingConfig = {
	paddingTop?: "none" | "sm" | "md" | "lg"
	paddingBottom?: "none" | "sm" | "md" | "lg"
}

type HeroSectionData = {
	blockType: "hero"
	hero: Omit<HeroSectionProps, "LinkComponent" | "spacing" | "children"> & {
		contentBlocks?: SectionContentBlock[]
	}
	spacing?: SpacingConfig
}

type Section = HeroSectionData

type SectionContentBlock =
	| {
			id?: string
			blockType: "text"
			content?: string
			as?: "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4"
			size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl"
			weight?: "normal" | "medium" | "semibold" | "bold"
			tone?: "default" | "muted" | "primary" | "accent"
			align?: "left" | "center" | "right"
	  }
	| {
			id?: string
			blockType: "handWriting"
			speed?: number
			as?: "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4"
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
	| {
			id?: string
			blockType: "button"
			label: string
			href: string
			variant?: "primary" | "secondary"
			external?: boolean
	  }

function renderContentBlocks(blocks: SectionContentBlock[] | undefined) {
	if (!blocks || blocks.length === 0) return null

	return (
		<div className="flex flex-col gap-6">
			{blocks.map((block, index) => {
				const key = block.id ?? `${block.blockType}-${index}`

				switch (block.blockType) {
					case "text": {
						if (!block.content) return null

						return (
							<Text
								key={key}
								as={block.as ?? "p"}
								size={block.size ?? "base"}
								weight={block.weight ?? "normal"}
								tone={block.tone ?? "default"}
								align={block.align ?? "left"}
								className="whitespace-pre-wrap"
							>
								{block.content}
							</Text>
						)
					}

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

					case "button":
						return (
							<div key={key} className="flex justify-center">
								<Button asChild variant={block.variant === "secondary" ? "secondary" : "default"}>
									<Link href={block.href} target={block.external ? "_blank" : undefined}>
										{block.label}
									</Link>
								</Button>
							</div>
						)

					default: {
						const exhaustiveCheck: never = block
						console.warn(`Unknown content block type:`, exhaustiveCheck)
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
				if (section.blockType !== "hero") return null

				return (
					<HeroSection key={index} {...section.hero} spacing={section.spacing} LinkComponent={Link}>
						{renderContentBlocks(section.hero.contentBlocks)}
					</HeroSection>
				)
			})}
		</>
	)
}
