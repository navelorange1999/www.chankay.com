import { describe, expect, it, vi } from "vitest"

import {
	applyThemeChange,
	resolveThemeTransitionAnimation,
	resolveThemeTransitionGeometry,
	resolveThemeTransitionMode,
	settleThemeTransition,
} from "../../../../packages/ui/src/hooks/useThemeTransition"

describe("applyThemeChange", () => {
	it("updates every root theme signal before notifying next-themes", () => {
		const classes = new Set(["light", "unrelated"])
		const root = {
			classList: {
				add: (...tokens: string[]) => tokens.forEach((token) => classes.add(token)),
				remove: (...tokens: string[]) => tokens.forEach((token) => classes.delete(token)),
			},
			setAttribute: vi.fn(),
			style: { colorScheme: "light" },
		}
		const setTheme = vi.fn(() => {
			expect(classes.has("dark")).toBe(true)
			expect(root.setAttribute).toHaveBeenCalledWith("data-theme", "dark")
			expect(root.style.colorScheme).toBe("dark")
		})

		applyThemeChange(root, "dark", false, setTheme)

		expect(classes).toEqual(new Set(["unrelated", "dark"]))
		expect(setTheme).toHaveBeenCalledWith("dark")
	})
})

describe("resolveThemeTransitionGeometry", () => {
	it("uses a coordinate-independent top-right origin", () => {
		const geometry = resolveThemeTransitionGeometry({
			height: 1080,
			width: 1920,
		})

		expect(geometry.origin).toBe("100% 0%")
		expect(geometry.radius).toBeCloseTo(Math.hypot(1920, 1080))
	})
})

describe("resolveThemeTransitionMode", () => {
	it.each([
		["150", "Chrome/150.0.0.0", 2],
		["151", "Chrome/151.0.0.0", 2],
		["152", "Chrome/152.0.0.0", 1.25],
		["Chromium 152", "Chromium/152.0.0.0", 2],
		["Edge with Chromium 151", "Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0", 2],
	])("uses fade for affected %s builds on high-DPR displays", (_, userAgent, devicePixelRatio) => {
		expect(resolveThemeTransitionMode({ devicePixelRatio, userAgent })).toBe("fade")
	})

	it.each([
		["Chrome 149", "Chrome/149.0.0.0", 2],
		["Chrome 153", "Chrome/153.0.0.0", 2],
		["Chrome 151 at DPR 1", "Chrome/151.0.0.0", 1],
		["Safari", "Version/26.0 Safari/605.1.15", 2],
		["Firefox", "Firefox/151.0", 2],
	])("keeps radial expansion for %s", (_, userAgent, devicePixelRatio) => {
		expect(resolveThemeTransitionMode({ devicePixelRatio, userAgent })).toBe("radial")
	})
})

describe("resolveThemeTransitionAnimation", () => {
	it("uses opacity without clip-path for the compatibility fade", () => {
		const animation = resolveThemeTransitionAnimation("fade", {
			origin: "100% 0%",
			radius: 1000,
		})

		expect(animation.keyframes).toEqual({ opacity: [0, 1] })
		expect(animation.options).toMatchObject({
			duration: 300,
			pseudoElement: "::view-transition-new(root)",
		})
	})

	it("keeps clip-path expansion for unaffected browsers", () => {
		const animation = resolveThemeTransitionAnimation("radial", {
			origin: "100% 0%",
			radius: 1000,
		})

		expect(animation.keyframes).toEqual({
			clipPath: ["circle(0px at 100% 0%)", "circle(1000px at 100% 0%)"],
		})
		expect(animation.options).toMatchObject({
			duration: 1200,
			pseudoElement: "::view-transition-new(root)",
		})
	})
})

describe("settleThemeTransition", () => {
	it("cleans up only after the native transition settles", async () => {
		let resolveFinished: (() => void) | undefined
		const finished = new Promise<void>((resolve) => {
			resolveFinished = resolve
		})
		const cleanup = vi.fn()

		settleThemeTransition({ finished }, cleanup)
		await Promise.resolve()

		expect(cleanup).not.toHaveBeenCalled()

		resolveFinished?.()
		await finished
		await Promise.resolve()

		expect(cleanup).toHaveBeenCalledOnce()
	})

	it("also cleans up when the native transition rejects", async () => {
		const cleanup = vi.fn()
		const finished = Promise.reject(new DOMException("Transition skipped"))

		settleThemeTransition({ finished }, cleanup)
		await finished.catch(() => undefined)
		await Promise.resolve()

		expect(cleanup).toHaveBeenCalledOnce()
	})
})
