import * as React from "react";

export interface NavbarLink {
	/** 链接显示文本 */
	label: string;
	/** 链接地址 */
	href: string;
	/** 是否为外部链接 */
	external?: boolean;
}

export interface NavbarProps {
	/** Logo 组件 */
	logo?: React.ReactNode;
	/** 网站标题 */
	title?: string;
	/** 导航链接数组 */
	links?: NavbarLink[];
	/** 右侧内容 */
	rightContent?: React.ReactNode;
	/** 额外的 CSS 类名 */
	className?: string;
	/** 是否固定定位 */
	sticky?: boolean;
	/** 导航栏布局变体 */
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
	const navClass = `w-full z-30 top-0 ${sticky ? "sticky" : ""} bg-backgroun- border-b border-border ${className}`;

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
