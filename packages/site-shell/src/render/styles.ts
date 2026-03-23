export const siteShellStyles = `
:host {
	display: block;
	color: var(--site-shell-foreground, var(--foreground, #26231f));
	font-family: var(
		--site-shell-font-sans,
		var(--font-sans, "Montserrat", "Segoe UI", sans-serif)
	);
}

:host *,
:host *::before,
:host *::after {
	box-sizing: border-box;
}

a {
	color: inherit;
}

.site-shell-root {
	display: grid;
	gap: 0;
}

.site-shell-header {
	border-bottom: 1px solid var(--site-shell-border, var(--border, #e4ddd2));
	background:
		linear-gradient(180deg, color-mix(in oklab, var(--site-shell-card, var(--card, #f7f4ee)) 92%, white) 0%, var(--site-shell-background, var(--background, #f7f4ee)) 100%);
	box-shadow: var(--site-shell-shadow, var(--shadow-sm, 0 10px 30px rgba(15, 23, 42, 0.08)));
}

.site-shell-footer {
	border-top: 1px solid var(--site-shell-border, var(--border, #e4ddd2));
	background: var(--site-shell-card, var(--card, #f7f4ee));
}

.site-shell-container {
	width: min(1120px, calc(100% - 2rem));
	margin: 0 auto;
}

.site-shell-header-inner {
	min-height: var(--site-shell-navbar-height, var(--navbar-height, 4rem));
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	padding: 0.85rem 0;
	flex-wrap: wrap;
}

.site-shell-footer-inner {
	display: grid;
	gap: 1rem;
	padding: 1.5rem 0;
}

.site-shell-footer-top,
.site-shell-footer-bottom {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	flex-wrap: wrap;
}

.site-shell-brand {
	display: inline-flex;
	align-items: center;
	gap: 0.75rem;
	text-decoration: none;
	min-width: 0;
}

.site-shell-brand-logo {
	width: 2rem;
	height: 2rem;
	flex: none;
	object-fit: contain;
}

.site-shell-brand-copy {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	min-width: 0;
}

.site-shell-brand-name {
	font-size: 1rem;
	font-weight: 700;
	letter-spacing: 0.02em;
}

.site-shell-site-name {
	color: var(--site-shell-muted-foreground, var(--muted-foreground, #6a6358));
	font-size: 0.92rem;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.site-shell-site-name::before {
	content: "/";
	display: inline-block;
	margin-right: 0.5rem;
	color: var(--site-shell-border-strong, color-mix(in oklab, var(--site-shell-border, var(--border, #e4ddd2)) 80%, var(--site-shell-foreground, #26231f)));
}

.site-shell-nav,
.site-shell-footer-links {
	display: flex;
	align-items: center;
	gap: 0.45rem;
	flex-wrap: wrap;
}

.site-shell-link {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	padding: 0.6rem 0.9rem;
	border-radius: 999px;
	text-decoration: none;
	color: var(--site-shell-muted-foreground, var(--muted-foreground, #6a6358));
	font-size: 0.95rem;
	font-weight: 600;
	transition:
		background-color 160ms ease,
		color 160ms ease,
		transform 160ms ease;
}

.site-shell-link:hover,
.site-shell-link:focus-visible,
.site-shell-icon-link:hover,
.site-shell-icon-link:focus-visible {
	background: var(--site-shell-accent, var(--accent, #e7f0df));
	color: var(--site-shell-accent-foreground, var(--accent-foreground, #2f5f44));
	outline: none;
	transform: translateY(-1px);
}

.site-shell-icon-link {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 2.5rem;
	height: 2.5rem;
	border-radius: 999px;
	text-decoration: none;
	color: var(--site-shell-foreground, var(--foreground, #26231f));
	border: 1px solid var(--site-shell-border, var(--border, #e4ddd2));
	background: color-mix(in oklab, var(--site-shell-card, var(--card, #f7f4ee)) 92%, white);
	transition:
		background-color 160ms ease,
		color 160ms ease,
		transform 160ms ease;
}

.site-shell-icon-link svg {
	width: 1.15rem;
	height: 1.15rem;
}

.site-shell-footnote,
.site-shell-copyright {
	margin: 0;
	color: var(--site-shell-muted-foreground, var(--muted-foreground, #6a6358));
	font-size: 0.9rem;
	line-height: 1.5;
}

@media (max-width: 640px) {
	.site-shell-header-inner,
	.site-shell-footer-top,
	.site-shell-footer-bottom {
		align-items: flex-start;
	}

	.site-shell-brand-copy {
		flex-wrap: wrap;
	}
}
`.trim()
