import { Section, type SectionProps } from "@/components/Section"
import { ComingSoon } from "@repo/ui"
import { getHomePage } from "@/services/payload/pages"

export const metadata = {
	title: "Home | Chan Kay",
	description: "Personal website and blog of Chan Kay - Full-stack developer",
}

export default async function HomePage() {
	const pageData = await getHomePage()

	// If no CMS data, show a default message
	if (!pageData || !pageData.sections || pageData.sections.length === 0) {
		return <ComingSoon />
	}

	// Type assertion: Payload CMS ensures that when sectionType is set,
	// the corresponding data field (hero, features, etc.) exists
	return <Section sections={pageData.sections as SectionProps["sections"]} />
}
