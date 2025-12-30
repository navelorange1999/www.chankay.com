import { getHomePage } from "@/services/payload/pages"
import { Nodes } from "@/components/Nodes"

export const metadata = {
	title: "Home | Chan Kay",
	description: "Personal website and blog of Chan Kay - Full-stack developer",
}

export default async function HomePage() {
	const pageData = await getHomePage()
	const structure = pageData?.structure

	return (
		<>
			<Nodes nodes={structure} />
		</>
	)
}
