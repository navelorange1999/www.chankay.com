"use client"

import React, { useCallback } from "react"
import { useFormFields, useAllFormFields } from "@payloadcms/ui"
import { HexColorPicker } from "react-colorful"

import type { TextFieldClientProps } from "payload"

const ColorPickerField: React.FC<TextFieldClientProps> = ({
	field: { label, required = false },
	path,
}) => {
	const fieldState = useFormFields(([fields]) => fields[path])
	const [, dispatchFields] = useAllFormFields()

	const value: string = (fieldState?.value as string) || "#ffffff"

	const updateValue = useCallback(
		(newValue: string) => {
			if (newValue !== value) {
				dispatchFields({
					type: "UPDATE",
					path,
					value: newValue,
				})
			}
		},
		[dispatchFields, path, value]
	)

	const handleColorChange = useCallback(
		(color: string) => {
			updateValue(color.toUpperCase())
		},
		[updateValue]
	)

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const inputColor = e.target.value.toUpperCase()
			// Allow empty string or valid hex pattern
			if (inputColor === "" || /^#[0-9A-F]{0,6}$/i.test(inputColor)) {
				updateValue(inputColor)
			}
		},
		[updateValue]
	)

	return (
		<div className="mb-3">
			<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
				{typeof label === "string"
					? label
					: typeof label === "object" && label
						? JSON.stringify(label)
						: "Color"}
				{required && <span className="text-red-500 ml-1">*</span>}
			</label>

			<div className="flex items-center gap-3 mb-3">
				<div
					className="w-8 h-8 rounded border-2 border-gray-200 dark:border-gray-600 shadow-sm transition-colors"
					style={{ backgroundColor: value }}
				/>

				<input
					type="text"
					value={value}
					onChange={handleInputChange}
					placeholder="#FFFFFF"
					maxLength={7}
					className="flex-1 px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
					pattern="^#[0-9A-Fa-f]{6}$"
				/>
			</div>

			<div
				className="w-full max-w-xs"
				style={
					{
						"--colorful-width": "100%",
						"--colorful-height": "120px",
						"--colorful-border-radius": "6px",
						"--colorful-shadow": "0 2px 4px rgba(0, 0, 0, 0.1)",
					} as React.CSSProperties
				}
			>
				<HexColorPicker
					color={value}
					onChange={handleColorChange}
					style={{
						width: "100%",
						height: "120px",
						borderRadius: "6px",
						boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
					}}
				/>
			</div>
		</div>
	)
}

export default ColorPickerField
