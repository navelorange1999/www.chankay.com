import type { Field } from "payload"

interface MarkdownFieldArgs {
	name: string
	label?: string
	required?: boolean
	localized?: boolean
	defaultValue?: string
	relationTo?: string
	admin?: {
		description?: string
		placeholder?: string
		position?: "sidebar"
		rows?: number
	}
}

export const markdownField = ({
	name,
	label = "Markdown",
	required = false,
	localized = false,
	defaultValue = "",
	relationTo = "media",
	admin,
}: MarkdownFieldArgs): Field => ({
	name,
	type: "textarea",
	label,
	required,
	localized,
	defaultValue,
	admin: {
		...admin,
		components: {
			Field: "/components/fields/MarkdownField/index#default",
		},
	},
	custom: {
		mediaRelationTo: relationTo,
	},
})
