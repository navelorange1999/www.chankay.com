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
				
				root.classList.remove('light', 'dark');
				root.classList.add(resolvedTheme);
				root.setAttribute('data-theme', resolvedTheme);
				root.style.colorScheme = resolvedTheme;

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
