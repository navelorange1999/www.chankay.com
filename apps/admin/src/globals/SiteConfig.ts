import type { GlobalConfig } from "payload"
import { authenticated } from "../access/authenticated"
import { LOCALE_CONFIG } from "../config/locales"

export const SiteConfig: GlobalConfig = {
	slug: "site-config",
	label: "Site Configuration",
	admin: {
		description: "Global site settings and configuration",
	},
	access: {
		read: () => true, // Site config can be read publicly
		update: authenticated, // Only authenticated users can update
	},
	fields: [
		// === Basic Site Information ===
		{
			type: "collapsible",
			label: "Basic Information",
			admin: {
				initCollapsed: false,
				description: "Core site identity and branding",
			},
			fields: [
				{
					name: "siteName",
					type: "text",
					label: "Site Name",
					required: true,
					defaultValue: "Chankay Blog",
					localized: true,
					admin: {
						placeholder: "Your site name...",
						description: "The name of your website",
					},
				},
				{
					name: "siteDescription",
					type: "textarea",
					label: "Site Description",
					localized: true,
					admin: {
						placeholder: "A brief description of your website...",
						description: "Default meta description for SEO",
					},
				},
				{
					name: "siteUrl",
					type: "text",
					label: "Site URL",
					required: true,
					defaultValue: "https://www.chankay.com",
					admin: {
						placeholder: "https://your-domain.com",
						description: "The primary URL of your website (used for canonical URLs and sitemaps)",
					},
					validate: (val: unknown) => {
						if (val && typeof val === "string" && !/^https?:\/\/.+/.test(val)) {
							return "Please enter a valid URL starting with http:// or https://"
						}
						return true
					},
				},
				{
					name: "defaultLanguage",
					type: "select",
					label: "Default Language",
					required: true,
					defaultValue: LOCALE_CONFIG.locales[0].code,
					options: LOCALE_CONFIG.locales.map((locale) => ({
						label: `${locale.name} (${locale.code})`,
						value: locale.code,
					})),
					admin: {
						description: "Primary language for your site content",
					},
				},
				{
					name: "timezone",
					type: "select",
					label: "Timezone",
					defaultValue: "Asia/Shanghai",
					options: [
						{ label: "Shanghai (UTC+8)", value: "Asia/Shanghai" },
						{ label: "Tokyo (UTC+9)", value: "Asia/Tokyo" },
						{ label: "New York (UTC-5)", value: "America/New_York" },
						{ label: "Los Angeles (UTC-8)", value: "America/Los_Angeles" },
						{ label: "London (UTC+0)", value: "Europe/London" },
						{ label: "UTC", value: "UTC" },
					],
					admin: {
						description: "Timezone for content scheduling and display",
					},
				},
			],
		},

		// === Branding Assets ===
		{
			type: "collapsible",
			label: "Branding & Assets",
			admin: {
				initCollapsed: true,
				description: "Logos, favicons, and visual identity",
			},
			fields: [
				{
					name: "logo",
					type: "upload",
					label: "Site Logo",
					relationTo: "media",
					admin: {
						description: "Main logo for header and branding (SVG recommended)",
					},
				},
				{
					name: "logoAlt",
					type: "text",
					label: "Logo Alt Text",
					admin: {
						description: "Alternative text for the logo (accessibility)",
						condition: (_, siblingData) => !!siblingData?.logo,
					},
				},
				{
					name: "favicon",
					type: "upload",
					label: "Favicon",
					relationTo: "media",
					admin: {
						description: "Site favicon (.ico or .png, 32x32px recommended)",
					},
				},
				{
					name: "appleTouchIcon",
					type: "upload",
					label: "Apple Touch Icon",
					relationTo: "media",
					admin: {
						description: "Apple touch icon (180x180px PNG recommended)",
					},
				},
			],
		},

		// === SEO & Meta ===
		{
			type: "collapsible",
			label: "SEO & Meta Tags",
			admin: {
				initCollapsed: true,
				description: "Search engine optimization settings",
			},
			fields: [
				{
					name: "metaTitle",
					type: "text",
					label: "Default Meta Title",
					localized: true,
					admin: {
						description: "Default title tag for pages without specific SEO settings",
						placeholder: "Your Site Name - Tagline",
					},
				},
				{
					name: "metaDescription",
					type: "textarea",
					label: "Default Meta Description",
					localized: true,
					admin: {
						description: "Default meta description for pages without specific SEO settings",
						placeholder: "Brief description of your website...",
					},
				},
				{
					name: "keywords",
					type: "text",
					label: "Default Keywords",
					admin: {
						description: "Comma-separated keywords for your site (optional)",
						placeholder: "blog, technology, programming",
					},
				},
				{
					name: "ogImage",
					type: "upload",
					label: "Default Open Graph Image",
					relationTo: "media",
					admin: {
						description: "Default image for social sharing (1200x630px recommended)",
					},
				},
				{
					name: "robotsSettings",
					type: "group",
					label: "Robots & Indexing",
					fields: [
						{
							name: "allowIndexing",
							type: "checkbox",
							label: "Allow Search Engine Indexing",
							defaultValue: true,
							admin: {
								description: "Allow search engines to index your site",
							},
						},
						{
							name: "customRobotsTxt",
							type: "textarea",
							label: "Custom robots.txt",
							admin: {
								description: "Custom robots.txt content (optional)",
								placeholder: "User-agent: *\nDisallow: /admin/",
							},
						},
					],
				},
			],
		},

		// === Social Media ===
		{
			type: "collapsible",
			label: "Social Media",
			admin: {
				initCollapsed: true,
				description: "Social media profiles and sharing settings",
			},
			fields: [
				{
					name: "socialProfiles",
					type: "array",
					label: "Social Profiles",
					admin: {
						description: "Your social media profiles",
					},
					fields: [
						{
							name: "platform",
							type: "select",
							label: "Platform",
							required: true,
							options: [
								{ label: "Twitter/X", value: "twitter" },
								{ label: "GitHub", value: "github" },
								{ label: "LinkedIn", value: "linkedin" },
								{ label: "Instagram", value: "instagram" },
								{ label: "YouTube", value: "youtube" },
								{ label: "Facebook", value: "facebook" },
								{ label: "Medium", value: "medium" },
								{ label: "Dev.to", value: "devto" },
								{ label: "Discord", value: "discord" },
								{ label: "Telegram", value: "telegram" },
							],
						},
						{
							name: "url",
							type: "text",
							label: "Profile URL",
							required: true,
							admin: {
								placeholder: "https://twitter.com/your-username",
							},
							validate: (val: unknown) => {
								if (val && typeof val === "string" && !/^https?:\/\/.+/.test(val)) {
									return "Please enter a valid URL"
								}
								return true
							},
						},
						{
							name: "username",
							type: "text",
							label: "Username",
							admin: {
								placeholder: "@your-username",
								description: "Display username (optional)",
							},
						},
						{
							name: "showInFooter",
							type: "checkbox",
							label: "Show in Footer",
							defaultValue: true,
							admin: {
								description: "Display this profile link in site footer",
							},
						},
					],
				},
				{
					name: "socialSharing",
					type: "group",
					label: "Social Sharing",
					fields: [
						{
							name: "enableSharing",
							type: "checkbox",
							label: "Enable Social Sharing",
							defaultValue: true,
							admin: {
								description: "Show social sharing buttons on posts",
							},
						},
						{
							name: "twitterHandle",
							type: "text",
							label: "Twitter Handle",
							admin: {
								placeholder: "@your-handle",
								description: "Your Twitter handle for Twitter Card metadata",
								condition: (_, siblingData) => siblingData?.enableSharing,
							},
						},
					],
				},
			],
		},

		// === Analytics & Integrations ===
		{
			type: "collapsible",
			label: "Analytics & Integrations",
			admin: {
				initCollapsed: true,
				description: "Third-party services and tracking",
			},
			fields: [
				{
					name: "analytics",
					type: "group",
					label: "Analytics",
					fields: [
						{
							name: "googleAnalyticsId",
							type: "text",
							label: "Google Analytics ID",
							admin: {
								placeholder: "G-XXXXXXXXXX or UA-XXXXXXXXX-X",
								description: "Google Analytics measurement ID",
							},
						},
						{
							name: "googleSearchConsole",
							type: "text",
							label: "Google Search Console Verification",
							admin: {
								placeholder: "verification meta tag content",
								description: "Google Search Console verification meta tag",
							},
						},
						{
							name: "microsoftClarity",
							type: "text",
							label: "Microsoft Clarity ID",
							admin: {
								placeholder: "clarity project ID",
								description: "Microsoft Clarity tracking ID",
							},
						},
					],
				},
				{
					name: "performance",
					type: "group",
					label: "Performance",
					fields: [
						{
							name: "enableImageOptimization",
							type: "checkbox",
							label: "Enable Image Optimization",
							defaultValue: true,
							admin: {
								description: "Optimize images for web performance",
							},
						},
						{
							name: "enableLazyLoading",
							type: "checkbox",
							label: "Enable Lazy Loading",
							defaultValue: true,
							admin: {
								description: "Lazy load images and content",
							},
						},
						{
							name: "cacheMaxAge",
							type: "number",
							label: "Cache Max Age (seconds)",
							defaultValue: 3600,
							admin: {
								description: "Browser cache duration for static assets",
							},
						},
					],
				},
				{
					name: "comments",
					type: "group",
					label: "Comments System",
					fields: [
						{
							name: "enableComments",
							type: "checkbox",
							label: "Enable Comments",
							defaultValue: false,
							admin: {
								description: "Enable comments on blog posts",
							},
						},
						{
							name: "commentProvider",
							type: "select",
							label: "Comment Provider",
							options: [
								{ label: "Giscus (GitHub Discussions)", value: "giscus" },
								{ label: "Disqus", value: "disqus" },
								{ label: "Utterances (GitHub Issues)", value: "utterances" },
								{ label: "Gitalk", value: "gitalk" },
							],
							admin: {
								condition: (_, siblingData) => siblingData?.enableComments,
							},
						},
						{
							name: "commentConfig",
							type: "json",
							label: "Comment Configuration",
							admin: {
								description: "JSON configuration for your chosen comment provider",
								condition: (_, siblingData) =>
									siblingData?.enableComments && siblingData?.commentProvider,
							},
						},
					],
				},
			],
		},

		// === Email & Notifications ===
		{
			type: "collapsible",
			label: "Email & Notifications",
			admin: {
				initCollapsed: true,
				description: "Email settings and notifications",
			},
			fields: [
				{
					name: "contactEmail",
					type: "email",
					label: "Contact Email",
					admin: {
						description: "Primary contact email for your site",
					},
				},
				{
					name: "newsletter",
					type: "group",
					label: "Newsletter",
					fields: [
						{
							name: "enableNewsletter",
							type: "checkbox",
							label: "Enable Newsletter Signup",
							defaultValue: false,
							admin: {
								description: "Show newsletter signup forms",
							},
						},
						{
							name: "newsletterProvider",
							type: "select",
							label: "Newsletter Provider",
							options: [
								{ label: "Mailchimp", value: "mailchimp" },
								{ label: "ConvertKit", value: "convertkit" },
								{ label: "Substack", value: "substack" },
								{ label: "Buttondown", value: "buttondown" },
								{ label: "Custom", value: "custom" },
							],
							admin: {
								condition: (_, siblingData) => siblingData?.enableNewsletter,
							},
						},
						{
							name: "newsletterConfig",
							type: "json",
							label: "Newsletter Configuration",
							admin: {
								description: "Configuration for your newsletter provider",
								condition: (_, siblingData) =>
									siblingData?.enableNewsletter && siblingData?.newsletterProvider,
							},
						},
					],
				},
			],
		},

		// === Advanced Settings ===
		{
			type: "collapsible",
			label: "Advanced Settings",
			admin: {
				initCollapsed: true,
				description: "Advanced technical settings",
			},
			fields: [
				{
					name: "customCSS",
					type: "code",
					label: "Custom CSS",
					admin: {
						language: "css",
						description: "Custom CSS styles for your site",
					},
				},
				{
					name: "customJS",
					type: "code",
					label: "Custom JavaScript",
					admin: {
						language: "javascript",
						description: "Custom JavaScript code (use with caution)",
					},
				},
				{
					name: "customHead",
					type: "textarea",
					label: "Custom Head HTML",
					admin: {
						description: "Custom HTML to inject into <head> (scripts, meta tags, etc.)",
					},
				},
				{
					name: "customFooter",
					type: "textarea",
					label: "Custom Footer HTML",
					admin: {
						description: "Custom HTML to inject before closing </body>",
					},
				},
				{
					name: "maintenance",
					type: "group",
					label: "Maintenance Mode",
					fields: [
						{
							name: "maintenanceMode",
							type: "checkbox",
							label: "Enable Maintenance Mode",
							defaultValue: false,
							admin: {
								description: "Show maintenance page to visitors",
							},
						},
						{
							name: "maintenanceMessage",
							type: "textarea",
							label: "Maintenance Message",
							localized: true,
							admin: {
								description: "Message to show during maintenance",
								condition: (_, siblingData) => siblingData?.maintenanceMode,
							},
						},
						{
							name: "allowedIPs",
							type: "array",
							label: "Allowed IP Addresses",
							admin: {
								description: "IP addresses that can bypass maintenance mode",
								condition: (_, siblingData) => siblingData?.maintenanceMode,
							},
							fields: [
								{
									name: "ip",
									type: "text",
									label: "IP Address",
									admin: {
										placeholder: "127.0.0.1",
									},
								},
							],
						},
					],
				},
			],
		},
	],
	versions: {
		drafts: false,
	},
}
