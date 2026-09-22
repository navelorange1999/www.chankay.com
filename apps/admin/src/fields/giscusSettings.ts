import type { Field } from "payload"

export const giscusSettings: Field = {
	name: "giscus",
	type: "group",
	label: "Post Comments (Giscus)",
	admin: {
		description: "Public GitHub Discussions configuration. Comments are stored on GitHub.",
	},
	fields: [
		{
			name: "enabled",
			type: "checkbox",
			label: "Enable Post Comments",
			defaultValue: true,
		},
		{
			name: "repo",
			type: "text",
			required: true,
			defaultValue: "navelorange1999/chankay-discussions",
			admin: {
				description: "Public repository in owner/name format. Install the Giscus app on it.",
			},
			validate: (value: unknown) =>
				(typeof value === "string" &&
					/^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9_.-]{1,100}$/.test(value) &&
					!value.endsWith("/..") &&
					!value.endsWith("/.")) ||
				"Enter a GitHub repository in owner/name format.",
		},
		{
			name: "repoId",
			type: "text",
			label: "Repository ID",
			required: true,
			defaultValue: "R_kgDOUk_WeA",
			validate: (value: unknown) =>
				(typeof value === "string" && /^R_[A-Za-z0-9_-]{1,100}$/.test(value)) ||
				"Enter the repository ID supplied by Giscus.",
		},
		{
			name: "category",
			type: "text",
			required: true,
			maxLength: 100,
			defaultValue: "Announcements",
			admin: {
				description: "Use an Announcements category so Giscus creates article discussions.",
			},
		},
		{
			name: "categoryId",
			type: "text",
			label: "Category ID",
			required: true,
			defaultValue: "DIC_kwDOUk_WeM4DGIzk",
			validate: (value: unknown) =>
				(typeof value === "string" && /^DIC_[A-Za-z0-9_-]{1,100}$/.test(value)) ||
				"Enter the discussion category ID supplied by Giscus.",
		},
	],
}
