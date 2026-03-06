import tailwindcssAnimate from "tailwindcss-animate"
import typography from "@tailwindcss/typography"

/** @type {import('tailwindcss').Config} */
const config = {
	content: ["./src/**/*.{ts,tsx}"],
	darkMode: ["selector", '[data-theme="dark"]'],
	plugins: [tailwindcssAnimate, typography],
	prefix: "",
	safelist: [
		"lg:col-span-4",
		"lg:col-span-6",
		"lg:col-span-8",
		"lg:col-span-12",
		"border-border",
		"bg-card",
		"border-error",
		"bg-error/30",
		"border-success",
		"bg-success/30",
		"border-warning",
		"bg-warning/30",
	],
	theme: {
		container: {
			center: true,
			padding: {
				"2xl": "2rem",
				DEFAULT: "1rem",
				lg: "2rem",
				md: "2rem",
				sm: "1rem",
				xl: "2rem",
			},
			screens: {
				"2xl": "86rem",
				lg: "64rem",
				md: "48rem",
				sm: "40rem",
				xl: "80rem",
			},
		},
		extend: {
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			colors: {
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				background: "hsl(var(--background))",
				border: "hsla(var(--border))",
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				foreground: "hsl(var(--foreground))",
				input: "hsl(var(--input))",
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				ring: "hsl(var(--ring))",
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				success: "hsl(var(--success))",
				error: "hsl(var(--error))",
				warning: "hsl(var(--warning))",
			},
			fontFamily: {
				mono: ["var(--font-geist-mono)"],
				sans: ["var(--font-geist-sans)"],
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
			},
			typography: () => ({
				DEFAULT: {
					css: [
						{
							"--tw-prose-body": "var(--color-foreground)",
							"--tw-prose-headings": "var(--color-foreground)",
							"--tw-prose-links": "var(--color-primary)",
							"--tw-prose-bold": "var(--color-foreground)",
							"--tw-prose-counters": "var(--color-muted-foreground)",
							"--tw-prose-bullets": "var(--color-muted-foreground)",
							"--tw-prose-hr": "var(--color-border)",
							"--tw-prose-quotes": "var(--color-muted-foreground)",
							"--tw-prose-quote-borders":
								"color-mix(in oklab, var(--color-primary) 30%, transparent)",
							"--tw-prose-captions": "var(--color-muted-foreground)",
							"--tw-prose-code": "var(--color-foreground)",
							"--tw-prose-pre-code": "var(--color-foreground)",
							"--tw-prose-pre-bg": "var(--color-muted)",
							"--tw-prose-th-borders": "var(--color-border)",
							"--tw-prose-td-borders": "var(--color-border)",
							a: {
								fontWeight: "500",
								textDecorationThickness: "0.08em",
								textUnderlineOffset: "0.18em",
							},
							blockquote: {
								fontStyle: "normal",
								backgroundColor: "color-mix(in oklab, var(--color-muted) 55%, transparent)",
								borderRadius: "0 var(--radius-md) var(--radius-md) 0",
								paddingTop: "0.25rem",
								paddingBottom: "0.25rem",
								paddingRight: "1rem",
							},
							code: {
								backgroundColor: "color-mix(in oklab, var(--color-muted) 82%, transparent)",
								border: "1px solid color-mix(in oklab, var(--color-border) 85%, transparent)",
								borderRadius: "var(--radius-sm)",
								padding: "0.15rem 0.35rem",
							},
							pre: {
								border: "1px solid var(--color-border)",
								borderRadius: "var(--radius-lg)",
								boxShadow: "var(--shadow-xs)",
							},
							"pre code": {
								backgroundColor: "transparent",
								border: "0",
								padding: "0",
							},
							table: {
								borderCollapse: "collapse",
								overflow: "hidden",
								borderRadius: "var(--radius-lg)",
							},
							h1: {
								fontWeight: 700,
								marginBottom: "0.25em",
							},
						},
					],
				},
				base: {
					css: [
						{
							h1: {
								fontSize: "2.5rem",
							},
							h2: {
								fontSize: "1.25rem",
								fontWeight: 600,
							},
						},
					],
				},
				md: {
					css: [
						{
							h1: {
								fontSize: "3.5rem",
							},
							h2: {
								fontSize: "1.5rem",
							},
						},
					],
				},
			}),
		},
	},
}

export default config
