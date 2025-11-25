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
			type: "array",
			label: "Page Sections",
			admin: {
				description: "Build your page by adding and arranging sections",
			},
			fields: [
				{
					name: "sectionType",
					type: "select",
					required: true,
					label: "Section Type",
					options: [
						{ label: "Hero", value: "hero" },
						{ label: "Features", value: "features" },
						{ label: "Content", value: "content" },
						{ label: "Stats", value: "stats" },
						{ label: "CTA", value: "cta" },
					],
				},
				// Hero Section
				{
					name: "hero",
					type: "group",
					label: "Hero Section Settings",
					admin: {
						condition: (data, siblingData) => siblingData?.sectionType === "hero",
					},
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
				// Features Section
				{
					name: "features",
					type: "group",
					label: "Features Section Settings",
					admin: {
						condition: (data, siblingData) => siblingData?.sectionType === "features",
					},
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
				// Content Section
				{
					name: "content",
					type: "group",
					label: "Content Section Settings",
					admin: {
						condition: (data, siblingData) => siblingData?.sectionType === "content",
					},
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
				// Stats Section
				{
					name: "stats",
					type: "group",
					label: "Stats Section Settings",
					admin: {
						condition: (data, siblingData) => siblingData?.sectionType === "stats",
					},
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
				// CTA Section
				{
					name: "cta",
					type: "group",
					label: "Call-to-Action Section Settings",
					admin: {
						condition: (data, siblingData) => siblingData?.sectionType === "cta",
					},
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
				// Common fields for all sections
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
