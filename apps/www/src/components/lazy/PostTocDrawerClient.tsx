"use client"

import dynamic from "next/dynamic"

import type { PostTocDrawerProps } from "@repo/ui/components/PostTocDrawer"
import { SkeletonBasic } from "@repo/ui/components/Skeletons"

const PostTocDrawer = dynamic(
	() => import("@repo/ui/components/PostTocDrawer").then((module) => module.PostTocDrawer),
	{
		ssr: false,
		loading: () => <SkeletonBasic aria-hidden="true" className="h-9 w-9 rounded-lg" />,
	}
)

export function PostTocDrawerClient(props: PostTocDrawerProps) {
	return <PostTocDrawer {...props} />
}
