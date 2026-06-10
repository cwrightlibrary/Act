<script lang="ts">
	import type { Story } from '$lib/domain/story';

	let {
		story,
		containerClass = 'flex-1',
	}: {
		story: Story;
		containerClass?: string;
	} = $props();
</script>

<div
	class="flex flex-col overflow-hidden rounded-sm min-h-0 {containerClass}"
	style="background: var(--bg-front); border: 1.5px solid var(--border-base);"
>
	<div class="border-b px-3 py-1.5" style="border-color: var(--border-base); background: var(--bg-base);">
		<span class="font-mono-ui text-xs" style="text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted);">Outline</span>
	</div>
	<div class="flex-1 overflow-y-auto min-h-0 h-0 p-4">
		<div class="space-y-4 text-sm">
			{#each story.acts as act}
				<div>
					<p class="mb-2 font-bold" style="color: var(--text-strong); text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.7rem;">
						{act.title}
					</p>
					{#if act.scenes.length === 0}
						<p class="text-xs" style="color: var(--text-dim);">No scenes yet</p>
					{:else}
						<div class="space-y-2">
							{#each act.scenes as sc (sc.id)}
								<div class="border-l-2 pl-3" style="border-color: var(--border-base);">
									<p class="text-xs font-semibold" style="color: var(--text-strong);">
										Scene {sc.order + 1}{sc.title ? ` — ${sc.title}` : ''}
									</p>
									{#if sc.summary}
										<p class="mt-0.5 text-xs leading-relaxed" style="color: var(--text-muted);">
											{sc.summary}
										</p>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
