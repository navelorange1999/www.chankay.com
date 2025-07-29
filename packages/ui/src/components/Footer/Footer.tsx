import Image, {ImageProps} from "next/image";

export interface FooterSocial {
	name: string;
	href: string;
	icon: ImageProps;
}

export interface FooterProps {
	logo?: ImageProps;
	title?: string;
	copyright?: string;
	socials?: FooterSocial[];
	className?: string;
}

export const Footer: React.FC<FooterProps> = (props: FooterProps) => {
	const {
		title = "Chan Kay",
		logo,
		copyright = `© ${new Date().getFullYear()} ${props.title ?? "Chan Kay"}. All rights reserved.`,
		socials = [],
		className = "",
	} = props;

	return (
		<footer className={`bg-gray-50 ${className}`}>
			<div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="sm:flex sm:items-center sm:justify-between">
					<div className="flex justify-center text-teal-600 sm:justify-start">
						{logo && <Image {...logo} />}
						{title && <span>{title}</span>}
					</div>
					<ul className="mt-8 flex justify-center gap-6 sm:mt-0 lg:justify-end">
						{socials.map((social) => (
							<li key={social.name}>
								<a
									href={social.href}
									rel="noreferrer"
									target="_blank"
									className="text-gray-700 transition hover:opacity-75 dark:text-gray-200"
								>
									<span className="sr-only">
										{social.name}
									</span>
									<Image {...social.icon} />
								</a>
							</li>
						))}
					</ul>
				</div>
				<p className="mt-4 text-center text-sm text-gray-500 lg:mt-0 lg:text-right">
					{copyright}
				</p>
			</div>
		</footer>
	);
};
