import { Section } from "@/components/Section"

export const metadata = {
	title: "Home | Chan Kay",
	description: "Personal website and blog of Chan Kay - Full-stack developer",
}

async function getHomePageData() {
	try {
		// Fetch the homepage data from Payload CMS
		// The slug "home" should be created in the CMS
		const response = await fetch(
			`${process.env.PAYLOAD_API_URL || "http://localhost:3001"}/api/pages?where[slug][equals]=home&depth=2`,
			{
				next: {
					revalidate: 60, // Revalidate every 60 seconds
				},
			}
		)

		if (!response.ok) {
			console.error("Failed to fetch homepage data")
			return null
		}

		const data = await response.json()
		return data.docs && data.docs.length > 0 ? data.docs[0] : null
	} catch (error) {
		console.error("Error fetching homepage:", error)
		return null
	}
}

export default async function HomePage() {
	const pageData = await getHomePageData()

	// If no CMS data, show a default message
	if (!pageData || !pageData.sections || pageData.sections.length === 0) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-purple-950 dark:to-blue-950">
				<div className="text-center p-8">
					<h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
						Welcome! 👋
					</h1>
					<p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6">
						Your homepage is ready to be configured.
					</p>
					<p className="text-gray-500 dark:text-gray-400">
						Go to the admin panel and create a page with slug "home" to get started.
					</p>
					<a
						href="http://localhost:3001"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						Open Admin Panel
					</a>
				</div>
			</div>
		)
	}

	return <Section sections={pageData.sections} />
}
