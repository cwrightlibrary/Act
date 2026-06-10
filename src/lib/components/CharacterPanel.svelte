<script lang="ts">
	import type { Story, Character, Scene } from '$lib/domain/story';

	let {
		story,
		selectedSceneId,
		onchange = () => {},
	}: {
		story: Story;
		selectedSceneId: string | null;
		onchange: () => void;
	} = $props();

	let editingCharId = $state<string | null>(null);
	let deletingCharId = $state<string | null>(null);

	let selectedScene = $derived<Scene | null>(
		selectedSceneId
			? story.acts.flatMap((a) => a.scenes).find((s) => s.id === selectedSceneId) ?? null
			: null,
	);

	function addCharacter() {
		const char: Character = {
			id: crypto.randomUUID(),
			name: '',
			role: 'supporting',
			description: '',
			arc: '',
		};
		story.characters = [...story.characters, char];
		editingCharId = char.id;
		onchange();
	}

	function startEditing(id: string) {
		editingCharId = editingCharId === id ? null : id;
	}

	function confirmDelete(id: string) {
		deletingCharId = id;
	}

	function cancelDelete() {
		deletingCharId = null;
	}

	function executeDelete(id: string) {
		story.characters = story.characters.filter((c) => c.id !== id);
		// Remove from all scenes
		for (const act of story.acts) {
			for (const scene of act.scenes) {
				if (scene.characters.includes(id)) {
					scene.characters = scene.characters.filter((cId) => cId !== id);
				}
			}
		}
		if (editingCharId === id) editingCharId = null;
		deletingCharId = null;
		onchange();
	}

	function toggleCharacterForScene(charId: string) {
		if (!selectedScene) return;
		const idx = selectedScene.characters.indexOf(charId);
		if (idx >= 0) {
			selectedScene.characters = selectedScene.characters.filter((id) => id !== charId);
		} else {
			selectedScene.characters = [...selectedScene.characters, charId];
		}
		onchange();
	}

	function isInScene(charId: string): boolean {
		return selectedScene ? selectedScene.characters.includes(charId) : false;
	}

	function roleBadgeColor(role: string): string {
		switch (role) {
			case 'protagonist':
				return 'var(--primary)';
			case 'antagonist':
				return 'var(--warm)';
			case 'supporting':
				return '#2563eb';
			default:
				return 'var(--text-dim)';
		}
	}

	function roleBadgeBg(role: string): string {
		switch (role) {
			case 'protagonist':
				return 'oklch(0.42 0.18 260 / 0.12)';
			case 'antagonist':
				return 'oklch(0.62 0.14 30 / 0.12)';
			case 'supporting':
				return 'oklch(0.50 0.16 250 / 0.10)';
			default:
				return 'var(--ghost-hover)';
		}
	}

	function sceneCharDots(charIds: string[]): Character[] {
		if (!story) return [];
		return charIds
			.map((id) => story.characters.find((c) => c.id === id))
			.filter((c): c is Character => !!c);
	}

	let roleOptions = [
		{ value: 'protagonist', label: 'Protagonist' },
		{ value: 'antagonist', label: 'Antagonist' },
		{ value: 'supporting', label: 'Supporting' },
		{ value: 'minor', label: 'Minor' },
	];

	// Update handlers for inline editing
	function updateCharName(char: Character, value: string) {
		char.name = value;
		onchange();
	}

	function updateCharRole(char: Character, value: string) {
		char.role = value;
		onchange();
	}

	function updateCharDescription(char: Character, value: string) {
		char.description = value;
		onchange();
	}

	function updateCharArc(char: Character, value: string) {
		char.arc = value;
		onchange();
	}
</script>

<div class="char-panel">
	<!-- Header -->
	<div class="char-panel-header">
		<h2 class="char-panel-title">Characters</h2>
		<button onclick={addCharacter} class="sidebar-action-btn rounded-sm px-3 py-1.5 text-xs">
			+ Add Character
		</button>
	</div>

	<!-- Scene assignment context -->
	{#if selectedScene}
		<div class="char-scene-context">
			<span class="text-xs" style="color: var(--text-muted);">
				Assigning characters for scene: <strong style="color: var(--text-strong);">{selectedScene.title || `Scene ${(story.acts.flatMap(a => a.scenes).indexOf(selectedScene) + 1)}`}</strong>
			</span>
		</div>
	{/if}

	<!-- Character list -->
	<div class="char-list">
		{#if story.characters.length === 0}
			<div class="char-empty">
				<p class="text-xs" style="color: var(--text-dim);">No characters yet</p>
				<p class="text-xs" style="color: var(--text-dim); margin-top: 0.25rem;">
					Add your first character to start building your cast.
				</p>
			</div>
		{:else}
			{#each story.characters as char (char.id)}
				<div class="char-card" class:char-card-editing={editingCharId === char.id}>
					<!-- Assignment checkbox (visible when a scene is selected) -->
					{#if selectedScene}
						<label class="char-assign-check" aria-label="Toggle {char.name || 'new character'} in scene">
							<input
								type="checkbox"
								checked={isInScene(char.id)}
								onchange={() => toggleCharacterForScene(char.id)}
								class="char-checkbox"
							/>
						</label>
					{/if}

					<!-- Collapsed state -->
					{#if editingCharId !== char.id}
						<button
							onclick={() => startEditing(char.id)}
							class="char-card-collapsed"
						>
							<div class="char-card-left">
								<span
									class="char-name"
									class:char-name-empty={!char.name}
									style="color: var(--text-strong);"
								>
									{char.name || 'Unnamed Character'}
								</span>
								{#if char.role}
									<span
										class="char-role-badge"
										style="background: {roleBadgeBg(char.role)}; color: {roleBadgeColor(char.role)};"
									>
										{char.role}
									</span>
								{/if}
							</div>
							{#if char.description}
								<p class="char-desc-snippet">{char.description}</p>
							{/if}
						</button>

						<div class="char-card-actions">
							{#if deletingCharId === char.id}
								<div class="char-delete-confirm">
									<span class="text-xs" style="color: var(--warm);">Delete?</span>
									<button
										onclick={(e) => { e.stopPropagation(); executeDelete(char.id); }}
										class="scene-delete-btn"
										style="color: var(--warm);"
										aria-label="Confirm delete"
									>&#10003;</button>
									<button
										onclick={(e) => { e.stopPropagation(); cancelDelete(); }}
										class="scene-delete-btn"
										aria-label="Cancel delete"
									>&times;</button>
								</div>
							{:else}
								<button
									onclick={(e) => { e.stopPropagation(); confirmDelete(char.id); }}
									class="scene-delete-btn"
									aria-label="Delete character"
								>&times;</button>
							{/if}
						</div>

					{:else}
						<!-- Expanded / editing state -->
						<div class="char-edit-form">
							<div class="char-edit-field">
								<label class="char-edit-label" for="char-name-{char.id}">Name</label>
								<input
									id="char-name-{char.id}"
									type="text"
									value={char.name}
									oninput={(e) => updateCharName(char, (e.target as HTMLInputElement).value)}
									class="field-input w-full text-sm"
									placeholder="Character name"
									autofocus
								/>
							</div>

							<div class="char-edit-field">
								<label class="char-edit-label" for="char-role-{char.id}">Role</label>
								<div class="char-role-row">
									<select
										id="char-role-{char.id}"
										value={char.role}
										onchange={(e) => updateCharRole(char, (e.target as HTMLSelectElement).value)}
										class="char-role-select"
									>
										{#each roleOptions as opt}
											<option value={opt.value}>{opt.label}</option>
										{/each}
									</select>
									<span
										class="char-role-dot"
										style="background: {roleBadgeColor(char.role)};"
									></span>
								</div>
							</div>

							<div class="char-edit-field">
								<label class="char-edit-label" for="char-desc-{char.id}">Description</label>
								<textarea
									id="char-desc-{char.id}"
									value={char.description}
									oninput={(e) => updateCharDescription(char, (e.target as HTMLTextAreaElement).value)}
									class="field-input w-full resize-none text-xs"
									rows="2"
									placeholder="Brief description of this character..."
								></textarea>
							</div>

							<div class="char-edit-field">
								<label class="char-edit-label" for="char-arc-{char.id}">Arc</label>
								<textarea
									id="char-arc-{char.id}"
									value={char.arc}
									oninput={(e) => updateCharArc(char, (e.target as HTMLTextAreaElement).value)}
									class="field-input w-full resize-none text-xs"
									rows="2"
									placeholder="Character journey or transformation..."
								></textarea>
							</div>

							<div class="char-edit-actions">
								<button
									onclick={() => { editingCharId = null; }}
									class="sidebar-action-btn rounded-sm px-3 py-1 text-xs"
								>
									Done
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.char-panel {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-height: 0;
		height: 100%;
		width: 100%;
	}

	.char-panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1.5px solid var(--border-base);
		padding: 0.75rem 1rem;
		background: var(--bg-base);
		flex-shrink: 0;
	}

	.char-panel-title {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--text-strong);
		margin: 0;
	}

	.char-scene-context {
		flex-shrink: 0;
		padding: 0.5rem 1rem;
		border-bottom: 1px solid var(--border-base);
		background: var(--bg-base);
	}

	.char-list {
		flex: 1;
		overflow-y: auto;
		min-height: 0;
		padding: 0.75rem;
	}

	.char-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		text-align: center;
	}

	.char-card {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		border: 1.5px solid var(--border-base);
		border-radius: var(--radius-md);
		background: var(--bg-front);
		transition: border-color 0.15s var(--ease-out);
	}

	.char-card:hover {
		border-color: var(--border-strong);
	}

	.char-card-editing {
		border-color: var(--border-strong);
	}

	.char-assign-check {
		display: flex;
		align-items: center;
		padding: 0.75rem 0 0.75rem 0.75rem;
		flex-shrink: 0;
	}

	.char-checkbox {
		width: 14px;
		height: 14px;
		cursor: pointer;
		accent-color: var(--primary);
	}

	.char-card-collapsed {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.75rem;
		cursor: pointer;
		text-align: left;
		border: none;
		background: transparent;
		color: inherit;
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		min-width: 0;
		border-radius: var(--radius-sm);
	}

	.char-card-collapsed:hover {
		background: var(--scene-btn-hover);
	}

	.char-card-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.char-name {
		font-size: var(--text-sm);
		font-weight: 600;
	}

	.char-name-empty {
		font-style: italic;
		opacity: 0.5;
	}

	.char-role-badge {
		display: inline-flex;
		align-items: center;
		padding: 1px 6px;
		border-radius: var(--radius-full);
		font-size: 0.6rem;
		font-weight: 600;
		text-transform: capitalize;
		letter-spacing: 0.02em;
		line-height: 1.4;
		flex-shrink: 0;
	}

	.char-desc-snippet {
		font-size: var(--text-xs);
		color: var(--text-muted);
		line-height: 1.4;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.char-card-actions {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		padding: 0.5rem 0.5rem 0 0;
	}

	.char-delete-confirm {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	/* ── Edit form ── */

	.char-edit-form {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
	}

	.char-edit-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.char-edit-label {
		font-size: 0.65rem;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.char-role-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.char-role-select {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		padding: 0.25rem 0.5rem;
		border: 1.5px solid var(--border-base);
		border-radius: var(--radius-sm);
		background: var(--bg-front);
		color: var(--text-base);
		cursor: pointer;
	}

	.char-role-select:focus {
		border-color: var(--border-strong);
		outline: 2px solid var(--focus-ring);
		outline-offset: 1px;
	}

	.char-role-dot {
		width: 8px;
		height: 8px;
		border-radius: var(--radius-full);
		flex-shrink: 0;
	}

	.char-edit-actions {
		display: flex;
		justify-content: flex-end;
		padding-top: 0.25rem;
	}
</style>
