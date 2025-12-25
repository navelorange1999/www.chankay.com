import { NextResponse } from "next/server"

type HeatmapRange = "last_30" | "last_90" | "last_180" | "last_365" | "ytd"

type ContributionDay = {
	date: string
	contributionCount: number
}

type GitHubGraphQLResponse = {
	data?: {
		user?: {
			contributionsCollection?: {
				contributionCalendar?: {
					totalContributions?: number
					weeks?: Array<{
						contributionDays?: ContributionDay[]
					}>
				}
			}
		}
	}
	errors?: Array<{ message?: string }>
}

type HeatmapLevel = 0 | 1 | 2 | 3 | 4

const REVALIDATE_SECONDS = 86400

function isGitHubUsername(value: string): boolean {
	return /^[a-zA-Z0-9-]{1,39}$/.test(value)
}

function asRange(value: string | null | undefined): HeatmapRange {
	if (!value) return "last_365"
	const allowed: HeatmapRange[] = ["last_30", "last_90", "last_180", "last_365", "ytd"]
	return allowed.includes(value as HeatmapRange) ? (value as HeatmapRange) : "last_365"
}

function computeFromTo(range: HeatmapRange): { from: Date; to: Date } {
	const to = new Date()
	const toUTC = new Date(
		Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate(), 23, 59, 59, 999)
	)

	if (range === "ytd") {
		const from = new Date(Date.UTC(toUTC.getUTCFullYear(), 0, 1, 0, 0, 0, 0))
		return { from, to: toUTC }
	}

	const days =
		range === "last_30" ? 30 : range === "last_90" ? 90 : range === "last_180" ? 180 : 365

	const from = new Date(toUTC)
	from.setUTCDate(from.getUTCDate() - (days - 1))
	from.setUTCHours(0, 0, 0, 0)

	return { from, to: toUTC }
}

function computeLevels(days: Array<{ date: string; count: number }>) {
	let maxCount = 0
	days.forEach((d) => {
		maxCount = Math.max(maxCount, d.count)
	})

	const t1 = Math.max(1, Math.ceil(maxCount * 0.25))
	const t2 = Math.max(t1 + 1, Math.ceil(maxCount * 0.5))
	const t3 = Math.max(t2 + 1, Math.ceil(maxCount * 0.75))

	function levelForCount(count: number): HeatmapLevel {
		if (!Number.isFinite(count) || count <= 0) return 0
		if (!Number.isFinite(maxCount) || maxCount <= 0) return 1
		if (count <= t1) return 1
		if (count <= t2) return 2
		if (count <= t3) return 3
		return 4
	}

	return days.map((d) => ({
		...d,
		level: levelForCount(d.count),
	}))
}

async function fetchGitHubContributionDays(
	username: string,
	range: HeatmapRange,
	revalidateSeconds: number
): Promise<Array<{ date: string; count: number }>> {
	const token = process.env.GITHUB_TOKEN
	if (!token) {
		throw new Error("Missing GITHUB_TOKEN")
	}

	const { from, to } = computeFromTo(range)

	const query = `
		query($login: String!, $from: DateTime!, $to: DateTime!) {
			user(login: $login) {
				contributionsCollection(from: $from, to: $to) {
					contributionCalendar {
						totalContributions
						weeks {
							contributionDays {
								date
								contributionCount
							}
						}
					}
				}
			}
		}
	`

	const response = await fetch("https://api.github.com/graphql", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({
			query,
			variables: {
				login: username,
				from: from.toISOString(),
				to: to.toISOString(),
			},
		}),
		next: {
			revalidate: revalidateSeconds,
		},
	})

	if (!response.ok) {
		throw new Error(`GitHub API error (${response.status})`)
	}

	const json = (await response.json()) as GitHubGraphQLResponse
	if (json.errors?.length) {
		const msg = json.errors
			.map((e) => e.message)
			.filter(Boolean)
			.join("; ")
		throw new Error(msg || "GitHub GraphQL error")
	}

	const weeks = json.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? []
	const days: Array<{ date: string; count: number }> = []

	weeks.forEach((w) => {
		const contributionDays = w.contributionDays ?? []
		contributionDays.forEach((d) => {
			if (typeof d.date !== "string") return
			const date = d.date.slice(0, 10)
			const count = typeof d.contributionCount === "number" ? d.contributionCount : 0
			days.push({ date, count })
		})
	})

	return days
}

export async function GET(request: Request) {
	try {
		const url = new URL(request.url)
		const range = asRange(url.searchParams.get("range"))

		const revalidateSeconds = REVALIDATE_SECONDS

		const requested = url.searchParams.get("username")?.trim() || ""
		if (!requested || !isGitHubUsername(requested)) {
			return NextResponse.json({ error: "Invalid or missing username" }, { status: 400 })
		}

		const rawDays = await fetchGitHubContributionDays(requested, range, revalidateSeconds)
		const days = computeLevels(rawDays)

		return NextResponse.json(
			{
				username: requested,
				range,
				days,
			},
			{
				headers: {
					"Cache-Control": `public, s-maxage=${revalidateSeconds}, stale-while-revalidate=${revalidateSeconds}`,
				},
			}
		)
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error"
		return NextResponse.json({ error: message }, { status: 500 })
	}
}
