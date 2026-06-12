<script lang="ts">
	import { getAllStories, deleteStory, getAllScreenplays, getScreenplayByStory, saveStory } from '$lib/persistence/db';
	import type { Story } from '$lib/domain/story';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { importActFile, ActImportError } from '$lib/import';
	import { exportActFile } from '$lib/export';
	import TemplatePicker from '$lib/components/TemplatePicker.svelte';

	// ── Color palette ──
	const STORY_COLORS = [
		{ id: 'red', label: 'Red', color: '#ef4444' },
		{ id: 'orange', label: 'Orange', color: '#f97316' },
		{ id: 'yellow', label: 'Yellow', color: '#eab308' },
		{ id: 'green', label: 'Green', color: '#22c55e' },
		{ id: 'blue', label: 'Blue', color: '#3b82f6' },
		{ id: 'purple', label: 'Purple', color: '#a855f7' },
		{ id: 'pink', label: 'Pink', color: '#ec4899' },
	] as const;

	let stories = $state<Story[]>([]);
	let loading = $state(true);
	let screenplayIds = $state<Set<string>>(new Set());
	let importError = $state<string | null>(null);
	let importing = $state(false);
	let fileInputEl: HTMLInputElement | undefined = $state();
	let showTemplatePicker = $state(false);

	// Search
	let searchQuery = $state('');

	// Color filter
	let colorFilter = $state<string | null>(null);

	let filteredStories = $derived(
		stories.filter((s) => {
			if (searchQuery) {
				const q = searchQuery.toLowerCase();
				if (
					!s.title.toLowerCase().includes(q) &&
					!s.logline?.toLowerCase().includes(q)
				) return false;
			}
			if (colorFilter && s.color !== colorFilter) return false;
			return true;
		})
	);

	// Color picker state (which story has its picker open)
	let colorPickerStoryId = $state<string | null>(null);

	// Bulk selection
	let selectedIds = $state<Set<string>>(new Set());
	let hasSelection = $derived(selectedIds.size > 0);
	let bulkDeleteConfirm = $state(false);

	// Safety: two-step inline delete
	let confirmDeleteId = $state<string | null>(null);

	onMount(async () => {
		stories = await getAllStories();
		const sps = await getAllScreenplays();
		screenplayIds = new Set(sps.map((sp) => sp.storyId));
		loading = false;
	});

	function handleNewStory() {
		showTemplatePicker = true;
	}

	// ── Color tag ──
	async function setStoryColor(storyId: string, color: string | undefined) {
		const story = stories.find((s) => s.id === storyId);
		if (story) {
			story.color = color;
			await saveStory(story);
			// Trigger reactivity
			stories = [...stories];
		}
		colorPickerStoryId = null;
	}

	function toggleColorPicker(storyId: string, e: Event) {
		e.stopPropagation();
		e.preventDefault();
		// Close any other open picker first
		if (colorPickerStoryId && colorPickerStoryId !== storyId) {
			colorPickerStoryId = null;
			// Need tick for Svelte to process the close before re-opening
			requestAnimationFrame(() => {
				colorPickerStoryId = storyId;
			});
			return;
		}
		colorPickerStoryId = colorPickerStoryId === storyId ? null : storyId;
	}

	function getColorHex(colorId: string | undefined): string | undefined {
		return STORY_COLORS.find((c) => c.id === colorId)?.color;
	}

	// ── Two-step delete ──
	function requestDelete(id: string, e: Event) {
		e.stopPropagation();
		e.preventDefault();
		confirmDeleteId = id;
	}

	function cancelDelete(e: Event) {
		e.stopPropagation();
		e.preventDefault();
		confirmDeleteId = null;
	}

	async function confirmDelete(id: string, e: Event) {
		e.stopPropagation();
		e.preventDefault();
		await deleteStory(id);
		stories = await getAllStories();
		confirmDeleteId = null;
		selectedIds.delete(id);
		selectedIds = new Set(selectedIds);
	}

	// ── Bulk selection ──
	function toggleSelect(id: string, e: Event) {
		e.stopPropagation();
		e.preventDefault();
		const next = new Set(selectedIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedIds = next;
	}

	function selectAll(e: Event) {
		e.stopPropagation();
		if (selectedIds.size === filteredStories.length && filteredStories.length > 0) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(filteredStories.map((s) => s.id));
		}
	}

	async function deleteSelected() {
		for (const id of selectedIds) {
			await deleteStory(id);
		}
		stories = await getAllStories();
		selectedIds = new Set();
		bulkDeleteConfirm = false;
	}

	// ── Import ──
	async function handleImportFile(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		importError = null;
		importing = true;
		try {
			const newId = await importActFile(file);
			await goto(`/story/${newId}`);
		} catch (err) {
			if (err instanceof ActImportError) {
				importError = err.message;
			} else {
				importError = 'Import failed. Please check the file and try again.';
				console.error(err);
			}
		} finally {
			importing = false;
			input.value = '';
		}
	}

	function triggerImport() {
		fileInputEl?.click();
	}

	// ── Close color picker on outside click ──
	$effect(() => {
		function onClick(e: MouseEvent) {
			if (colorPickerStoryId) {
				const target = e.target as HTMLElement;
				if (!target.closest('.color-dot-btn') && !target.closest('.color-picker-popup')) {
					colorPickerStoryId = null;
				}
			}
		}
		document.addEventListener('click', onClick);
		return () => document.removeEventListener('click', onClick);
	});

	// ── Keyboard shortcuts ──
	$effect(() => {
		function handleKeydown(e: KeyboardEvent) {
			if (showTemplatePicker) return;
			const tag = (e.target as HTMLElement).tagName;
			if (tag === 'INPUT' || tag === 'TEXTAREA') return;

			if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
				e.preventDefault();
				handleNewStory();
			} else if (e.key === 'i' && !e.metaKey && !e.ctrlKey) {
				e.preventDefault();
				triggerImport();
			} else if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
				e.preventDefault();
				document.querySelector<HTMLInputElement>('[data-search]')?.focus();
			} else if (e.key === 'Escape') {
				if (colorPickerStoryId) { colorPickerStoryId = null; return; }
				if (confirmDeleteId) confirmDeleteId = null;
				if (bulkDeleteConfirm) bulkDeleteConfirm = false;
				if (selectedIds.size > 0) selectedIds = new Set();
			}
		}
		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});
</script>

<div class="mx-auto max-w-4xl px-6 py-8">
	<div class="rounded-sm border" style="background: var(--bg-base); border-color: var(--border-strong);">
		<!-- Section header -->
		<div
			class="flex items-center justify-between border-b px-5 py-3"
			style="border-color: var(--border-strong); background: var(--bg-front);"
		>
			<h1 class="text-base font-semibold" style="color: var(--text-strong);">My Stories</h1>
			<div class="flex items-center gap-2">
				<input
					type="file"
					accept=".act"
					onchange={handleImportFile}
					bind:this={fileInputEl}
					class="hidden"
					aria-hidden="true"
				/>
				<button onclick={triggerImport} disabled={importing} class="sidebar-action-btn rounded-sm px-3 py-1.5 text-sm"
					>Import</button
				>
			</div>
		</div>

		{#if importError}
			<div
				class="flex items-center justify-between border-b px-5 py-2 text-xs"
				style="background: oklch(from var(--warm) l c h / 0.12); color: var(--warm); border-color: oklch(from var(--warm) l c h / 0.22);"
				role="alert"
			>
				<span>{importError}</span>
				<button
					onclick={() => (importError = null)}
					class="ml-3 font-bold leading-none"
					style="color: var(--warm); font-size: 1.1rem;"
					>&times;</button
				>
			</div>
		{/if}

		<div class="px-5 py-4">
			{#if loading}
				<div class="flex items-center justify-center py-12" aria-live="polite">
					<div
						class="h-5 w-5 animate-spin rounded-full border-2"
						style="border-color: var(--border-base); border-top-color: var(--text-muted);"
					></div>
				</div>

			{:else if stories.length === 0}
				<!-- Expressive empty state -->
				<div class="flex flex-col items-center justify-center py-16">
					<div style="color: var(--text-dim);">
						<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<polyline points="2 20 6 9 10 16 14 5 18 14 22 20" />
						</svg>
					</div>
					<p class="mt-4 text-sm font-semibold" style="color: var(--text-muted);">Start your first story</p>
					<p class="mt-1 max-w-sm text-center text-xs" style="color: var(--text-dim); line-height: 1.5;">
						Build scenes, manage characters, and write in Fountain — with a live screenplay preview always visible.
						Pick a template or start from scratch.
					</p>
					<button onclick={handleNewStory} class="sidebar-action-btn mt-5 rounded-sm px-4 py-2 text-sm">
						Create Your First Story
					</button>
					<p class="mt-3 text-xs" style="color: var(--text-dim);">
						Press <kbd class="rounded-sm border px-1 py-0.5 font-sans" style="border-color: var(--border-base); color: var(--text-muted);">N</kbd> to create &middot; <kbd class="rounded-sm border px-1 py-0.5 font-sans" style="border-color: var(--border-base); color: var(--text-muted);">I</kbd> to import
					</p>
				</div>

			{:else}
				<!-- Search + color filter -->
				<div class="relative mb-3 flex items-center gap-2">
					<div class="relative flex-1">
						<svg
							width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
							class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
							style="color: var(--text-dim);" aria-hidden="true"
						>
							<circle cx="5.5" cy="5.5" r="4.5" />
							<line x1="8.9" y1="8.9" x2="12" y2="12" />
						</svg>
						<input
							type="text"
							bind:value={searchQuery}
							data-search
							class="field-input w-full rounded-sm py-1.5 pl-8 pr-3 text-xs outline-none"
							style="border: 1.5px solid var(--border-base); background: var(--bg-front); color: var(--text-base); margin-left: 0; margin-right: 0;"
							placeholder="Search stories by title or logline…"
							aria-label="Search stories"
						/>
					</div>

					<!-- Color filter dropdown -->
				<div class="relative flex-shrink-0">
					<select
						aria-label="Filter by color"
						value={colorFilter ?? ''}
						onchange={(e) => {
							const val = (e.target as HTMLSelectElement).value;
							colorFilter = val || null;
						}}
						class="filter-select rounded-sm py-1.5 pl-2 pr-7 text-xs outline-none appearance-none"
						style="border: 1.5px solid var(--border-base); background: var(--bg-front); color: var(--text-base); min-width: 7rem; cursor: pointer;"
					>
						<option value="">All colors</option>
						{#each STORY_COLORS as c (c.id)}
							<option value={c.id}>&bull; {c.label}</option>
						{/each}
					</select>
					<svg
						width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
						class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
						style="color: var(--text-dim);" aria-hidden="true"
					>
						<path d="M2 3.5l3 3 3-3" />
					</svg>
				</div>
				</div>

				<!-- Bulk action bar -->
				{#if hasSelection}
					<div
						class="-mx-5 mb-3 flex items-center justify-between border-b px-5 py-2"
						style="border-color: var(--border-base); background: var(--bg-base);"
					>
						<span class="text-xs font-medium" style="color: var(--text-base);">{selectedIds.size} selected</span>
						<div class="flex items-center gap-2">
							<button
								onclick={() => (selectedIds = new Set())}
								class="btn-ghost rounded-sm px-2 py-1 text-xs"
							>
								Cancel
							</button>
							{#if bulkDeleteConfirm}
								<span class="flex items-center gap-1.5 text-xs" style="color: var(--warm);">
									Delete {selectedIds.size} stories?
									<button
										onclick={deleteSelected}
										class="rounded-sm px-2 py-1 text-xs font-semibold"
										style="background: var(--warm); color: var(--control-text);"
									>
										Confirm
									</button>
									<button
										onclick={() => (bulkDeleteConfirm = false)}
										class="btn-ghost rounded-sm px-2 py-1 text-xs"
									>
										Cancel
									</button>
								</span>
							{:else}
								<button
									onclick={() => (bulkDeleteConfirm = true)}
									class="rounded-sm px-2 py-1 text-xs"
									style="color: var(--warm);"
								>
									Delete selected
								</button>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Story grid -->
				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{#each filteredStories as story (story.id)}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_interactive_supports_focus -->
						<div
							class="group story-card relative rounded-sm p-4 transition-all duration-200"
							style="border: 1.5px solid var(--border-base); background: var(--bg-front);"
							role="link"
							tabindex="0"
							onclick={() => goto(`/story/${story.id}`)}
							onkeydown={(e) => { if (e.key === 'Enter') goto(`/story/${story.id}`); }}
							aria-label="Open {story.title}"
						>
							<!-- Bulk select checkbox -->
							<button
								onclick={(e) => toggleSelect(story.id, e)}
								class="absolute right-3 top-3 z-10 flex h-4 w-4 items-center justify-center rounded-sm transition-all duration-150"
								style="border: 1.5px solid {selectedIds.has(story.id) ? 'var(--primary)' : 'var(--border-base)'}; background: {selectedIds.has(story.id) ? 'var(--primary)' : 'transparent'};"
								aria-label={selectedIds.has(story.id) ? 'Deselect story' : 'Select story'}
							>
								{#if selectedIds.has(story.id)}
									<svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="var(--control-text)" stroke-width="2" stroke-linecap="round" aria-hidden="true">
										<path d="M1 4l2 2 4-4" />
									</svg>
								{/if}
							</button>

							<div>
								<h2 class="mb-1 line-clamp-1 text-sm font-semibold" style="color: var(--text-strong);" title={story.title}>
									{story.title}
								</h2>
								{#if story.logline}
									<p class="mb-2 line-clamp-2 text-xs" style="color: var(--text-muted);" title={story.logline}>{story.logline}</p>
								{/if}
							</div>

							<!-- Stats + actions row -->
							<div class="mt-2 flex items-center justify-between" style="min-height: 22px;">
								<div class="flex items-center gap-2 text-xs" style="color: var(--text-dim);">
									<span>{story.acts?.length ?? 0} acts &middot; {story.acts?.reduce((sum, a) => sum + (a.scenes?.length ?? 0), 0) ?? 0} scenes</span>
									{#if screenplayIds.has(story.id)}
										<span
											class="rounded-sm px-1.5 py-0.5 text-[10px] font-medium leading-none"
											style="background: oklch(from var(--accent) l c h / 0.12); color: var(--accent);"
										>Screenplay</span>
									{/if}
								</div>

								<div class="flex items-center -my-2">
									<!-- Export .act button -->
									<button
										onclick={async (e) => { e.stopPropagation(); e.preventDefault(); const sp = await getScreenplayByStory(story.id); exportActFile(story, sp ?? null); }}
										class="export-card-btn"
										aria-label="Export story as .act file"
										title="Export .act"
									>
										<svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
											<path d="M5.5 1v6M3.5 4.5l2 2 2-2" />
											<path d="M1 7.5v1.5a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7.5" />
										</svg>
									</button>
									<!-- Color tag picker -->
									<div class="relative flex items-center">
										<button
											onclick={(e) => toggleColorPicker(story.id, e)}
											class="color-dot-btn"
											aria-label="Set color tag"
											title="Color tag"
										>
											{#if story.color}
												{@const hex = getColorHex(story.color)}
												<span class="block h-3 w-3 rounded-full" style="background: {hex};"></span>
											{:else}
												<svg width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
													<circle cx="5" cy="5" r="3.5" />
												</svg>
											{/if}
										</button>

										{#if colorPickerStoryId === story.id}
											<!-- svelte-ignore a11y_click_events_have_key_events -->
											<!-- svelte-ignore a11y_no_static_element_interactions -->
											<div
												class="color-picker-popup absolute bottom-full right-0 z-20 mb-1 flex gap-1 rounded-sm border p-1.5"
												style="background: var(--bg-front); border-color: var(--border-strong);"
												onclick={(e) => e.stopPropagation()}
											>
											<button
												onclick={(e) => { e.stopPropagation(); setStoryColor(story.id, undefined); }}
												class="flex h-5 w-5 items-center justify-center rounded-full"
												style="border: 1.5px solid var(--border-base);"
												aria-label="Remove color tag"
												title="None"
											>
												<svg width="8" height="8" viewBox="0 0 6 6" fill="none" stroke="var(--text-dim)" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
													<line x1="1" y1="1" x2="5" y2="5" />
													<line x1="5" y1="1" x2="1" y2="5" />
												</svg>
											</button>
											{#each STORY_COLORS as c (c.id)}
												<button
													onclick={(e) => { e.stopPropagation(); setStoryColor(story.id, c.id); }}
													class="h-5 w-5 rounded-full transition-transform duration-100"
													class:scale-125={story.color === c.id}
													style="background: {c.color}; border: 1.5px solid {story.color === c.id ? 'var(--text-strong)' : 'transparent'};"
													aria-label={c.label}
													title={c.label}
												></button>
											{/each}
											</div>
										{/if}
									</div>

									<!-- Two-step inline delete -->
								{#if confirmDeleteId === story.id}
									<span class="flex items-center gap-1 rounded-sm px-1.5 py-0.5" style="background: oklch(from var(--warm) l c h / 0.12);">
										<span class="text-[10px] font-medium" style="color: var(--warm);">Delete?</span>
										<button
											onclick={(e) => confirmDelete(story.id, e)}
											class="rounded-sm px-1 py-0.5 text-[10px] font-semibold"
											style="background: var(--warm); color: var(--control-text);"
										>Yes</button>
										<button
											onclick={cancelDelete}
											class="rounded-sm px-1 py-0.5 text-[10px]"
											style="color: var(--text-muted);"
										>No</button>
									</span>
								{:else}
									<button
										onclick={(e) => requestDelete(story.id, e)}
										class="delete-btn rounded p-0.5 transition-all duration-200"
										style="color: var(--text-dim);"
										aria-label="Delete story"
									>
										<svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
											<line x1="1" y1="1" x2="10" y2="10" />
											<line x1="10" y1="1" x2="1" y2="10" />
										</svg>
									</button>
								{/if}
								</div>
							</div>

							<!-- Hover overlay for subtle elevation -->
							<div
								class="pointer-events-none absolute inset-0 rounded-sm transition-all duration-200"
								style="box-shadow: 0 0 0 0 transparent;"
							></div>
						</div>
					{/each}

					<!-- New story card (end of grid) — dashed border -->
					<button
						onclick={handleNewStory}
						class="sidebar-action-btn rounded-sm py-8 text-xs"
						style="border: 1.5px dashed var(--border-base); background: transparent;"
					>
						New Story
					</button>
				</div>

				<!-- Empty search state -->
				{#if filteredStories.length === 0 && searchQuery}
					<div class="flex flex-col items-center justify-center py-12">
						<p class="text-sm" style="color: var(--text-muted);">No stories match "{searchQuery}"</p>
						<button onclick={() => (searchQuery = '')} class="btn-ghost mt-2 rounded-sm px-3 py-1 text-xs">
							Clear search
						</button>
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>

<TemplatePicker open={showTemplatePicker} onClose={() => (showTemplatePicker = false)} />

<style>
	/* Card hover elevation */
	.story-card {
		cursor: pointer;
	}
	.story-card:hover {
		box-shadow: 0 1px 6px oklch(0 0 0 / 0.08);
		border-color: var(--border-strong);
	}
	.story-card:focus-visible {
		outline: 2px solid var(--focus-ring);
		outline-offset: 2px;
	}

	/* Delete button: always subtly visible, full on hover/focus */
	.delete-btn {
		opacity: 0.35;
		transition: opacity 0.15s ease-out;
	}
	.delete-btn:hover,
	.delete-btn:focus-visible {
		opacity: 1;
	}
	.group:hover .delete-btn,
	.group:focus-within .delete-btn {
		opacity: 1;
	}

	/* Touch-friendly: always visible */
	@media (pointer: coarse) {
		.delete-btn {
			opacity: 0.5;
		}
	}

	/* ── Color filter select ── */
	.filter-select {
		-webkit-appearance: none;
		-moz-appearance: none;
	}
	.filter-select option {
		padding: 0.25rem 0.5rem;
	}
	.filter-select:focus-visible {
		outline: 2px solid var(--focus-ring);
		outline-offset: 2px;
	}

	/* ── Export card button ── */
	.export-card-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 10px;
		border: none;
		background: none;
		cursor: pointer;
		color: var(--text-dim);
		border-radius: var(--radius-sm);
		transition: color 0.12s ease-out, background 0.12s ease-out;
		opacity: 0.35;
	}
	.export-card-btn:hover {
		color: var(--text-muted);
		background: var(--scene-btn-hover, oklch(0 0 0 / 0.06));
		opacity: 1;
	}
	.export-card-btn:focus-visible {
		outline: 2px solid var(--focus-ring);
		outline-offset: 2px;
		opacity: 1;
	}
	.group:hover .export-card-btn,
	.group:focus-within .export-card-btn {
		opacity: 1;
	}
	@media (pointer: coarse) {
		.export-card-btn {
			opacity: 0.5;
		}
	}

	/* ── Color dot button ── */
	.color-dot-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 10px;
		border: none;
		background: none;
		cursor: pointer;
		color: var(--text-dim);
		border-radius: var(--radius-sm);
		transition: color 0.12s ease-out, background 0.12s ease-out;
	}
	.color-dot-btn:hover {
		color: var(--text-muted);
		background: var(--scene-btn-hover, oklch(0 0 0 / 0.06));
	}
	.color-dot-btn:focus-visible {
		outline: 2px solid var(--focus-ring);
		outline-offset: 2px;
	}

	/* ── Color picker popup ── */
	.color-picker-popup {
		background: var(--bg-front);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
	}

	/* Popup swatch focus indicator */
	.color-picker-popup button:focus-visible {
		outline: 2px solid var(--focus-ring);
		outline-offset: 3px;
	}
</style>
