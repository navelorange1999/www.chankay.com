import { describe, expect, it } from "vitest"

import { resolveThemeTransitionGeometry } from "../../../../packages/ui/src/hooks/useThemeTransition"

describe("resolveThemeTransitionGeometry", () => {
	it("uses the trigger center and reaches the farthest viewport corner", () => {
		const geometry = resolveThemeTransitionGeometry(
			{
				height: 52,
				left: 1792,
				top: 32,
				width: 52,
			},
			{
				height: 1080,
				width: 1920,
			}
		)

		expect(geometry.originX).toBe(1818)
		expect(geometry.originY).toBe(58)
		expect(geometry.radius).toBeCloseTo(Math.hypot(1818, 1022))
	})
})
