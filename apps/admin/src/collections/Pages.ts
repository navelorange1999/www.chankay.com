import type { CollectionConfig } from "payload"

export const Pages: CollectionConfig = {
	slug: "pages",
	admin: {
		useAsTitle: "title",
		defaultColumns: ["title", "slug", "status", "updatedAt"],
	},
	access: {
		read: () => true,
	},
	fields: [
		{
			name: "title",
			type: "text",
			required: true,
			label: "Page Title",
		},
		{
			name: "slug",
			type: "text",
			required: true,
			unique: true,
			label: "URL Slug",
			admin: {
				description: "URL path for this page (e.g., 'home', 'about')",
			},
		},
		{
			name: "status",
			type: "select",
			required: true,
			defaultValue: "draft",
			options: [
				{ label: "Draft", value: "draft" },
				{ label: "Published", value: "published" },
			],
		},
		{
			name: "sections",
			type: "blocks",
			label: "Page Sections",
			admin: {
				description: "Build your page by adding, arranging, and configuring blocks",
			},
			blocks: [
				{
					slug: "hero",
					labels: {
						singular: "Hero",
						plural: "Heroes",
					},
					fields: [
						{
							name: "hero",
							type: "group",
							label: "Hero Section Settings",
							fields: [
								{
									name: "title",
									type: "text",
									required: true,
									label: "Main Title",
								},
								{
									name: "subtitle",
									type: "textarea",
									label: "Subtitle",
								},
								{
									name: "contentBlocks",
									type: "blocks",
									label: "Hero Content Blocks",
									admin: {
										description:
											"Add optional blocks inside the hero (e.g. HandWriting, Media, Card). Order matters.",
									},
									blocks: [
										{
											slug: "handWriting",
											labels: {
												singular: "HandWriting",
												plural: "HandWriting",
											},
											fields: [
												{
													name: "speed",
													type: "number",
													label: "Animation Speed",
													defaultValue: 1,
													min: 0.1,
													max: 10,
												},
											],
										},
										{
											slug: "mediaImage",
											labels: {
												singular: "Image",
												plural: "Images",
											},
											fields: [
												{
													name: "media",
													type: "upload",
													relationTo: "media",
													required: true,
													label: "Image",
												},
											],
										},
										{
											slug: "card",
											labels: {
												singular: "Card",
												plural: "Cards",
											},
											fields: [
												{
													name: "title",
													type: "text",
													required: true,
													label: "Card Title",
												},
												{
													name: "description",
													type: "textarea",
													label: "Card Description",
												},
											],
										},
									],
								},
								{
									name: "alignment",
									type: "radio",
									label: "Text Alignment",
									defaultValue: "center",
									options: [
										{ label: "Left", value: "left" },
										{ label: "Center", value: "center" },
										{ label: "Right", value: "right" },
									],
								},
								{
									name: "size",
									type: "radio",
									label: "Section Height",
									defaultValue: "md",
									options: [
										{ label: "Small", value: "sm" },
										{ label: "Medium", value: "md" },
										{ label: "Large", value: "lg" },
									],
								},
								{
									name: "backgroundStyle",
									type: "radio",
									label: "Background Style",
									defaultValue: "gradient",
									options: [
										{ label: "Solid Color", value: "solid" },
										{ label: "Gradient", value: "gradient" },
										{ label: "None (Transparent)", value: "none" },
									],
								},
								{
									name: "buttons",
									type: "array",
									label: "Call-to-Action Buttons",
									maxRows: 2,
									fields: [
										{
											name: "label",
											type: "text",
											required: true,
										},
										{
											name: "href",
											type: "text",
											required: true,
										},
										{
											name: "variant",
											type: "radio",
											defaultValue: "primary",
											options: [
												{ label: "Primary", value: "primary" },
												{ label: "Secondary", value: "secondary" },
											],
										},
										{
											name: "external",
											type: "checkbox",
											label: "External Link",
											defaultValue: false,
										},
									],
								},
							],
						},
						{
							name: "spacing",
							type: "group",
							label: "Section Spacing",
							fields: [
								{
									name: "paddingTop",
									type: "radio",
									label: "Padding Top",
									defaultValue: "md",
									options: [
										{ label: "None", value: "none" },
										{ label: "Small", value: "sm" },
										{ label: "Medium", value: "md" },
										{ label: "Large", value: "lg" },
									],
								},
								{
									name: "paddingBottom",
									type: "radio",
									label: "Padding Bottom",
									defaultValue: "md",
									options: [
										{ label: "None", value: "none" },
										{ label: "Small", value: "sm" },
										{ label: "Medium", value: "md" },
										{ label: "Large", value: "lg" },
									],
								},
							],
						},
					],
				},
				{
					slug: "features",
					labels: {
						singular: "Features",
						plural: "Features",
					},
					fields: [
						{
							name: "features",
							type: "group",
							label: "Features Section Settings",
							fields: [
								{
									name: "title",
									type: "text",
									label: "Section Title",
								},
								{
									name: "subtitle",
									type: "textarea",
									label: "Section Subtitle",
								},
								{
									name: "layout",
									type: "radio",
									label: "Layout",
									defaultValue: "grid",
									options: [
										{ label: "Grid (3 columns)", value: "grid" },
										{ label: "List", value: "list" },
									],
								},
								{
									name: "items",
									type: "array",
									label: "Feature Items",
									maxRows: 6,
									fields: [
										{
											name: "icon",
											type: "text",
											label: "Icon Name (Lucide)",
											admin: {
												description: "e.g., 'Rocket', 'Zap', 'Code'",
											},
										},
										{
											name: "title",
											type: "text",
											required: true,
										},
										{
											name: "description",
											type: "textarea",
											required: true,
										},
									],
								},
							],
						},
						{
							name: "spacing",
							type: "group",
							label: "Section Spacing",
							fields: [
								{
									name: "paddingTop",
									type: "radio",
									label: "Padding Top",
									defaultValue: "md",
									options: [
										{ label: "None", value: "none" },
										{ label: "Small", value: "sm" },
										{ label: "Medium", value: "md" },
										{ label: "Large", value: "lg" },
									],
								},
								{
									name: "paddingBottom",
									type: "radio",
									label: "Padding Bottom",
									defaultValue: "md",
									options: [
										{ label: "None", value: "none" },
										{ label: "Small", value: "sm" },
										{ label: "Medium", value: "md" },
										{ label: "Large", value: "lg" },
									],
								},
							],
						},
					],
				},
				{
					slug: "content",
					labels: {
						singular: "Content",
						plural: "Content",
					},
					fields: [
						{
							name: "content",
							type: "group",
							label: "Content Section Settings",
							fields: [
								{
									name: "title",
									type: "text",
									label: "Section Title",
								},
								{
									name: "body",
									type: "richText",
									label: "Content",
									required: true,
								},
								{
									name: "width",
									type: "radio",
									label: "Content Width",
									defaultValue: "normal",
									options: [
										{ label: "Narrow", value: "narrow" },
										{ label: "Normal", value: "normal" },
										{ label: "Wide", value: "wide" },
										{ label: "Full", value: "full" },
									],
								},
							],
						},
						{
							name: "spacing",
							type: "group",
							label: "Section Spacing",
							fields: [
								{
									name: "paddingTop",
									type: "radio",
									label: "Padding Top",
									defaultValue: "md",
									options: [
										{ label: "None", value: "none" },
										{ label: "Small", value: "sm" },
										{ label: "Medium", value: "md" },
										{ label: "Large", value: "lg" },
									],
								},
								{
									name: "paddingBottom",
									type: "radio",
									label: "Padding Bottom",
									defaultValue: "md",
									options: [
										{ label: "None", value: "none" },
										{ label: "Small", value: "sm" },
										{ label: "Medium", value: "md" },
										{ label: "Large", value: "lg" },
									],
								},
							],
						},
					],
				},
				{
					slug: "stats",
					labels: {
						singular: "Stats",
						plural: "Stats",
					},
					fields: [
						{
							name: "stats",
							type: "group",
							label: "Stats Section Settings",
							fields: [
								{
									name: "items",
									type: "array",
									label: "Stat Items",
									minRows: 2,
									maxRows: 4,
									fields: [
										{
											name: "number",
											type: "text",
											required: true,
											label: "Number/Value",
											admin: {
												description: "e.g., '100+', '5K', '99%'",
											},
										},
										{
											name: "label",
											type: "text",
											required: true,
											label: "Label",
										},
									],
								},
							],
						},
						{
							name: "spacing",
							type: "group",
							label: "Section Spacing",
							fields: [
								{
									name: "paddingTop",
									type: "radio",
									label: "Padding Top",
									defaultValue: "md",
									options: [
										{ label: "None", value: "none" },
										{ label: "Small", value: "sm" },
										{ label: "Medium", value: "md" },
										{ label: "Large", value: "lg" },
									],
								},
								{
									name: "paddingBottom",
									type: "radio",
									label: "Padding Bottom",
									defaultValue: "md",
									options: [
										{ label: "None", value: "none" },
										{ label: "Small", value: "sm" },
										{ label: "Medium", value: "md" },
										{ label: "Large", value: "lg" },
									],
								},
							],
						},
					],
				},
				{
					slug: "cta",
					labels: {
						singular: "CTA",
						plural: "CTA",
					},
					fields: [
						{
							name: "cta",
							type: "group",
							label: "Call-to-Action Section Settings",
							fields: [
								{
									name: "title",
									type: "text",
									required: true,
									label: "Title",
								},
								{
									name: "description",
									type: "textarea",
									label: "Description",
								},
								{
									name: "buttonLabel",
									type: "text",
									required: true,
									label: "Button Label",
								},
								{
									name: "buttonHref",
									type: "text",
									required: true,
									label: "Button Link",
								},
								{
									name: "style",
									type: "radio",
									label: "Style",
									defaultValue: "primary",
									options: [
										{ label: "Primary (Blue)", value: "primary" },
										{ label: "Accent (Purple)", value: "accent" },
									],
								},
							],
						},
						{
							name: "spacing",
							type: "group",
							label: "Section Spacing",
							fields: [
								{
									name: "paddingTop",
									type: "radio",
									label: "Padding Top",
									defaultValue: "md",
									options: [
										{ label: "None", value: "none" },
										{ label: "Small", value: "sm" },
										{ label: "Medium", value: "md" },
										{ label: "Large", value: "lg" },
									],
								},
								{
									name: "paddingBottom",
									type: "radio",
									label: "Padding Bottom",
									defaultValue: "md",
									options: [
										{ label: "None", value: "none" },
										{ label: "Small", value: "sm" },
										{ label: "Medium", value: "md" },
										{ label: "Large", value: "lg" },
									],
								},
							],
						},
					],
				},
			],
		},
		{
			name: "seo",
			type: "group",
			label: "SEO Settings",
			fields: [
				{
					name: "metaTitle",
					type: "text",
					label: "Meta Title",
					admin: {
						description: "Override the page title for SEO",
					},
				},
				{
					name: "metaDescription",
					type: "textarea",
					label: "Meta Description",
				},
			],
		},
	],
	timestamps: true,
}
