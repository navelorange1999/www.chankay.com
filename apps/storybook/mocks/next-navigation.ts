// Mock Next.js navigation hooks for Storybook

export function usePathname(): string {
	return "/"
}

export function useRouter() {
	return {
		push: (url: string) => {
			console.log("Router push:", url)
		},
		replace: (url: string) => {
			console.log("Router replace:", url)
		},
		prefetch: () => {},
		back: () => {
			console.log("Router back")
		},
		pathname: "/",
		query: {},
		asPath: "/",
	}
}

export function useSearchParams() {
	return new URLSearchParams()
}

export function useParams() {
	return {}
}
