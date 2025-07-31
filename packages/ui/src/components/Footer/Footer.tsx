import Image from "next/image";
import Link from "next/link";
import {FooterProps} from "@repo/typescript-config/typings/payload-types";
import {cn} from "#utils/classnames";

export function Footer({
	logo,
	title = "Chan Kay's site",
	copyright,
	socials = [],
	className = "",
}: FooterProps) {
	const currentYear = new Date().getFullYear();
	const defaultCopyright = `© ${currentYear} ${title}`;

	return (
		<footer className={cn(`bg-gray-900 text-white py-6`, className)}>
			{/* Container for the footer content */}
			<div className="container mx-auto px-4 md:px-6">
				{/* Main Footer Content */}
				<div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
					{/* Left: Logo and Name */}
					<div className="flex items-center gap-3">
						{logo && (
							<Image
								{...logo}
								alt={`${title} logo`}
								className="h-8 w-8 rounded-full object-cover"
							/>
						)}
						<span className="text-lg font-semibold">{title}</span>
					</div>

					{/* Right: Social Links */}
					{(socials ?? []).length > 0 && (
						<div className="flex gap-4">
							{socials?.map((social) => (
								<Link
									key={social.name}
									href={social.href}
									className="text-gray-400 hover:text-white transition-colors duration-200"
									aria-label={`Follow me on ${social.name}`}
									target="_blank"
									rel="noopener noreferrer"
								>
									<Image
										{...social.icon}
										alt={
											social.icon.alt ||
											`${social.name} icon`
										}
										className="h-5 w-5"
									/>
								</Link>
							))}
						</div>
					)}
				</div>

				{/* Bottom: Navigation and Copyright */}
				<div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-800">
					{/* Navigation Links */}
					<nav className="flex gap-6 text-sm">
						<Link
							href="/about"
							className="text-gray-400 hover:text-white transition-colors duration-200"
						>
							About
						</Link>
						<Link
							href="/projects"
							className="text-gray-400 hover:text-white transition-colors duration-200"
						>
							Projects
						</Link>
						<Link
							href="/blog"
							className="text-gray-400 hover:text-white transition-colors duration-200"
						>
							Blog
						</Link>
						<Link
							href="/contact"
							className="text-gray-400 hover:text-white transition-colors duration-200"
						>
							Contact
						</Link>
					</nav>

					{/* Copyright */}
					<p className="text-gray-400 text-sm">
						{copyright || defaultCopyright}
					</p>
				</div>
			</div>
		</footer>
	);
}
