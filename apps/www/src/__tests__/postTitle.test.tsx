import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { PostTitle } from "@repo/ui/components/Post"

describe("PostTitle", () => {
	it("renders card titles as h2 by default", () => {
		const markup = renderToStaticMarkup(<PostTitle>Card title</PostTitle>)

		expect(markup.startsWith("<h2")).toBe(true)
	})

	it("renders detail titles as h1 without leaking the as prop", () => {
		const markup = renderToStaticMarkup(<PostTitle as="h1">Detail title</PostTitle>)

		expect(markup.startsWith("<h1")).toBe(true)
		expect(markup).not.toContain('as="h1"')
	})
})
