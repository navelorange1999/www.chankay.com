import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Post, Tag } from "@repo/typescript-config/typings/payload-types"

const mocks = vi.hoisted(() => ({
	getPostsBySection: vi.fn(),
	getTagBySlug: vi.fn(),
	getSiteConfig: vi.fn(),
}))

vi.mock("@/services/payload/posts", () => ({
	getPostsBySection: mocks.getPostsBySection,
}))

vi.mock("@/services/payload/tags", () => ({
	getTagBySlug: mocks.getTagBySlug,
}))

vi.mock("@/services/payload/site-config", () => ({
	getSiteConfig: mocks.getSiteConfig,
}))

import { PostSectionArchive } from "../PostSectionArchive"

const technicalTag: Tag = {
	id: "technical-id",
	name: "Technical",
	slug: "technical",
	description: "Engineering notes and architecture.",
	updatedAt: "2026-09-01T00:00:00.000Z",
	createdAt: "2026-09-01T00:00:00.000Z",
}

const tradingTag: Tag = {
	...technicalTag,
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
	status: "published",
	publishedAt: "2026-09-01T00:00:00.000Z",
	primaryTag: technicalTag,
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

	it("renders the CMS Technical tag and section post path", async () => {
		mocks.getPostsBySection.mockResolvedValue([post])
		mocks.getTagBySlug.mockResolvedValue(technicalTag)

		const markup = renderToStaticMarkup(
			await PostSectionArchive({ locale: "en", section: "technical" })
		)

		expect(markup).toContain("Technical")
		expect(markup).toContain("Engineering notes and architecture.")
		expect(markup).toContain('href="/technical/architecture"')
	})

	it("renders the Chinese Trading empty state", async () => {
		mocks.getPostsBySection.mockResolvedValue([])
		mocks.getTagBySlug.mockResolvedValue(tradingTag)

		const markup = renderToStaticMarkup(
			await PostSectionArchive({ locale: "zh-CN", section: "trading" })
		)

		expect(markup).toContain("该板块暂无已发布文章。")
	})
})
