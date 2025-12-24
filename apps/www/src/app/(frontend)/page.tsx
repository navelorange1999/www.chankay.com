import { ComingSoon } from "@repo/ui"
import { getHomePage } from "@/services/payload/pages"
import { Nodes } from "@/components/Nodes"

export const metadata = {
	title: "Home | Chan Kay",
	description: "Personal website and blog of Chan Kay - Full-stack developer",
}

export default async function HomePage() {
	const pageData = await getHomePage()
	const structure = pageData?.structure

	// If no CMS data, show a default message
	if (!pageData || !Array.isArray(structure) || structure.length === 0) {
		return <ComingSoon />
	}

	return (
		<>
			<Nodes nodes={structure} />
		</>
	)
}
