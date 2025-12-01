import type { Meta, StoryObj } from "@storybook/react-vite"
import { StatsSection } from "@repo/ui"

const meta: Meta<typeof StatsSection> = {
	title: "Sections/StatsSection",
	component: StatsSection,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
	},
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		items: [
			{
				number: "10K+",
				label: "Active Users",
			},
			{
				number: "99.9%",
				label: "Uptime",
			},
			{
				number: "50+",
				label: "Countries",
			},
		],
	},
}

export const TwoItems: Story = {
	args: {
		items: [
			{
				number: "1M+",
				label: "Downloads",
			},
			{
				number: "4.9★",
				label: "Rating",
			},
		],
	},
}

export const FourItems: Story = {
	args: {
		items: [
			{
				number: "500+",
				label: "Companies",
			},
			{
				number: "2M+",
				label: "API Calls",
			},
			{
				number: "150+",
				label: "Integrations",
			},
			{
				number: "24/7",
				label: "Support",
			},
		],
	},
}

export const LargeNumbers: Story = {
	args: {
		items: [
			{
				number: "1.2M+",
				label: "Lines of Code",
			},
			{
				number: "$500M",
				label: "Funding Raised",
			},
			{
				number: "10K+",
				label: "GitHub Stars",
			},
		],
	},
}

export const Percentages: Story = {
	args: {
		items: [
			{
				number: "98%",
				label: "Customer Satisfaction",
			},
			{
				number: "99.99%",
				label: "Uptime SLA",
			},
			{
				number: "85%",
				label: "Faster Performance",
			},
		],
	},
}

export const MixedFormats: Story = {
	args: {
		items: [
			{
				number: "3.2B",
				label: "Requests Served",
			},
			{
				number: "<100ms",
				label: "Response Time",
			},
			{
				number: "195",
				label: "Data Centers",
			},
			{
				number: "∞",
				label: "Possibilities",
			},
		],
	},
}

export const TeamStats: Story = {
	args: {
		items: [
			{
				number: "200+",
				label: "Team Members",
			},
			{
				number: "15+",
				label: "Years Experience",
			},
			{
				number: "40+",
				label: "Awards Won",
			},
		],
	},
}

export const ProductStats: Story = {
	args: {
		items: [
			{
				number: "5K+",
				label: "Features",
			},
			{
				number: "100+",
				label: "Components",
			},
			{
				number: "50+",
				label: "Templates",
			},
		],
	},
}
