import { writable } from 'svelte/store';
import type { Story } from '$lib/domain/story';

export type Theme = 'light' | 'dark' | 'oled';

/** Currently open story */
export const activeStory = writable<Story | null>(null);

/** Whether the sidebar is collapsed */
export const sidebarOpen = writable(true);

/** Theme — cycles through light, dark, oled */
export const theme = writable<Theme>('light');

/** Initialize theme from localStorage */
export function initTheme() {
	if (typeof window === 'undefined') return;
	const stored = localStorage.getItem('theme') as Theme | null;
	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	const initial: Theme = stored ?? (prefersDark ? 'dark' : 'light');
	theme.set(initial);
	document.documentElement.dataset.theme = initial;
}

/** Cycle theme: light → dark → oled → light */
export function cycleTheme() {
	theme.update((t) => {
		const next: Record<Theme, Theme> = { light: 'dark', dark: 'oled', oled: 'light' };
		const n = next[t];
		localStorage.setItem('theme', n);
		document.documentElement.dataset.theme = n;
		return n;
	});
}
