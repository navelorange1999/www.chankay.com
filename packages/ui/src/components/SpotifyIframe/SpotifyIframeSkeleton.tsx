import { SkeletonBasic } from "../Skeletons"

function SpotifyIframeSkeleton({ height }: { height: number }) {
	return (
		<div className="h-full w-full overflow-hidden rounded-2xl bg-muted/20">
			<div className="flex h-full flex-col">
				<div className="flex flex-1 flex-col gap-6 p-6">
					<div className="flex gap-6">
						<div className="grid size-28 shrink-0 grid-cols-2 gap-1 overflow-hidden rounded-xl">
							<SkeletonBasic className="aspect-square rounded-none" />
							<SkeletonBasic className="aspect-square rounded-none" />
							<SkeletonBasic className="aspect-square rounded-none" />
							<SkeletonBasic className="aspect-square rounded-none" />
						</div>
						<div className="flex min-w-0 flex-1 flex-col justify-between gap-6">
							<div className="space-y-3">
								<SkeletonBasic className="h-9 w-56" />
								<SkeletonBasic className="h-5 w-40" />
								<SkeletonBasic className="h-9 w-44" />
							</div>
							<div className="flex items-center justify-end gap-3">
								<SkeletonBasic className="size-10 rounded-full" />
								<SkeletonBasic className="size-10 rounded-full" />
								<SkeletonBasic className="size-14 rounded-full" />
							</div>
						</div>
					</div>
				</div>

				<div className="border-t border-border/40 px-6 py-5">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<SkeletonBasic className="h-4 w-4" />
								<SkeletonBasic className="h-4 w-44" />
							</div>
							<SkeletonBasic className="h-4 w-12" />
						</div>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<SkeletonBasic className="h-4 w-4" />
								<SkeletonBasic className="h-4 w-40" />
							</div>
							<SkeletonBasic className="h-4 w-12" />
						</div>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<SkeletonBasic className="h-4 w-4" />
								<SkeletonBasic className="h-4 w-36" />
							</div>
							<SkeletonBasic className="h-4 w-12" />
						</div>
					</div>
				</div>
			</div>
			<div style={{ height }} />
		</div>
	)
}

export default SpotifyIframeSkeleton
