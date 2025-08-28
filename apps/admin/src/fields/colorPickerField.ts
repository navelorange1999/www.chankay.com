import type { Field } from "payload"

interface ColorPickerFieldArgs {
	name: string
	label?: string
	required?: boolean
	defaultValue?: string
	admin?: {
		position?: "sidebar"
		description?: string
	}
}

export const colorPickerField = ({
	name,
	label = "Color",
	required = false,
	defaultValue = "#ffffff",
	admin,
}: ColorPickerFieldArgs): Field => ({
	name,
	type: "text",
	label,
	required,
	defaultValue,
	admin: {
		...admin,
		components: {
			Field: "/components/fields/ColorPicker#default",
		},
	},
	validate: (value: unknown) => {
		const stringValue = value as string
		if (required && !stringValue) {
			return "This field is required"
		}
		if (stringValue && !/^#[0-9A-Fa-f]{6}$/.test(stringValue)) {
			return "Please enter a valid hex color (e.g., #ffffff)"
		}
		return true
	},
})
