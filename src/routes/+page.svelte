<script lang="ts">
	import { getAllStories, saveStory, deleteStory, getAllScreenplays } from '$lib/persistence/db';
	import { createStory, type Story, type Screenplay } from '$lib/domain/story';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let stories = $state<Story[]>([]);
	let loading = $state(true);
	let screenplayIds = $state<Set<string>>(new Set());

	onMount(async () => {
		stories = await getAllStories();
		const sps = await getAllScreenplays();
		screenplayIds = new Set(sps.map((sp) => sp.storyId));
		loading = false;
	});

	async function handleNewStory() {
		const story = createStory();
		await saveStory(story);
		await goto(`/story/${story.id}`);
	}

	async function handleDelete(id: string, e: MouseEvent) {
		e.stopPropagation();
		e.preventDefault();
		await deleteStory(id);
		stories = await getAllStories();
	}
</script>

<div class="mx-auto max-w-4xl px-6 py-8">
	<!-- Section with bg-base — EP style -->
	<div class="rounded-sm border" style="background: var(--bg-base); border-color: var(--border-strong);">
		<!-- Section header — with stronger border-b -->
		<div class="flex items-center justify-between border-b px-5 py-3" style="border-color: var(--border-strong); background: var(--bg-front);">
			<h1 style="color: var(--text-strong);">My Stories</h1>
			<button
				onclick={handleNewStory}
				class="sidebar-action-btn rounded-sm px-3 py-1.5 text-sm"
			>
				New Story
			</button>
		</div>

		<!-- Content area -->
		<div class="px-5 py-4">
			{#if loading}
				<div class="flex items-center justify-center py-12" aria-live="polite">
					<div
						class="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
						style="border-color: var(--border-base); border-top-color: var(--text-muted);"
					></div>
				</div>

			{:else if stories.length === 0}
				<!-- Empty state — EP style -->
				<div class="flex flex-col items-center justify-center py-16">
					<div style="color: var(--text-dim);">
						<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
							<rect x="6" y="4" width="28" height="33" rx="2" />
							<line x1="12" y1="12" x2="28" y2="12" />
							<line x1="12" y1="18" x2="28" y2="18" />
							<line x1="12" y1="24" x2="22" y2="24" />
						</svg>
					</div>
					<p class="mt-3 text-sm font-semibold" style="color: var(--text-muted);">No stories yet</p>
					<button
						onclick={handleNewStory}
						class="sidebar-action-btn mt-4 rounded-sm px-4 py-2 text-sm"
					>
						Create Your First Story
					</button>
				</div>

			{:else}
				<!-- Story grid — EP-style cards -->
				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{#each stories as story (story.id)}
						<a
							href={`/story/${story.id}`}
							class="group block rounded-sm p-4 no-underline transition-all duration-200"
							style="border: 1.5px solid var(--border-base); background: var(--bg-front);"
						>
							<h2 class="mb-1 truncate text-sm font-semibold" style="color: var(--text-strong);">
								{story.title}
							</h2>
							{#if story.logline}
								<p class="mb-2 truncate text-xs" style="color: var(--text-muted);">{story.logline}</p>
							{/if}
							<div class="flex items-center justify-between">
								<span class="flex items-center gap-2 text-xs" style="color: var(--text-dim);">
									<span>{story.acts?.length ?? 0} acts &middot; {story.acts?.reduce((sum, a) => sum + (a.scenes?.length ?? 0), 0) ?? 0} scenes</span>
									{#if screenplayIds.has(story.id)}
										<span style="color: var(--text-muted); font-weight: 600;">Screenplay</span>
									{/if}
								</span>
								<button
									onclick={(e) => handleDelete(story.id, e)}
									class="btn-ghost rounded p-1 text-xs opacity-0 transition-all duration-200 group-hover:opacity-100"
									aria-label="Delete story"
								>
									<svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
										<line x1="1" y1="1" x2="10" y2="10" />
										<line x1="10" y1="1" x2="1" y2="10" />
									</svg>
								</button>
							</div>
						</a>
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
			{/if}
		</div>
	</div>
</div>
