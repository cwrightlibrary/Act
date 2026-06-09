<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { initTheme, cycleTheme, theme, type Theme } from '$lib/stores/app';

	let { children } = $props();

	$effect(() => {
		initTheme();
	});

	function nextThemeLabel(t: Theme): string {
		const labels: Record<Theme, string> = { light: 'Switch to dark', dark: 'Switch to OLED', oled: 'Switch to light' };
		return labels[t];
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex min-h-dvh flex-col">
	<!-- Skip to main content -->
	<a
		href="#main-content"
		class="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-sm focus:px-3 focus:py-1.5 focus:text-sm focus:font-semibold"
		style="color: var(--control-text); background: var(--control-bg);"
	>
		Skip to main content
	</a>

	<!-- Header -->
	<header
		class="flex h-12 items-center justify-center border-b"
		style="border-color: var(--border-strong); background: var(--bg-front);"
	>
		<div class="flex w-full items-center justify-between px-2">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-2 no-underline" style="color: var(--text-strong);">
				<!-- Mountain/arc icon — represents story arc (rising action → climax → resolution) -->
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<polyline points="2 20 6 9 10 16 14 5 18 14 22 20" />
				</svg>
				<span class="text-base font-bold" style="letter-spacing: -0.02em;">
					Act
				</span>
			</a>

			<!-- Right side -->
			<div class="flex items-center gap-4">
				<button
					onclick={cycleTheme}
					class="btn-ghost flex h-7 w-7 items-center justify-center rounded-sm p-0 text-sm"
					aria-label={nextThemeLabel($theme)}
				>
					{#if $theme === 'light'}
						<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
							<path d="M12.5 9a5.5 5.5 0 0 1-6.5-6.5A5.5 5.5 0 1 0 12.5 9Z" />
						</svg>
					{:else if $theme === 'dark'}
						<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" aria-hidden="true">
							<path d="M12.5 9a5.5 5.5 0 0 1-6.5-6.5A5.5 5.5 0 1 0 12.5 9Z" />
							<circle cx="9.5" cy="4.5" r="0.8" fill="currentColor" stroke="none" />
						</svg>
					{:else}
						<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
							<circle cx="7.5" cy="7.5" r="3" />
							<line x1="7.5" y1="0.5" x2="7.5" y2="2.5" />
							<line x1="7.5" y1="12.5" x2="7.5" y2="14.5" />
							<line x1="0.5" y1="7.5" x2="2.5" y2="7.5" />
							<line x1="12.5" y1="7.5" x2="14.5" y2="7.5" />
							<line x1="2.5" y1="2.5" x2="4" y2="4" />
							<line x1="11" y1="11" x2="12.5" y2="12.5" />
							<line x1="11" y1="4" x2="12.5" y2="2.5" />
							<line x1="4" y1="11" x2="2.5" y2="12.5" />
						</svg>
					{/if}
				</button>
			</div>
		</div>
	</header>

	<!-- Page content -->
	<main id="main-content" class="flex-1" style="background: var(--bg-back); background-image: radial-gradient(var(--grid-dot) 1px, transparent 1px); background-size: var(--grid-size) var(--grid-size);">
		{@render children()}
	</main>
</div>
