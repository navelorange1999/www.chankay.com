"use client"

import dynamic from "next/dynamic"

import type { PostTocDrawerProps } from "@repo/ui/components/PostTocDrawer"

const PostTocDrawer = dynamic(
	() => import("@repo/ui/components/PostTocDrawer").then((module) => module.PostTocDrawer),
	{
		ssr: false,
		loading: () => <></>,
	}
)

export function PostTocDrawerClient(props: PostTocDrawerProps) {
	return <PostTocDrawer {...props} />
}
