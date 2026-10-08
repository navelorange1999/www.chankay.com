"use client"

import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"

import { getUiStrings, resolveLocalizedPath, type SupportedLocale } from "@repo/i18n"
import { Treemap } from "@repo/ui/components/Treemap"

import type { TopicMapResponse } from "@/services/payload/topicMap"
import { topicMapToTree, topicMapTones } from "@/services/payload/topicMapAdapter"
import { isTopicArticlePage, type TopicArticlePage } from "@/services/payload/topicArticles"
import { resolveTopicMapSelection } from "@/services/payload/topicMapSelection"

type Category = TopicMapResponse["categories"][number]
type Topic = Category["topics"][number]

export function TopicMapExplorer({
	data,
	locale,
	maxTopicsPerCategory,
}: {
	data: TopicMapResponse
	locale: SupportedLocale
	maxTopicsPerCategory: number
}) {
	const strings = getUiStrings(locale).topicMap
	const [interactive, setInteractive] = useState(false)
	const [focusedCategoryId, setFocusedCategoryId] = useState<string | null>(null)
	const [selected, setSelected] = useState<{ category: Category; topic: Topic } | null>(null)
	const [otherCategory, setOtherCategory] = useState<Category | null>(null)
	const [page, setPage] = useState(1)
	const [articleState, setArticleState] = useState<
		"idle" | "loading" | "ready" | "empty" | "error" | "unavailable"
	>("idle")
	const [articlePage, setArticlePage] = useState<TopicArticlePage | null>(null)
	const [retryKey, setRetryKey] = useState(0)
	const panelHeadingRef = useRef<HTMLHeadingElement>(null)
	const triggerRef = useRef<HTMLElement | null>(null)
	const previousLocale = useRef(locale)
	const maxTopics = Number.isFinite(maxTopicsPerCategory)
		? Math.min(20, Math.max(3, Math.floor(maxTopicsPerCategory)))
		: 8
	const tree = topicMapToTree(data, maxTopics, strings.otherTopics)
	const activeCategory = data.categories.find((category) => category.id === focusedCategoryId)
	const currentSelection = useMemo(
		() => resolveTopicMapSelection(data.categories, selected),
		[data, selected]
	)
	const currentOtherCategory = otherCategory
		? (data.categories.find((category) => category.id === otherCategory.id) ?? null)
		: null

	const visibleArticlePage =
		currentSelection &&
		articlePage &&
		isTopicArticlePage(articlePage, {
			locale,
			category: currentSelection.category.id,
			topic: currentSelection.topic.tagId ?? "synthetic:untagged",
			page,
		})
			? articlePage
			: null

	useEffect(() => setInteractive(true), [])

	useEffect(() => {
		if (previousLocale.current === locale) return
		previousLocale.current = locale
		setFocusedCategoryId(null)
		setSelected(null)
		setOtherCategory(null)
		setPage(1)
	}, [locale])

	useEffect(() => {
		if (focusedCategoryId && !data.categories.some((category) => category.id === focusedCategoryId))
			setFocusedCategoryId(null)
		if (
			selected &&
			!data.categories.some(
				(category) =>
					category.id === selected.category.id &&
					category.topics.some((topic) => topic.id === selected.topic.id)
			)
		)
			setSelected(null)
		if (otherCategory && !data.categories.some((category) => category.id === otherCategory.id))
			setOtherCategory(null)
	}, [data, focusedCategoryId, selected, otherCategory])

	useEffect(() => {
		if (!currentSelection) return
		const controller = new AbortController()
		setArticleState("loading")
		setArticlePage(null)
		const params = new URLSearchParams({
			locale,
			category: currentSelection.category.id,
			topic: currentSelection.topic.tagId ?? "synthetic:untagged",
			page: String(page),
		})
		fetch(`/api/topic-map/articles?${params}`, { cache: "no-store", signal: controller.signal })
			.then(async (response) => {
				if (controller.signal.aborted) return
				if (response.status === 404) {
					setArticleState("unavailable")
					return
				}
				if (!response.ok) throw new Error("Topic articles unavailable")
				const body: unknown = await response.json()
				if (controller.signal.aborted) return
				if (
					!isTopicArticlePage(body, {
						locale,
						category: currentSelection.category.id,
						topic: currentSelection.topic.tagId ?? "synthetic:untagged",
						page,
					})
				)
					throw new Error("Invalid topic articles response")
				setArticlePage(body)
				setArticleState(body.totalDocs === 0 ? "empty" : "ready")
			})
			.catch(() => {
				if (!controller.signal.aborted) setArticleState("error")
			})
		return () => controller.abort()
	}, [currentSelection, page, locale, retryKey])

	useEffect(() => {
		if (currentSelection || currentOtherCategory) panelHeadingRef.current?.focus()
	}, [currentSelection, currentOtherCategory])

	function rememberTrigger() {
		triggerRef.current =
			document.activeElement instanceof HTMLElement ? document.activeElement : null
	}

	function showTopic(category: Category, topic: Topic) {
		rememberTrigger()
		setOtherCategory(null)
		setSelected({ category, topic })
		setPage(1)
	}

	function showOther(category: Category) {
		rememberTrigger()
		setSelected(null)
		setOtherCategory(category)
	}

	function closePanel() {
		setSelected(null)
		setOtherCategory(null)
		setArticleState("idle")
		setArticlePage(null)
		requestAnimationFrame(() => triggerRef.current?.focus())
	}

	function onLeafActivate(id: string) {
		if (id.startsWith("other:")) {
			const category = data.categories.find((candidate) => `other:${candidate.id}` === id)
			if (category) showOther(category)
			return
		}
		for (const category of data.categories) {
			const topic = category.topics.find((candidate) => candidate.id === id)
			if (topic) {
				showTopic(category, topic)
				return
			}
		}
	}

	return (
		<div>
			<p className="mb-4 text-sm text-muted-foreground">{strings.metricExplanation}</p>
			{activeCategory && (
				<nav className="mb-3 flex items-center gap-2 text-sm" aria-label={strings.allCategories}>
					<button
						type="button"
						className="min-h-11 rounded-md px-2 text-primary underline focus-visible:outline-2 focus-visible:outline-ring"
						onClick={() => {
							setFocusedCategoryId(null)
							closePanel()
						}}
					>
						{strings.allCategories}
					</button>
					<span aria-hidden="true">/</span>
					<span>{activeCategory.label}</span>
				</nav>
			)}
			<Treemap
				data={tree}
				ariaLabel={activeCategory?.label ?? strings.allCategories}
				focusedNodeId={focusedCategoryId}
				onFocusChange={(id) => {
					setFocusedCategoryId(id)
					closePanel()
				}}
				onLeafActivate={onLeafActivate}
				nodeTones={topicMapTones(data)}
			/>
			{(currentSelection || currentOtherCategory) && (
				<section className="mt-5 rounded-xl border border-border bg-card p-4" aria-live="polite">
					<div className="mb-3 flex items-start justify-between gap-3">
						<h3
							ref={panelHeadingRef}
							tabIndex={-1}
							className="text-lg font-semibold text-foreground"
						>
							{currentSelection
								? `${currentSelection.category.label} / ${currentSelection.topic.label}`
								: `${currentOtherCategory?.label} / ${strings.otherTopics}`}
						</h3>
						<button
							type="button"
							className="min-h-11 rounded-md px-3 text-foreground focus-visible:outline-2 focus-visible:outline-ring"
							onClick={closePanel}
						>
							{strings.close}
						</button>
					</div>
					{currentOtherCategory && (
						<ul className="grid gap-2 sm:grid-cols-2">
							{currentOtherCategory.topics.slice(maxTopics).map((topic) => (
								<li key={topic.id}>
									<button
										type="button"
										className="min-h-11 w-full rounded-md border border-border px-3 text-left text-foreground focus-visible:outline-2 focus-visible:outline-ring"
										onClick={() => showTopic(currentOtherCategory, topic)}
									>
										{topic.label} · {topic.value}
									</button>
								</li>
							))}
						</ul>
					)}
					{currentSelection && (
						<>
							{articleState === "loading" && <p>{strings.loading}</p>}
							{articleState === "empty" && <p>{strings.empty}</p>}
							{articleState === "unavailable" && <p>{strings.unavailable}</p>}
							{articleState === "error" && (
								<p>
									{strings.unavailable}{" "}
									<button
										type="button"
										className="min-h-11 px-3 underline"
										onClick={() => setRetryKey((key) => key + 1)}
									>
										{strings.retry}
									</button>
								</p>
							)}
							{articleState === "ready" && visibleArticlePage && (
								<>
									<p className="mb-2 text-sm text-muted-foreground">
										{visibleArticlePage.totalDocs} {strings.articles}
									</p>
									<ul className="space-y-3">
										{visibleArticlePage.docs.map((article) => (
											<li key={article.id}>
												<a
													className="font-medium text-primary underline focus-visible:outline-2 focus-visible:outline-ring"
													href={resolveLocalizedPath(
														locale,
														`/posts/${encodeURIComponent(article.slug)}`
													)}
												>
													{article.title}
												</a>
												{article.excerpt && (
													<p className="text-sm text-muted-foreground">{article.excerpt}</p>
												)}
											</li>
										))}
									</ul>
									<div className="mt-4 flex gap-2">
										<button
											type="button"
											className="min-h-11 rounded-md border border-border px-3 disabled:opacity-50"
											disabled={page <= 1}
											onClick={() => setPage((value) => value - 1)}
										>
											{strings.previous}
										</button>
										<button
											type="button"
											className="min-h-11 rounded-md border border-border px-3 disabled:opacity-50"
											disabled={!visibleArticlePage.hasNextPage}
											onClick={() => setPage((value) => value + 1)}
										>
											{strings.next}
										</button>
									</div>
								</>
							)}
						</>
					)}
				</section>
			)}
			<details className="mt-5 rounded-xl border border-border bg-card p-4">
				<summary className="flex min-h-11 cursor-pointer items-center text-foreground focus-visible:outline-2 focus-visible:outline-ring">
					{strings.viewData}
				</summary>
				<div className="overflow-x-auto">
					<table className="w-full border-collapse text-sm">
						<thead>
							<tr>
								<th scope="col" className="p-2 text-left">
									{strings.allCategories}
								</th>
								<th scope="col" className="p-2 text-left">
									{strings.uniqueArticles}
								</th>
								<th scope="col" className="p-2 text-left">
									{strings.tagUsages}
								</th>
							</tr>
						</thead>
						<tbody>
							{data.categories.flatMap((category) =>
								category.topics.map((topic) => (
									<tr key={topic.id} className="border-t border-border">
										<th scope="row" className="p-2 text-left font-medium">
											<button
												type="button"
												disabled={!interactive}
												className="min-h-11 rounded-md px-2 text-primary underline focus-visible:outline-2 focus-visible:outline-ring"
												onClick={() => {
													setFocusedCategoryId(category.id)
													closePanel()
												}}
											>
												{category.label}
											</button>
										</th>
										<td className="p-2">{category.publishedPostCount}</td>
										<td className="p-2">
											<button
												type="button"
												disabled={!interactive}
												className="min-h-11 rounded-md px-2 text-left text-primary underline focus-visible:outline-2 focus-visible:outline-ring"
												onClick={() => showTopic(category, topic)}
											>
												{topic.label}: {topic.value}
											</button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</details>
		</div>
	)
}
