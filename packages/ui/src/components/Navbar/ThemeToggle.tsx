const ThemeToggle = () => {
	return (
		<button
			id="theme-toggle"
			className="bg-white/10 border border-white/20 rounded-lg p-2 cursor-pointer text-white transition-all duration-200 flex items-center justify-center w-10 h-10 relative hover:bg-white/20 hover:border-white/40 hover:scale-105"
			aria-label="Theme Toggle"
		>
			<svg
				id="sun-icon"
				className="absolute transition-all duration-300 opacity-0 scale-75 rotate-180"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
			>
				<circle cx="12" cy="12" r="5"></circle>
				<line x1="12" y1="1" x2="12" y2="3"></line>
				<line x1="12" y1="21" x2="12" y2="23"></line>
				<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
				<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
				<line x1="1" y1="12" x2="3" y2="12"></line>
				<line x1="21" y1="12" x2="23" y2="12"></line>
				<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
				<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
			</svg>
			<svg
				id="moon-icon"
				className="absolute transition-all duration-300 opacity-100 scale-100 rotate-0"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
			>
				<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
			</svg>
		</button>
	);
};

export default ThemeToggle;
