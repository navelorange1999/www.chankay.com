import { getHighlightThemeCss, HIGHLIGHT_STYLE_ELEMENT_ID } from "./highlightThemeCss"

export function ThemeScript() {
	const lightCss = JSON.stringify(getHighlightThemeCss("light"))
	const darkCss = JSON.stringify(getHighlightThemeCss("dark"))

	const script = `
		(function() {
			try {
				var theme = localStorage.getItem('theme') || 'system';
				var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
				var resolvedTheme = theme === 'system' ? systemTheme : theme;
				var root = document.documentElement;
				
				if (resolvedTheme === 'dark') {
					root.classList.add('dark');
					root.style.colorScheme = 'dark';
				} else {
					root.classList.remove('dark');
					root.style.colorScheme = 'light';
				}

				root.setAttribute('data-theme', resolvedTheme);

				var styleEl = document.getElementById('${HIGHLIGHT_STYLE_ELEMENT_ID}');
				if (!styleEl) {
					styleEl = document.createElement('style');
					styleEl.id = '${HIGHLIGHT_STYLE_ELEMENT_ID}';
					document.head.appendChild(styleEl);
				}

				styleEl.textContent = resolvedTheme === 'dark' ? ${darkCss} : ${lightCss};
				styleEl.setAttribute('data-theme', resolvedTheme);
			} catch (error) {
				console.warn('Theme script error:', error);
			}
		})();
	`

	return <script dangerouslySetInnerHTML={{ __html: script }} suppressHydrationWarning />
}
