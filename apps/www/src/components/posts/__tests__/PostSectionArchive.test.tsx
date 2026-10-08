import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Post, Category } from "@repo/typescript-config/typings/payload-types"

const mocks = vi.hoisted(() => ({
	getPostsBySection: vi.fn(),
	getCategoryBySlug: vi.fn(),
	getSiteConfig: vi.fn(),
}))

vi.mock("@/services/payload/posts", () => ({
	getPostsBySection: mocks.getPostsBySection,
}))

vi.mock("@/services/payload/categories", () => ({
	getCategoryBySlug: mocks.getCategoryBySlug,
}))

vi.mock("@/services/payload/site-config", () => ({
	getSiteConfig: mocks.getSiteConfig,
}))

import { PostSectionArchive } from "../PostSectionArchive"

const technicalCategory: Category = {
	_status: "published",
	id: "technical-id",
	name: "Technical",
	slug: "technical",
	description: "Engineering notes and architecture.",
	updatedAt: "2026-09-01T00:00:00.000Z",
	createdAt: "2026-09-01T00:00:00.000Z",
}

const tradingCategory: Category = {
	...technicalCategory,
	id: "trading-id",
	name: "Trading",
	slug: "trading",
}

const post: Post = {
	id: "post-id",
	title: "Architecture",
	slug: "architecture",
	excerpt: "A practical architecture note.",
	content: "# Architecture",
	_status: "published",
	publishedAt: "2026-09-01T00:00:00.000Z",
	readingTime: 4,
	updatedAt: "2026-09-01T00:00:00.000Z",
	createdAt: "2026-09-01T00:00:00.000Z",
}

describe("PostSectionArchive", () => {
	beforeEach(() => {
		mocks.getSiteConfig.mockResolvedValue({
			siteUrl: "https://chankay.com",
		})
	})

	it("renders the CMS Technical category and section post path", async () => {
		mocks.getPostsBySection.mockResolvedValue([post])
		mocks.getCategoryBySlug.mockResolvedValue(technicalCategory)

		const markup = renderToStaticMarkup(
			await PostSectionArchive({ locale: "en", section: "technical" })
		)

		expect(markup).toContain("Technical")
		expect(markup).toContain("Engineering notes and architecture.")
		expect(markup).toContain('href="/technical/architecture"')
	})

	it("renders the Chinese Trading empty state", async () => {
		mocks.getPostsBySection.mockResolvedValue([])
		mocks.getCategoryBySlug.mockResolvedValue(tradingCategory)

		const markup = renderToStaticMarkup(
			await PostSectionArchive({ locale: "zh-CN", section: "trading" })
		)

		expect(markup).toContain("该板块暂无已发布文章。")
	})

	it("does not render retired tag badges on article cards", async () => {
		mocks.getPostsBySection.mockResolvedValue([
			{ ...post, tags: [{ id: "old", name: "Old tag", _status: "published" }] },
		])
		mocks.getCategoryBySlug.mockResolvedValue(technicalCategory)
		const markup = renderToStaticMarkup(
			await PostSectionArchive({ locale: "en", section: "technical" })
		)
		expect(markup).not.toContain('data-slot="post-tag"')
	})

	it("does not render links for posts with unsafe CMS slugs", async () => {
		mocks.getPostsBySection.mockResolvedValue([{ ...post, slug: " .. " }])
		mocks.getCategoryBySlug.mockResolvedValue(technicalCategory)

		const markup = renderToStaticMarkup(
			await PostSectionArchive({ locale: "en", section: "technical" })
		)

		expect(markup).not.toContain('href="/technical/.."')
		expect(markup).not.toContain('href="/technical/ .. "')
	})
})
