import sharp from "sharp"
import path from "path"
import { fileURLToPath } from "url"
import {
	lexicalEditor,
	BoldFeature,
	UnderlineFeature,
	ItalicFeature,
	StrikethroughFeature,
	InlineCodeFeature,
	HeadingFeature,
	ParagraphFeature,
	OrderedListFeature,
	UnorderedListFeature,
	ChecklistFeature,
	LinkFeature,
	BlockquoteFeature,
	HorizontalRuleFeature,
	AlignFeature,
	IndentFeature,
	UploadFeature,
	FixedToolbarFeature,
	InlineToolbarFeature,
} from "@payloadcms/richtext-lexical"
import { mongooseAdapter } from "@payloadcms/db-mongodb"
import { buildConfig } from "payload"
import { seoPlugin } from "@payloadcms/plugin-seo"
import { Config } from "@repo/typescript-config/typings/payload-types"

import { Media, Users, Posts, Categories, Tags, Series } from "./collections"
import { SiteConfig } from "./globals"
import { plugins } from "./plugins"
import { LOCALE_CONFIG } from "./config/locales"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
	// Localization configuration
	localization: {
		locales: LOCALE_CONFIG.locales.map((locale) => ({
			code: locale.code,
			label: `[${locale.code}]`,
		})),
		defaultLocale: LOCALE_CONFIG.locales[0].code, // First locale as default
		fallback: LOCALE_CONFIG.cms.fallback,
	},

	// Lexical editor with markdown support and optimized features
	editor: lexicalEditor({
		features: [
			// Typography & Formatting
			BoldFeature(),
			ItalicFeature(),
			UnderlineFeature(),
			StrikethroughFeature(),
			InlineCodeFeature(),

			// Structure
			HeadingFeature({
				enabledHeadingSizes: ["h1", "h2", "h3", "h4", "h5", "h6"],
			}),
			ParagraphFeature(),

			// Lists
			UnorderedListFeature(),
			OrderedListFeature(),
			ChecklistFeature(),

			// Content Blocks
			BlockquoteFeature(),
			HorizontalRuleFeature(),
			LinkFeature({
				enabledCollections: ["media"],
			}),

			// Media
			UploadFeature({
				collections: {
					uploads: {
						fields: [
							{
								name: "alt",
								type: "text",
								required: true,
							},
						],
					},
				},
			}),

			// Layout
			AlignFeature(),
			IndentFeature(),

			// Toolbars
			FixedToolbarFeature(),
			InlineToolbarFeature(),
		],
	}),

	// Define and configure your collections in this array
	collections: [Users, Media, Posts, Categories, Tags, Series],

	// Define and configure your Globals in this array
	globals: [SiteConfig],

	// Your Payload secret - should be a complex and secure string, unguessable
	secret: process.env.PAYLOAD_SECRET || "",

	// Whichever Database Adapter you're using should go here
	// Mongoose is shown as an example, but you can also use Postgres
	db: mongooseAdapter({
		url: process.env.DATABASE_URI || "",
	}),
	// If you want to resize images, crop, set focal point, etc.
	// make sure to install it and pass it to the config.
	// This is optional - if you don't need to do these things,
	// you don't need it!
	sharp,

	routes: {
		admin: "/",
	},

	typescript: {
		autoGenerate: true,
		declare: false,
		outputFile: path.resolve(
			dirname,
			"../../../packages/typescript-config/typings/payload-types.ts"
		),
	},

	plugins: [
		...plugins,
		seoPlugin({
			collections: ["posts"],
			uploadsCollection: "media",
			generateTitle: ({ doc }) => doc?.title?.value || doc?.title,
			generateDescription: ({ doc }) => doc?.excerpt?.value || doc?.excerpt,
			tabbedUI: true,
		}),
	],

	admin: {
		importMap: {
			baseDir: path.resolve(dirname),
		},
		user: Users.slug,
		routes: {
			login: "/auth/login",
		},
		autoLogin:
			process.env.NODE_ENV === "development"
				? {
						email: "local@test.com",
						password: "local",
					}
				: false,

		components: {
			views: {
				login: {
					Component: "/views/Login",
					path: "/auth/login",
				},
			},
		},
	},
})

declare module "payload" {
	export interface GeneratedTypes extends Config {}
}
