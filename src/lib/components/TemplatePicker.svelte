<script lang="ts">
	import templates, { createStoryFromTemplate } from '$lib/domain/templates';
	import { saveStory } from '$lib/persistence/db';
	import { goto } from '$app/navigation';

	let { open = false, onClose }: { open: boolean; onClose: () => void } = $props();

	let creating = $state<string | null>(null);
	let error = $state<string | null>(null);

	async function handleSelect(templateId: string) {
		creating = templateId;
		error = null;
		try {
			const story = createStoryFromTemplate(templateId);
			await saveStory(story);
			await goto(`/story/${story.id}`);
		} catch (e) {
			error = 'Failed to create story. Please try again.';
			console.error(e);
			creating = null;
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-40 flex items-center justify-center p-4"
		style="background: oklch(0 0 0 / 0.3);"
		onclick={handleBackdropClick}
		role="presentation"
	>
		<div
			class="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-sm border shadow-xl"
			style="background: var(--bg-front); border-color: var(--border-strong);"
			role="dialog"
			aria-label="Choose a story template"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b px-5 py-3" style="border-color: var(--border-base);">
				<h2 class="text-sm font-semibold" style="color: var(--text-strong);">New Story</h2>
				<button onclick={onClose} class="btn-ghost rounded-sm px-2 py-1 text-xs" aria-label="Cancel">Cancel</button>
			</div>

			<!-- Body -->
			<div class="px-5 py-4">
				<p class="mb-4 text-xs leading-relaxed" style="color: var(--text-muted);">
					Choose a story structure to start with. You can rename, reorder, and edit everything later.
				</p>

				{#if error}
					<div class="mb-3 rounded-sm border px-3 py-2 text-xs" style="background: oklch(from var(--warm) l c h / 0.12); color: var(--warm); border-color: oklch(from var(--warm) l c h / 0.22);" role="alert">
						{error}
					</div>
				{/if}

				<div class="grid gap-3 sm:grid-cols-2">
					{#each templates as template (template.id)}
						<button
							onclick={() => handleSelect(template.id)}
							disabled={creating !== null}
							class="group relative flex flex-col items-start rounded-sm border p-4 text-left transition-all duration-200"
							style="border-color: var(--border-base); background: var(--bg-front);"
							aria-label="{template.name}: {template.description}"
						>
							<!-- Mini structure diagram -->
							<div class="mb-3 flex items-end gap-[3px] h-8">
								{#each template.acts as act}
									{@const maxScenes = Math.max(...template.acts.map((a) => a.scenes.length))}
									{@const barHeight = maxScenes > 0 ? (act.scenes.length / maxScenes) * 28 : 6}
									<div
										class="w-[10px] rounded-t-sm transition-all"
										style="background: var(--primary); height: {Math.max(6, barHeight)}px; opacity: {0.25 + (act.scenes.length / Math.max(maxScenes, 1)) * 0.65};"
										title="{act.title}: {act.scenes.length} scenes"
									></div>
								{/each}
							</div>

							<div class="text-sm font-semibold" style="color: var(--text-strong);">{template.name}</div>
							<div class="mt-1 text-xs leading-relaxed" style="color: var(--text-muted);">{template.description}</div>
							<div class="mt-2 text-xs" style="color: var(--text-dim);">
								{template.acts.length} act{template.acts.length !== 1 ? 's' : ''} &middot; {template.acts.reduce((s, a) => s + a.scenes.length, 0)} scenes
							</div>

							{#if template.characters && template.characters.length > 0}
								<div class="mt-1.5 flex items-center gap-1 text-xs" style="color: var(--text-dim);">
									<span>{template.characters.length} character{template.characters.length !== 1 ? 's' : ''}:</span>
									<span class="flex gap-1">
										{#each template.characters! as ch, i}
											<span
												class="inline-block h-2 w-2 rounded-full"
												style="background: {i === 0 ? 'var(--primary)' : 'var(--text-dim)'};"
												title={ch.name}
											></span>
										{/each}
									</span>
								</div>
							{/if}

							{#if creating === template.id}
								<div class="absolute inset-0 flex items-center justify-center rounded-sm" style="background: oklch(0 0 0 / 0.04);">
									<div
										class="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
										style="border-color: var(--border-base); border-top-color: var(--text-muted);"
									></div>
								</div>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}
