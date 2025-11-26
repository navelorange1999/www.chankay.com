import type { Meta, StoryObj } from "@storybook/react-vite"
import { Footer } from "@repo/ui"
import type { SiteConfig } from "@repo/typescript-config/typings/payload-types"

const meta: Meta<typeof Footer> = {
	title: "Global/Footer",
	component: Footer,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
	},
}
export default meta

type Story = StoryObj<typeof meta>

// Mock SiteConfig for Footer
const mockSiteConfig: SiteConfig = {
	id: "1",
	siteName: "Chankay",
	siteUrl: "https://www.chankay.com",
	defaultLanguage: "en",
	logo: {
		id: "logo-1",
		filename: "logo.svg",
		mimeType: "image/svg+xml",
		filesize: 1024,
		width: 48,
		height: 48,
		url: "https://www.svgrepo.com/show/530488/share.svg",
		alt: "Chankay Logo",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	socialProfiles: [
		{
			id: "1",
			platform: "github",
			url: "https://github.com/chankay",
			username: "chankay",
			showInFooter: true,
		},
		{
			id: "2",
			platform: "twitter",
			url: "https://twitter.com/chankay",
			username: "@chankay",
			showInFooter: true,
		},
		{
			id: "3",
			platform: "linkedin",
			url: "https://linkedin.com/in/chankay",
			showInFooter: true,
		},
	],
	footer: {
		showLogo: true,
		showSiteName: true,
		showSocialLinks: true,
		copyrightText: "© 2024 Chankay. All rights reserved.",
		additionalLinks: [
			{ id: "1", label: "Privacy Policy", url: "/privacy", external: false },
			{ id: "2", label: "Terms of Service", url: "/terms", external: false },
			{ id: "3", label: "Contact", url: "/contact", external: false },
		],
		customFooterText: "Built with Next.js and Payload CMS",
	},
	updatedAt: new Date().toISOString(),
	createdAt: new Date().toISOString(),
}

export const Default: Story = {
	args: {
		siteConfig: mockSiteConfig,
	},
}

export const WithoutLogo: Story = {
	args: {
		siteConfig: {
			...mockSiteConfig,
			footer: {
				...mockSiteConfig.footer,
				showLogo: false,
			},
		},
	},
}

export const WithoutSocialLinks: Story = {
	args: {
		siteConfig: {
			...mockSiteConfig,
			footer: {
				...mockSiteConfig.footer,
				showSocialLinks: false,
			},
		},
	},
}

export const MinimalFooter: Story = {
	args: {
		siteConfig: {
			...mockSiteConfig,
			footer: {
				showLogo: false,
				showSiteName: true,
				showSocialLinks: false,
				copyrightText: "© 2024 Chankay",
			},
		},
	},
}
