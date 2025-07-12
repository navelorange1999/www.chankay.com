import * as React from "react";

export interface FooterLink {
	label: string;
	href: string;
	external?: boolean;
}

export interface FooterSection {
	title: string;
	links: FooterLink[];
}

export interface FooterSocial {
	name: string;
	href: string;
	icon: React.ComponentType<{className?: string}>;
}

export interface FooterProps {
	title?: string;
	description?: string;
	copyright?: string;
	sections?: FooterSection[];
	socials?: FooterSocial[];
	className?: string;
	showDivider?: boolean;
	variant?: "default" | "minimal" | "centered";
}

export const Footer: React.FC<FooterProps> = (props: FooterProps) => {
	const {
		title = "Your Company",
		description,
		copyright = `© ${new Date().getFullYear()} ${props.title ?? "Your Company"}. All rights reserved.`,
		sections = [],
		socials = [],
		className = "",
		showDivider = true,
		variant = "default",
	} = props;

	const renderMinimalFooter = () => (
		<div className="py-6 text-center">
			<p className="text-sm text-muted-foreground">{copyright}</p>
		</div>
	);

	const renderCenteredFooter = () => (
		<div className="py-12 text-center">
			{title && (
				<h3 className="text-lg font-semibold text-foreground mb-2">
					{title}
				</h3>
			)}
			{description && (
				<p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
					{description}
				</p>
			)}
			{socials.length > 0 && (
				<div className="flex justify-center space-x-4 mb-6">
					{socials.map((social) => (
						<a
							key={social.name}
							href={social.href}
							target="_blank"
							rel="noopener noreferrer"
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							<social.icon className="h-5 w-5" />
							<span className="sr-only">{social.name}</span>
						</a>
					))}
				</div>
			)}
			<p className="text-sm text-muted-foreground">{copyright}</p>
		</div>
	);

	const renderDefaultFooter = () => (
		<div className="py-12">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
				{/* Company Info */}
				<div className="space-y-4">
					{title && (
						<h3 className="text-lg font-semibold text-foreground">
							{title}
						</h3>
					)}
					{description && (
						<p className="text-sm text-muted-foreground">
							{description}
						</p>
					)}
					{socials.length > 0 && (
						<div className="flex space-x-4">
							{socials.map((social) => (
								<a
									key={social.name}
									href={social.href}
									target="_blank"
									rel="noopener noreferrer"
									className="text-muted-foreground hover:text-foreground transition-colors"
								>
									<social.icon className="h-5 w-5" />
									<span className="sr-only">
										{social.name}
									</span>
								</a>
							))}
						</div>
					)}
				</div>

				{/* Sections */}
				{sections.map((section, index) => (
					<div key={index} className="space-y-4">
						<h4 className="text-sm font-semibold text-foreground">
							{section.title}
						</h4>
						<ul className="space-y-2">
							{section.links.map((link, linkIndex) => (
								<li key={linkIndex}>
									<a
										href={link.href}
										target={
											link.external ? "_blank" : undefined
										}
										rel={
											link.external
												? "noopener noreferrer"
												: undefined
										}
										className="text-sm text-muted-foreground hover:text-foreground transition-colors"
									>
										{link.label}
									</a>
								</li>
							))}
						</ul>
					</div>
				))}
			</div>

			{/* Copyright */}
			<div className="mt-8 pt-8 border-t border-border">
				<p className="text-sm text-muted-foreground text-center">
					{copyright}
				</p>
			</div>
		</div>
	);

	return (
		<footer className={`bg-background ${className}`}>
			{showDivider && <div className="border-t border-border" />}
			<div className="container mx-auto px-4">
				{variant === "minimal" && renderMinimalFooter()}
				{variant === "centered" && renderCenteredFooter()}
				{variant === "default" && renderDefaultFooter()}
			</div>
		</footer>
	);
};
