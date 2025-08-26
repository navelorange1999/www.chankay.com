import type {CollectionConfig} from "payload";
import {authenticated} from "../access/authenticated";

export const Series: CollectionConfig = {
	slug: "series",
	access: {
		read: () => true, // Public read access
		create: authenticated,
		update: authenticated,
		delete: authenticated,
	},
	admin: {
		defaultColumns: ["title", "status", "postCount", "author"],
		useAsTitle: "title",
	},
	fields: [
		{
			name: "title",
			type: "text",
			required: true,
			index: true,
			admin: {
				placeholder: "e.g., React Fundamentals, Design Systems Guide",
			},
		},
		{
			name: "slug",
			type: "text",
			required: true,
			unique: true,
			index: true,
			admin: {
				description: "URL-friendly version of the series title",
			},
			hooks: {
				beforeValidate: [
					({data}) => {
						if (data?.title && !data?.slug) {
							return data.title
								.toLowerCase()
								.replace(/[^\w\s-]/g, "")
								.replace(/\s+/g, "-")
								.trim();
						}
						return data?.slug;
					},
				],
			},
		},
		{
			name: "description",
			type: "richText",
			required: true,
			admin: {
				description:
					"Detailed description of the series content and goals",
			},
		},
		{
			name: "coverImage",
			type: "upload",
			relationTo: "media",
			admin: {
				description: "Series cover image",
			},
		},
		{
			name: "author",
			type: "relationship",
			relationTo: "users",
			required: true,
			index: true,
			admin: {
				description: "Primary author of this series",
			},
			defaultValue: ({user}) => user?.id,
		},
		{
			name: "status",
			type: "select",
			required: true,
			defaultValue: "draft",
			index: true,
			options: [
				{label: "Draft", value: "draft"},
				{label: "In Progress", value: "in-progress"},
				{label: "Completed", value: "completed"},
				{label: "On Hold", value: "on-hold"},
			],
		},
		{
			name: "difficulty",
			type: "select",
			defaultValue: "intermediate",
			options: [
				{label: "Beginner", value: "beginner"},
				{label: "Intermediate", value: "intermediate"},
				{label: "Advanced", value: "advanced"},
			],
		},
		{
			name: "estimatedReadTime",
			type: "number",
			admin: {
				description: "Total estimated reading time in minutes",
			},
		},
		{
			name: "postCount",
			type: "number",
			defaultValue: 0,
			admin: {
				readOnly: true,
				description: "Number of posts in this series",
			},
		},
		{
			name: "featured",
			type: "checkbox",
			admin: {
				description: "Feature this series prominently",
			},
		},
		{
			name: "completedAt",
			type: "date",
			admin: {
				description: "Date when series was completed",
				condition: (data) => data.status === "completed",
			},
		},
	],
	timestamps: true,
};
