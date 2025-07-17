import * as React from "react";
import ThemeToggle from "./ThemeToggle";

export interface NavbarLink {
	/** link text */
	label: string;
	/** link address */
	href: string;
	/** is _blank open */
	external?: boolean;
}

export interface NavbarProps {
	/** Logo  */
	logo?: string;
	/** Website title */
	title?: string;
	/** Navigation links array */
	links?: NavbarLink[];
	/** Additional CSS class name */
	className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
	logo,
	title = "Chan Kay's Site",
	links = [],
	className = "",
}) => {
	return (
		<header className={`bg-amber-200 dark:bg-gray-900 ${className}`}>
			<div className="mx-auto flex h-16 max-w-screen-xl items-center gap-8 px-4 sm:px-6 lg:px-8">
				<a className="block text-teal-600 dark:text-teal-300" href="#">
					<span className="sr-only">{title}</span>
					<img width={24} height={24} src={logo} />
				</a>

				<div className="flex flex-1 items-center justify-end md:justify-between">
					<nav aria-label="Global" className="hidden md:block">
						<ul className="flex items-center gap-6 text-sm">
							{links.map((menu) => (
								<li key={menu.href}>
									<a
										className="text-gray-500 transition hover:text-gray-500/75 dark:text-white dark:hover:text-white/75"
										href={menu.href}
										target={
											menu.external ? "_blank" : "_self"
										}
										rel="noreferrer"
									>
										{menu.label}
									</a>
								</li>
							))}
						</ul>
					</nav>

					<div className="flex items-center gap-4">
						<div className="sm:flex sm:gap-4">
							<ThemeToggle />
						</div>

						<button className="block rounded-sm bg-gray-100 p-2.5 text-gray-600 transition hover:text-gray-600/75 md:hidden dark:bg-gray-800 dark:text-white dark:hover:text-white/75">
							<span className="sr-only">Toggle menu</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="size-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth="2"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M4 6h16M4 12h16M4 18h16"
								/>
							</svg>
						</button>
					</div>
				</div>
			</div>
		</header>
	);
};
