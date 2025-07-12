import * as React from "react";

export interface NavbarLink {
	label: string;
	href: string;
	external?: boolean;
}

export interface NavbarProps {
	logo?: React.ReactNode;
	title?: string;
	links?: NavbarLink[];
	rightContent?: React.ReactNode;
	className?: string;
	sticky?: boolean;
	variant?: "default" | "centered";
}

export const Navbar: React.FC<NavbarProps> = ({
	logo,
	title = "Your Site",
	links = [],
	rightContent,
	className = "",
	sticky = false,
	variant = "default",
}) => {
	const navClass = `w-full z-30 top-0 ${sticky ? "sticky" : ""} bg-background border-b border-border ${className}`;

	const renderLinks = () => (
		<nav className="flex space-x-4">
			{links.map((link) => (
				<a
					key={link.label}
					href={link.href}
					target={link.external ? "_blank" : undefined}
					rel={link.external ? "noopener noreferrer" : undefined}
					className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
				>
					{link.label}
				</a>
			))}
		</nav>
	);

	if (variant === "centered") {
		return (
			<header className={navClass}>
				<div className="container mx-auto px-4 flex flex-col items-center py-4">
					{logo && <div className="mb-2">{logo}</div>}
					<div className="flex flex-col items-center">
						{title && (
							<span className="text-lg font-bold text-foreground mb-2">
								{title}
							</span>
						)}
						{renderLinks()}
					</div>
					{rightContent && <div className="mt-2">{rightContent}</div>}
				</div>
			</header>
		);
	}

	return (
		<header className={navClass}>
			<div className="container mx-auto px-4 flex items-center justify-between py-4">
				<div className="flex items-center space-x-2">
					{logo}
					{title && (
						<span className="text-lg font-bold text-foreground">
							{title}
						</span>
					)}
				</div>
				{renderLinks()}
				{rightContent && <div>{rightContent}</div>}
			</div>
		</header>
	);
};
