import type {Meta, StoryObj} from "@storybook/react-vite";

import {Footer} from "@repo/ui";

const meta: Meta<typeof Footer> = {
	title: "Components/Footer",
	component: Footer,
	tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: "Hello World",
		socials: [
			{
				name: "Bilibili",
				href: "https://space.bilibili.com/36883031?spm_id_from=333.1007.0.0",
				icon: {
					src: "https://site-assets.fontawesome.com/releases/v6.7.2/svgs/brands/bilibili.svg",
					width: 14,
					height: 14,
					alt: "Bilibili",
				},
			},
		],
	},
};
