export function ThemeScript() {
	const script = `
		(function() {
			try {
				var theme = localStorage.getItem('theme') || 'system';
				var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
				var resolvedTheme = theme === 'system' ? systemTheme : theme;
				
				if (resolvedTheme === 'dark') {
					document.documentElement.classList.add('dark');
					document.documentElement.style.colorScheme = 'dark';
				} else {
					document.documentElement.classList.remove('dark');
					document.documentElement.style.colorScheme = 'light';
				}
			} catch (error) {
				console.warn('Theme script error:', error);
			}
		})();
	`

	return <script dangerouslySetInnerHTML={{ __html: script }} suppressHydrationWarning />
}
