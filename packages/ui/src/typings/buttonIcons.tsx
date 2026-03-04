import type { LucideIcon } from "lucide-react"
import {
	ArrowLeft,
	ArrowRight,
	Calendar,
	ChevronLeft,
	ChevronRight,
	Clock3,
	Download,
	ExternalLink,
	Globe,
	Heart,
	Home,
	Mail,
	MapPin,
	Menu,
	Phone,
	Search,
	Star,
	User,
} from "lucide-react"

export const buttonIconOptions = [
	{ label: "None", value: "none" },
	{ label: "Download", value: "download" },
	{ label: "Heart", value: "heart" },
	{ label: "Star", value: "star" },
	{ label: "Arrow Right", value: "arrowRight" },
	{ label: "Arrow Left", value: "arrowLeft" },
	{ label: "Chevron Right", value: "chevronRight" },
	{ label: "Chevron Left", value: "chevronLeft" },
	{ label: "External Link", value: "externalLink" },
	{ label: "Mail", value: "mail" },
	{ label: "Phone", value: "phone" },
	{ label: "Map Pin", value: "mapPin" },
	{ label: "Globe", value: "globe" },
	{ label: "Search", value: "search" },
	{ label: "Menu", value: "menu" },
	{ label: "Home", value: "home" },
	{ label: "User", value: "user" },
	{ label: "Calendar", value: "calendar" },
	{ label: "Clock", value: "clock" },
] as const

export const buttonIconValues = buttonIconOptions.map((option) => option.value) as readonly string[]

export type ButtonIconName = (typeof buttonIconOptions)[number]["value"]

export const buttonIconComponentMap: Record<Exclude<ButtonIconName, "none">, LucideIcon> = {
	download: Download,
	heart: Heart,
	star: Star,
	arrowRight: ArrowRight,
	arrowLeft: ArrowLeft,
	chevronRight: ChevronRight,
	chevronLeft: ChevronLeft,
	externalLink: ExternalLink,
	mail: Mail,
	phone: Phone,
	mapPin: MapPin,
	globe: Globe,
	search: Search,
	menu: Menu,
	home: Home,
	user: User,
	calendar: Calendar,
	clock: Clock3,
}
