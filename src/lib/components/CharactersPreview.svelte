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
		<span class="font-mono-ui text-xs" style="text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted);">Characters</span>
	</div>
	<div class="flex-1 overflow-y-auto min-h-0 h-0 p-4">
		{#if story.characters.length === 0}
			<p class="text-xs" style="color: var(--text-dim);">No characters yet</p>
		{:else}
			<div class="space-y-3">
				{#each story.characters as char (char.id)}
					<div class="border-l-2 pl-3" style="border-color: var(--border-base);">
						<div class="flex items-center gap-2">
							<span class="text-xs font-semibold" style="color: var(--text-strong);">{char.name || 'Unnamed'}</span>
							{#if char.role}
								<span
									class="inline-block rounded-full px-2 py-0.5 text-[0.6rem] font-semibold"
									style="background: {char.role === 'protagonist' ? 'oklch(0.42 0.18 260 / 0.12)' : char.role === 'antagonist' ? 'oklch(0.62 0.14 30 / 0.12)' : char.role === 'supporting' ? 'oklch(0.50 0.16 250 / 0.10)' : 'var(--ghost-hover)'}; color: {char.role === 'protagonist' ? 'var(--primary)' : char.role === 'antagonist' ? 'var(--warm)' : char.role === 'supporting' ? 'var(--accent)' : 'var(--text-dim)'};"
								>{char.role}</span>
							{/if}
						</div>
						{#if char.description}
							<p class="mt-1 text-xs leading-relaxed" style="color: var(--text-muted);">{char.description}</p>
						{/if}
						{#if char.arc}
							<p class="mt-0.5 text-xs italic" style="color: var(--text-dim);">Arc: {char.arc}</p>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
