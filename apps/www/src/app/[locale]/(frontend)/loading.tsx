export default function Loading() {
	return (
		<div className="flex min-h-[calc(100dvh-var(--navbar-height,4rem)-4rem)] items-center justify-center">
			<div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
		</div>
	)
}
