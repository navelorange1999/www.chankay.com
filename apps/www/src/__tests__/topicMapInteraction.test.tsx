// @vitest-environment happy-dom
import * as React from "react"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { TopicMapExplorer } from "@/components/TopicMapExplorer"
const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))
let host: HTMLDivElement
let root: ReturnType<typeof createRoot>
beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			disconnect() {}
		}
	)
	vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(600)
	vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(420)
	host = document.createElement("div")
	document.body.append(host)
	root = createRoot(host)
})
afterEach(async () => {
	await act(() => root.unmount())
	host.remove()
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
})
it("zooms categories in the canvas and opens a localized article without a panel", async () => {
	await act(() =>
		root.render(
			<TopicMapExplorer
				locale="zh-CN"
				data={{
					schemaVersion: 2,
					metric: "published-posts",
					locale: "zh-CN",
					generatedAt: "2026-01-01",
					totals: { publishedPostCount: 1, areaValue: 1 },
					categories: [
						{
							id: "category",
							kind: "category",
							label: "Technical",
							publishedPostCount: 1,
							areaValue: 1,
							articles: [{ id: "post", title: "Article", slug: "article", value: 1 }],
						},
					],
				}}
			/>
		)
	)
	const category = host.querySelector<HTMLButtonElement>('button[aria-label="Technical: 1"]')!
	expect(category).not.toBeNull()
	expect(category.textContent).toContain("1")
	expect(category.style.height).toBe("44px")
	expect(category.className).toContain("cursor-pointer")
	expect(category.className).toContain("hover:scale")
	category.focus()
	await act(() => category.click())
	const back = host.querySelector<HTMLButtonElement>("button[data-treemap-back]")!
	expect(back).not.toBeNull()
	expect(document.activeElement).toBe(back)

	expect(host.querySelector("table, details, h2, h3")).toBeNull()
	const article = host.querySelector<HTMLButtonElement>('button[aria-label="Article: 1"]')!
	expect(article.textContent).toBe("Article")
	expect(article.querySelector("[data-treemap-count]")).toBeNull()
	await act(() => article.click())
	expect(push).toHaveBeenCalledWith("/zh-CN/posts/article")
	await act(() => back.click())
	expect(document.activeElement).toBe(host.querySelector('button[aria-label="Technical: 1"]'))
})

it.each([8, 25])(
	"keeps %i article titles and keyboard targets without leaf counts in a narrow focused canvas",
	async (articleCount) => {
		vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(343)
		vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(276)
		const { Treemap } = await import("@repo/ui/components/Treemap")
		const activate = vi.fn()
		await act(() =>
			root.render(
				<Treemap
					ariaLabel="Articles"
					focusedNodeId="category"
					onLeafActivate={activate}
					onFocusChange={() => {}}
					data={{
						id: "root",
						label: "Articles",
						children: [
							{
								id: "category",
								label: "Category",
								children: Array.from({ length: articleCount }, (_, index) => ({
									id: `article-${index}`,
									label: `Article ${index}`,
									value: 1,
								})),
							},
						],
					}}
				/>
			)
		)
		const articles = Array.from(
			host.querySelectorAll<HTMLButtonElement>('button[aria-label^="Article "]')
		)
		expect(articles).toHaveLength(articleCount)
		for (const [index, article] of articles.entries()) {
			expect(article.querySelector("[data-treemap-count]")).toBeNull()
			expect(article.textContent).toBe(`Article ${index}`)
			expect(article.tabIndex).toBe(0)
			article.focus()
			expect(document.activeElement).toBe(article)
			await act(() => article.click())
			expect(activate).toHaveBeenLastCalledWith(`article-${index}`)
		}
		if (articleCount === 25)
			expect(
				Number.parseFloat(host.querySelector<HTMLElement>('[role="group"]')!.style.minHeight)
			).toBeGreaterThan(276)
	}
)

it("keeps narrow category headers keyboard accessible with a visible count", async () => {
	vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(40)
	const { Treemap } = await import("@repo/ui/components/Treemap")
	const focus = vi.fn()
	await act(() =>
		root.render(
			<Treemap
				ariaLabel="Articles"
				onFocusChange={focus}
				onLeafActivate={() => {}}
				data={{
					id: "root",
					label: "Articles",
					children: [
						{
							id: "category",
							label: "Category",
							children: [{ id: "article", label: "Article", value: 1 }],
						},
					],
				}}
			/>
		)
	)
	const category = host.querySelector<HTMLButtonElement>('button[aria-label="Category: 1"]')!
	expect(category).not.toBeNull()
	expect(category.querySelector("[data-treemap-count]")?.textContent).toBe("1")
	category.focus()
	expect(document.activeElement).toBe(category)
	await act(() => category.click())
	expect(focus).toHaveBeenCalledWith("category")
})

it("uses compact category navigation for a skewed overview without collapsing articles", async () => {
	vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(343)
	vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(320)
	const { Treemap } = await import("@repo/ui/components/Treemap")
	function Example() {
		const [focused, setFocused] = React.useState<string | null>(null)
		return (
			<Treemap
				ariaLabel="Articles"
				focusedNodeId={focused}
				onFocusChange={setFocused}
				onLeafActivate={() => {}}
				data={{
					id: "root",
					label: "Articles",
					children: [
						{
							id: "large",
							label: "Large",
							children: Array.from({ length: 100 }, (_, index) => ({
								id: `article-${index}`,
								label: `Article ${index}`,
								value: 1,
							})),
						},
						{
							id: "small",
							label: "Small",
							children: [{ id: "small-article", label: "Small article", value: 1 }],
						},
					],
				}}
			/>
		)
	}
	await act(() => root.render(<Example />))
	const canvas = host.querySelector<HTMLElement>('[role="group"]')!
	expect(canvas.dataset.treemapOverview).toBe("categories")
	expect(Number.parseFloat(canvas.style.minHeight)).toBeLessThanOrEqual(720)
	const categories = Array.from(canvas.querySelectorAll<HTMLButtonElement>("button[aria-label]"))
	expect(categories).toHaveLength(2)
	expect(
		categories.map((button) => button.querySelector("[data-treemap-count]")?.textContent)
	).toEqual(["100", "1"])
	for (const category of categories) {
		expect(Number.parseFloat(category.style.height)).toBeGreaterThanOrEqual(44)
		expect(
			Number.parseFloat(category.style.top) + Number.parseFloat(category.style.height)
		).toBeLessThanOrEqual(Number.parseFloat(canvas.style.minHeight))
	}
	await act(() => categories[1]!.click())
	expect(canvas.querySelector('button[aria-label="Small article: 1"]')).not.toBeNull()
	await act(() => canvas.querySelector<HTMLButtonElement>("[data-treemap-back]")!.click())
	await act(() =>
		canvas.querySelector<HTMLButtonElement>('button[aria-label="Large: 100"]')!.click()
	)
	expect(canvas.querySelectorAll('button[aria-label^="Article "]')).toHaveLength(100)
	expect(Number.parseFloat(canvas.style.minHeight)).toBeLessThanOrEqual(720)
	expect(canvas.className).toContain("overflow-y-auto")
})

it("treats direct root children without descendants as article leaves", async () => {
	const { Treemap } = await import("@repo/ui/components/Treemap")
	const activate = vi.fn()
	const focus = vi.fn()
	await act(() =>
		root.render(
			<Treemap
				ariaLabel="Articles"
				onLeafActivate={activate}
				onFocusChange={focus}
				data={{
					id: "root",
					label: "Articles",
					children: [{ id: "article", label: "Article", value: 1 }],
				}}
			/>
		)
	)
	const article = host.querySelector<HTMLButtonElement>('button[aria-label="Article: 1"]')!
	expect(article.textContent).toBe("Article")
	await act(() => article.click())
	expect(activate).toHaveBeenCalledWith("article")
	expect(focus).not.toHaveBeenCalled()
})
