import type { Field, TextareaFieldValidation } from "payload"

interface MarkdownFieldArgs {
	name: string
	label?: string
	required?: boolean
	localized?: boolean
	defaultValue?: string
	relationTo?: string
	validate?: TextareaFieldValidation
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
	validate,
	admin,
}: MarkdownFieldArgs): Field => ({
	name,
	type: "textarea",
	label,
	required,
	localized,
	defaultValue,
	validate,
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
