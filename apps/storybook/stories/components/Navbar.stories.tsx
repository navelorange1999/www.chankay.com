import type { Meta, StoryObj } from "@storybook/react-vite"
import { Navbar } from "@repo/ui"
import type { SiteConfig } from "@repo/typescript-config/typings/payload-types"

const meta = {
	title: "Global/Navbar",
	component: Navbar,
	parameters: {
		layout: "fullscreen",
	},
} satisfies Meta<typeof Navbar>

export default meta

type Story = StoryObj<typeof meta>

// Mock SiteConfig for Navbar
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
	navigation: {
		showLogo: true,
		showSiteName: true,
		showThemeToggle: true,
		menuItems: [
			{ id: "1", label: "Home", url: "/", external: false },
			{ id: "2", label: "Blog", url: "/blog", external: false },
			{ id: "3", label: "About", url: "/about", external: false },
			{ id: "4", label: "Projects", url: "/projects", external: false },
		],
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
			navigation: {
				...mockSiteConfig.navigation,
				showLogo: false,
			},
		},
	},
}

export const WithoutSiteName: Story = {
	args: {
		siteConfig: {
			...mockSiteConfig,
			navigation: {
				...mockSiteConfig.navigation,
				showSiteName: false,
			},
		},
	},
}

export const MinimalNav: Story = {
	args: {
		siteConfig: {
			...mockSiteConfig,
			navigation: {
				...mockSiteConfig.navigation,
				menuItems: [
					{ id: "1", label: "Home", url: "/", external: false },
					{ id: "2", label: "About", url: "/about", external: false },
				],
			},
		},
	},
}
