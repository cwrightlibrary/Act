<script lang="ts">
	import { page } from '$app/stores';
	import { getStory, saveStory, getScreenplayByStory, saveScreenplay } from '$lib/persistence/db';
	import { createScene, createAct, createScreenplay } from '$lib/domain/story';
	import type { Story, Scene, Screenplay } from '$lib/domain/story';
	import SceneEditor from '$lib/components/SceneEditor.svelte';
	import CharacterPanel from '$lib/components/CharacterPanel.svelte';
	import type { Component } from 'svelte';

	let story = $state<Story | null>(null);
	let loading = $state(true);
	let selectedSceneId = $state<string | null>(null);
	let sidebarOpen = $state(true);
	type PreviewMode = 'closed' | 'outline' | 'characters';
	let previewMode = $state<PreviewMode>('closed');

	function cyclePreview() {
		const modes: PreviewMode[] = ['closed', 'outline', 'characters'];
		const idx = modes.indexOf(previewMode);
		previewMode = modes[(idx + 1) % modes.length];
	}

	function previewLabel(): string {
		switch (previewMode) {
			case 'outline': return 'Outline';
			case 'characters': return 'Characters';
			default: return 'Preview';
		}
	}
	let exportOpen = $state(false);
	let focusTrigger = $state(0);
	let saveTimer: ReturnType<typeof setTimeout> | null = null;

	let screenplayMode = $state(false);
	let characterMode = $state(false);
	let screenplay = $state<Screenplay | null>(null);
	let spSaveTimer: ReturnType<typeof setTimeout> | null = null;
	let exportError = $state<string | null>(null);

	// Lazy-loaded components (preloaded in background, not on critical path)
	let FountainEditor = $state<Component | null>(null);
	let FountainPreview = $state<Component | null>(null);

	// Preload non-critical components after page mount
	$effect(() => {
		// Fountain components
		import('$lib/components/FountainEditor.svelte').then((m) => (FountainEditor = m.default));
		import('$lib/components/FountainPreview.svelte').then((m) => (FountainPreview = m.default));
	});

	async function loadScreenplay() {
		if (!story) return;
		let sp = await getScreenplayByStory(story.id);
		if (!sp) {
			sp = createScreenplay(story.id, `${story.title} — Screenplay`);
			await saveScreenplay(sp);
		}
		screenplay = sp;
	}

	function handleScreenplayUpdate(text: string) {
		if (!screenplay) return;
		screenplay.content = text;
		if (spSaveTimer) clearTimeout(spSaveTimer);
		spSaveTimer = setTimeout(async () => {
			if (screenplay) await saveScreenplay(screenplay);
		}, 400);
	}

	$effect(() => {
		const id = $page.params.id;
		if (!id) return;
		getStory(id).then((s) => {
			if (s) {
				story = s;
				const firstScene = s.acts[0]?.scenes?.[0];
				if (firstScene) selectedSceneId = firstScene.id;
			}
			loading = false;
		});
	});

	function selectedScene(): Scene | null {
		if (!story) return null;
		for (const act of story.acts) {
			for (const scene of act.scenes) {
				if (scene.id === selectedSceneId) return scene;
			}
		}
		return null;
	}

	async function persist() {
		if (!story) return;
		story.updatedAt = Date.now();
		await saveStory(story);
	}

	function debouncedPersist() {
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(persist, 400);
	}

	// Load screenplay when toggling into screenplay mode
	$effect(() => {
		if (screenplayMode && story && !screenplay) {
			loadScreenplay();
		}
	});

	async function handleContentUpdate(html: string) {
		if (!story || !selectedSceneId) return;
		const scene = selectedScene();
		if (!scene) return;
		scene.content = html;
		debouncedPersist();
	}

	async function addScene(actId: string) {
		if (!story) return;
		const act = story.acts.find((a) => a.id === actId);
		if (!act) return;
		const scene = createScene(act.order, act.scenes.length);
		act.scenes = [...act.scenes, scene];
		selectedSceneId = scene.id;
		focusTrigger++;
		await persist();
	}

	async function addAct() {
		if (!story) return;
		const act = createAct(story.acts.length);
		story.acts = [...story.acts, act];
		await persist();
	}

	async function deleteScene(actId: string, sceneId: string) {
		if (!story) return;
		const act = story.acts.find((a) => a.id === actId);
		if (!act) return;
		act.scenes = act.scenes.filter((s) => s.id !== sceneId).map((s, i) => ({ ...s, order: i }));
		if (selectedSceneId === sceneId) {
			selectedSceneId = act.scenes[0]?.id ?? null;
		}
		await persist();
	}

	async function deleteAct(actId: string) {
		if (!story) return;
		story.acts = story.acts.filter((a) => a.id !== actId).map((a, i) => ({ ...a, order: i }));
		if (selectedSceneId) {
			const stillPresent = story.acts.some((a) => a.scenes.some((s) => s.id === selectedSceneId));
			if (!stillPresent) {
				selectedSceneId = story.acts[0]?.scenes?.[0]?.id ?? null;
			}
		}
		await persist();
	}

	function totalWordCount(): number {
		if (!story) return 0;
		return story.acts.reduce((sum, act) => {
			return sum + act.scenes.reduce((s, sc) => s + stripHtml(sc.content).split(/\s+/).filter(Boolean).length, 0);
		}, 0);
	}

	function stripHtml(html: string): string {
		return html.replace(/<[^>]*>/g, '');
	}

	function scenePreview(scene: Scene): string {
		if (scene.summary) return scene.summary;
		const text = stripHtml(scene.content).trim();
		return text ? text.slice(0, 80) + (text.length > 80 ? '…' : '') : '';
	}

	function charRoleColor(charId: string): string {
		if (!story) return 'var(--text-dim)';
		const char = story.characters.find(c => c.id === charId);
		if (!char) return 'var(--text-dim)';
		switch (char.role) {
			case 'protagonist': return 'var(--primary)';
			case 'antagonist': return 'var(--warm)';
			case 'supporting': return '#2563eb';
			default: return 'var(--text-dim)';
		}
	}

	function sceneCharacters(scene: Scene) {
		if (!story) return [];
		return scene.characters.map(id => story!.characters.find(c => c.id === id)).filter(Boolean);
	}

	// ── Drag and drop reordering ──
	let dragInfo: { sceneId: string; sourceActId: string; sourceIndex: number } | null = null;
	let dropTargetActId: string | null = null;
	let dropIndex: number | null = null;

	function handleDragStart(e: DragEvent, scene: Scene, actId: string) {
		dragInfo = { sceneId: scene.id, sourceActId: actId, sourceIndex: scene.order };
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', scene.id);
		}
		dropTargetActId = null;
		dropIndex = null;
	}

	function handleDragEnd() {
		dragInfo = null;
		dropTargetActId = null;
		dropIndex = null;
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
	}

	function handleSceneDragEnter(e: DragEvent, actId: string, index: number) {
		e.preventDefault();
		dropTargetActId = actId;
		dropIndex = index;
	}

	function handleSceneDragLeave(e: DragEvent) {
		// Only clear if actually leaving the scene (not entering a child)
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const x = e.clientX;
		const y = e.clientY;
		if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
			if (dropTargetActId === (e.currentTarget as HTMLElement).dataset.actId) {
				dropTargetActId = null;
				dropIndex = null;
			}
		}
	}

	function handleActDragEnter(e: DragEvent, actId: string) {
		e.preventDefault();
		dropTargetActId = actId;
		dropIndex = null;
	}

	function handleActDragLeave(e: DragEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const x = e.clientX;
		const y = e.clientY;
		if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
			dropTargetActId = null;
			dropIndex = null;
		}
	}

	function handleDrop(e: DragEvent, targetActId: string, targetIndex: number | null) {
		e.preventDefault();
		if (!dragInfo || !story) return;

		const { sceneId, sourceActId } = dragInfo;
		const sourceAct = story.acts.find(a => a.id === sourceActId);
		const targetAct = story.acts.find(a => a.id === targetActId);
		if (!sourceAct || !targetAct) {
			dragInfo = null;
			dropTargetActId = null;
			dropIndex = null;
			return;
		}

		// Find the dragged scene
		const scene = sourceAct.scenes.find(s => s.id === sceneId);
		if (!scene) {
			dragInfo = null;
			dropTargetActId = null;
			dropIndex = null;
			return;
		}

		// Remove from source
		sourceAct.scenes = sourceAct.scenes.filter(s => s.id !== sceneId);

		// Insert into target at position
		const insertAt = targetIndex !== null && targetIndex !== undefined
			? Math.min(targetIndex, targetAct.scenes.length)
			: targetAct.scenes.length;

		targetAct.scenes = [
			...targetAct.scenes.slice(0, insertAt),
			scene,
			...targetAct.scenes.slice(insertAt),
		];

		// Re-index both acts
		sourceAct.scenes = sourceAct.scenes.map((s, i) => ({ ...s, order: i }));
		targetAct.scenes = targetAct.scenes.map((s, i) => ({ ...s, order: i }));

		// Update selected scene if needed
		selectedSceneId = sceneId;

		dragInfo = null;
		dropTargetActId = null;
		dropIndex = null;
		persist();
	}

	// ── Keyboard/mouse alternative to drag-and-drop ──

	function moveSceneUp(actId: string, sceneId: string) {
		if (!story) return;
		const act = story.acts.find(a => a.id === actId);
		if (!act) return;
		const idx = act.scenes.findIndex(s => s.id === sceneId);
		if (idx < 0) return;

		if (idx > 0) {
			// Move up within same act
			const scenes = [...act.scenes];
			[scenes[idx - 1], scenes[idx]] = [scenes[idx], scenes[idx - 1]];
			act.scenes = scenes.map((s, i) => ({ ...s, order: i }));
		} else {
			// At top of act — move to end of previous act
			const actOrder = story.acts.findIndex(a => a.id === actId);
			if (actOrder <= 0) return;
			const prevAct = story.acts[actOrder - 1];
			const scene = act.scenes[idx];
			act.scenes = act.scenes.filter(s => s.id !== sceneId).map((s, i) => ({ ...s, order: i }));
			prevAct.scenes = [...prevAct.scenes, scene].map((s, i) => ({ ...s, order: i }));
		}
		selectedSceneId = sceneId;
		persist();
	}

	function moveSceneDown(actId: string, sceneId: string) {
		if (!story) return;
		const act = story.acts.find(a => a.id === actId);
		if (!act) return;
		const idx = act.scenes.findIndex(s => s.id === sceneId);
		if (idx < 0) return;

		if (idx < act.scenes.length - 1) {
			// Move down within same act
			const scenes = [...act.scenes];
			[scenes[idx], scenes[idx + 1]] = [scenes[idx + 1], scenes[idx]];
			act.scenes = scenes.map((s, i) => ({ ...s, order: i }));
		} else {
			// At bottom of act — move to start of next act
			const actOrder = story.acts.findIndex(a => a.id === actId);
			if (actOrder >= story.acts.length - 1) return;
			const nextAct = story.acts[actOrder + 1];
			const scene = act.scenes[idx];
			act.scenes = act.scenes.filter(s => s.id !== sceneId).map((s, i) => ({ ...s, order: i }));
			nextAct.scenes = [scene, ...nextAct.scenes].map((s, i) => ({ ...s, order: i }));
		}
		selectedSceneId = sceneId;
		persist();
	}

	function isDropTarget(actId: string, index: number | null): boolean {
		if (!dragInfo || dropTargetActId !== actId) return false;
		if (index === null && dropIndex === null) return true;
		if (index !== null && dropIndex !== null) return dropIndex === index;
		return false;
	}

	/** Check whether a scene can be moved upward (not the very first scene) */
	function canMoveUp(actId: string, sceneId: string): boolean {
		if (!story) return false;
		const actOrder = story.acts.findIndex(a => a.id === actId);
		if (actOrder < 0) return false;
		const act = story.acts[actOrder];
		const idx = act.scenes.findIndex(s => s.id === sceneId);
		if (idx < 0) return false;
		if (idx > 0) return true;
		return actOrder > 0;
	}

	/** Check whether a scene can be moved downward (not the very last scene) */
	function canMoveDown(actId: string, sceneId: string): boolean {
		if (!story) return false;
		const actOrder = story.acts.findIndex(a => a.id === actId);
		if (actOrder < 0) return false;
		const act = story.acts[actOrder];
		const idx = act.scenes.findIndex(s => s.id === sceneId);
		if (idx < 0) return false;
		if (idx < act.scenes.length - 1) return true;
		return actOrder < story.acts.length - 1;
	}

	// ── Global keyboard shortcuts ──
	$effect(() => {
		function handleKeydown(e: KeyboardEvent) {
			if (!story) return;
			// Ctrl+K or Cmd+K: toggle character mode
			if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
				e.preventDefault();
				characterMode = !characterMode;
				if (characterMode) screenplayMode = false;
			}
		}
		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});
</script>

{#if loading}
	<div class="flex items-center justify-center py-16" style="background: var(--bg-back);" aria-live="polite">
		<div
			class="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
			style="border-color: var(--border-base); border-top-color: var(--text-muted);"
		></div>
	</div>
{:else if !story}
	<div class="flex flex-col items-center justify-center py-16" style="background: var(--bg-back);">
		<p class="text-sm" style="color: var(--text-muted);" role="alert">Story not found</p>
		<a href="/" class="mt-2 text-xs" style="color: var(--text-base);">Back to dashboard</a>
	</div>
{:else}
	<div class="flex h-[calc(100dvh-3rem)]" style="background: var(--bg-back);">
		<!-- Sidebar -->
		{#if sidebarOpen}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div
				class="sidebar-backdrop"
				onclick={() => (sidebarOpen = false)}
				role="presentation"
			></div>
			<aside
				class="sidebar-panel flex w-60 flex-shrink-0 flex-col overflow-y-auto border-r"
				style="border-color: var(--border-strong); background: var(--bg-base);"
			>
				<!-- Story metadata -->
				<div class="border-b px-4 py-3 space-y-2" style="border-color: var(--border-strong);">
					<h1 class="sr-only" style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;">{story.title}</h1>
					<input
						type="text"
						bind:value={story.title}
						onchange={persist}
						class="field-input w-full text-sm font-semibold outline-none"
						style="color: var(--text-strong);"
						aria-label="Story title"
						placeholder="Story title"
					/>
					<input
						type="text"
						bind:value={story.author}
						onchange={persist}
						class="field-input w-full text-xs outline-none"
						style="color: var(--text-muted);"
						aria-label="Author"
						placeholder="Author name"
					/>
					<textarea
						bind:value={story.logline}
						onchange={persist}
						class="field-input w-full resize-none text-xs outline-none"
						style="color: var(--text-muted); min-height: 2.5em;"
						rows="2"
						aria-label="Logline"
						placeholder="A one- or two-sentence logline..."
					></textarea>
				</div>

				<!-- Acts -->
				<div class="flex-1 overflow-y-auto px-3 py-3">
					{#each story.acts as act (act.id)}
						<div class="mb-4 group">
							<div class="mb-1 flex items-center justify-between gap-2 px-2">
								<input
									type="text"
									bind:value={act.title}
									onchange={persist}
									class="field-input min-w-0 flex-1 text-xs font-semibold outline-none"
									style="color: var(--text-base);"
									aria-label="Act title"
								/>
								<div class="flex flex-shrink-0 items-center gap-1">
									<span class="text-xs" style="color: var(--text-muted);">{act.scenes.length}</span>
									<button
										onclick={(e) => { e.stopPropagation(); deleteAct(act.id); }}
										class="scene-delete-btn opacity-0 transition-opacity group-hover:opacity-100"
										aria-label="Delete act"
									>&times;</button>
								</div>
							</div>

							<div class="space-y-0.5">
								{#each act.scenes as scene (scene.id)}
									<!-- svelte-ignore a11y_no_static_element_interactions -->
									<div
										onclick={() => (selectedSceneId = scene.id)}
										onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectedSceneId = scene.id; } }}
										role="button"
										tabindex="0"
										draggable="true"
										ondragstart={(e) => handleDragStart(e, scene, act.id)}
										ondragend={handleDragEnd}
										ondragenter={(e) => handleSceneDragEnter(e, act.id, scene.order)}
										ondragleave={handleSceneDragLeave}
										data-act-id={act.id}
										data-index={scene.order}
										class="sidebar-scene-btn group flex w-full cursor-pointer items-start justify-between gap-1 px-2 py-2"
										class:selected={selectedSceneId === scene.id}
										class:dragging={dragInfo?.sceneId === scene.id}
										class:drop-indicator={isDropTarget(act.id, scene.order)}
										aria-label="Scene {scene.order + 1}: {scene.title || 'New Scene'}"
									>
										<div class="flex min-w-0 flex-1 flex-col items-start gap-0.5">
											<span class="flex w-full min-w-0 items-center gap-2 text-xs">
												<span class="flex-shrink-0" style="color: var(--text-muted);">{scene.order + 1}.</span>
												<span class="truncate font-medium" title={scene.title || 'New Scene'}>{scene.title || 'New Scene'}</span>
											</span>
											{#if scenePreview(scene)}
												<span class="ml-4 truncate text-xs" style="color: var(--text-muted); line-height: 1.3;" title={scenePreview(scene)}>
													{scenePreview(scene)}
												</span>
											{/if}
											{#if scene.characters.length > 0}
												<span class="ml-4 flex items-center gap-1">
													{#each scene.characters as charId (charId)}
														{@const char = story?.characters.find(c => c.id === charId)}
														{#if char}
															<span
																class="inline-block rounded-full"
																style="width: 6px; height: 6px; background: {charRoleColor(charId)};"
																title={char.name}
															></span>
														{/if}
													{/each}
												</span>
											{/if}
										</div>
										<div class="scene-actions flex flex-shrink-0 items-center gap-px opacity-0 transition-opacity group-hover:opacity-100" class:opacity-100={selectedSceneId === scene.id}>
											<button
												onclick={(e) => { e.stopPropagation(); moveSceneUp(act.id, scene.id); }}
												class="scene-move-btn"
												aria-label="Move scene up"
												disabled={!canMoveUp(act.id, scene.id)}
											>
												<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
													<path d="M5 8V3" /><path d="M2.5 5.5L5 3l2.5 2.5" />
												</svg>
											</button>
											<button
												onclick={(e) => { e.stopPropagation(); moveSceneDown(act.id, scene.id); }}
												class="scene-move-btn"
												aria-label="Move scene down"
												disabled={!canMoveDown(act.id, scene.id)}
											>
												<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
													<path d="M5 2v5" /><path d="M2.5 4.5L5 7l2.5-2.5" />
												</svg>
											</button>
											<button
												onclick={(e) => { e.stopPropagation(); deleteScene(act.id, scene.id); }}
												class="scene-delete-btn"
												aria-label="Delete scene"
											>&times;</button>
										</div>
									</div>
								{/each}

								<!-- Empty act drop zone -->
								{#if act.scenes.length === 0}
									<div
										ondragover={handleDragOver}
										ondragenter={(e) => handleActDragEnter(e, act.id)}
										ondragleave={handleActDragLeave}
										ondrop={(e) => handleDrop(e, act.id, null)}
										class="drop-act-zone"
										class:drag-over={dragInfo && dropTargetActId === act.id && dropIndex === null}
									>
										<div class="px-2 py-2 text-xs" style="color: var(--text-muted);">
											{dragInfo ? 'Drop here' : 'No scenes yet'}
										</div>
									</div>
								{/if}

								<!-- Add Scene — also a drop target for appending -->
								<div
									ondragover={handleDragOver}
									ondragenter={(e) => handleActDragEnter(e, act.id)}
									ondragleave={handleActDragLeave}
									ondrop={(e) => handleDrop(e, act.id, null)}
									class="drop-act-zone"
									class:drag-over={dragInfo && dropTargetActId === act.id && act.scenes.length > 0 && dropIndex === null}
								>
									<button
										onclick={() => addScene(act.id)}
										class="sidebar-action-btn w-full px-2 py-2 text-left text-xs"
									>
										{dragInfo && dropTargetActId === act.id && dropIndex === null ? 'Drop here to append' : 'Add Scene'}
									</button>
								</div>
							</div>
						</div>
					{/each}

					<!-- Add Act -->
					<button
						onclick={addAct}
						class="sidebar-action-btn w-full px-2 py-2 text-xs"
					>
						Add Act
					</button>
				</div>

				<!-- Footer stats -->
				<div class="border-t px-4 py-2" style="border-color: var(--border-strong);">
					<div class="flex items-center justify-between text-xs" style="color: var(--text-muted);">
						<span>{story.acts.length} acts</span>
						<span>{totalWordCount()} words</span>
					</div>
				</div>
			</aside>
		{/if}

		<!-- Editor area -->
		<div class="flex flex-1 flex-col min-h-0">
			<!-- Editor header bar -->
			<div class="flex items-center border-b px-1" style="border-color: var(--border-strong); background: var(--bg-base);">
				<button
					onclick={() => (sidebarOpen = !sidebarOpen)}
					class="btn-ghost flex items-center justify-center px-3 py-2"
					aria-label="Toggle sidebar"
					style="min-height: 44px;"
				>
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
						{#if sidebarOpen}
							<line x1="9" y1="1" x2="9" y2="13" />
							<line x1="4" y1="4" x2="1" y2="7" />
							<line x1="4" y1="10" x2="1" y2="7" />
						{:else}
							<line x1="5" y1="1" x2="5" y2="13" />
							<line x1="10" y1="4" x2="13" y2="7" />
							<line x1="10" y1="10" x2="13" y2="7" />
						{/if}
					</svg>
				</button>

				<!-- Mode toggle: Scenes / Screenplay / Characters -->
				<div class="ml-1 flex items-center gap-0.5 rounded-sm border" style="border-color: var(--border-base);">
					<button
						onclick={() => { screenplayMode = false; characterMode = false; }}
						class="px-3 py-1.5 text-xs font-medium transition-colors"
						style="background: {!screenplayMode && !characterMode ? 'var(--bg-front)' : 'transparent'}; color: {!screenplayMode && !characterMode ? 'var(--text-strong)' : 'var(--text-muted)'}; border-radius: 2px; border: none; cursor: pointer; min-height: 36px;"
					>Scenes</button>
					<button
						onclick={() => { screenplayMode = false; characterMode = false; setTimeout(() => { screenplayMode = true; }, 0); }}
						class="px-3 py-1.5 text-xs font-medium transition-colors"
						style="background: {screenplayMode && !characterMode ? 'var(--bg-front)' : 'transparent'}; color: {screenplayMode && !characterMode ? 'var(--text-strong)' : 'var(--text-muted)'}; border-radius: 2px; border: none; cursor: pointer; min-height: 36px;"
					>Screenplay</button>
					<button
						onclick={() => { characterMode = !characterMode; if (characterMode) screenplayMode = false; }}
						class="px-3 py-1.5 text-xs font-medium transition-colors"
						style="background: {characterMode ? 'var(--bg-front)' : 'transparent'}; color: {characterMode ? 'var(--text-strong)' : 'var(--text-muted)'}; border-radius: 2px; border: none; cursor: pointer; min-height: 36px;"
					>Characters</button>
				</div>

				{#if !screenplayMode && !characterMode && selectedScene()}
					{@const scene = selectedScene()!}
					<div class="flex flex-1 flex-col gap-1 px-2 py-1">
						<input
							type="text"
							bind:value={scene.title}
							onchange={persist}
							class="field-input w-full text-sm font-medium outline-none"
							style="color: var(--text-strong);"
							placeholder="Scene title"
							aria-label="Scene title"
						/>
						<input
							type="text"
							bind:value={scene.summary}
							onchange={persist}
							class="field-input w-full text-xs outline-none"
							style="color: var(--text-muted);"
							placeholder="Brief summary of this scene…"
							aria-label="Scene summary"
						/>
					</div>
				{/if}

				<!-- Export (always visible) -->
				<div class="relative ml-auto">
					<button
						onclick={() => (exportOpen = !exportOpen)}
						onblur={() => setTimeout(() => (exportOpen = false), 200)}
						class="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs"
						style="min-height: 36px;"
						aria-label="Export"
					>
						<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
							<path d="M6.5 1v7M4 5.5l2.5 2.5L9 5.5" />
							<path d="M1 8.5v2.5a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V8.5" />
						</svg>
						<span class="text-xs font-medium">Export</span>
					</button>

					{#if exportOpen}
						<div
							class="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-sm border"
							style="background: var(--bg-front); border-color: var(--border-strong);"
						>
							{#if story}
								<button onclick={async () => { exportOpen = false; const { exportStoryMarkdown } = await import('$lib/export'); exportStoryMarkdown(story!); }} class="export-item">
									<span class="font-semibold" style="width: 1.2rem;">M</span>
									Story as Markdown
								</button>
								<button onclick={async () => { exportOpen = false; const { exportStoryPDF } = await import('$lib/export'); exportStoryPDF(story!); }} class="export-item">
									<span class="font-semibold" style="width: 1.2rem;">P</span>
									Story as PDF
								</button>
								<div style="height: 1px; background: var(--border-base); margin: 2px 0;"></div>
								{#if screenplay}
									<button onclick={async () => { exportOpen = false; exportError = null; if (!screenplay) return; try { const { exportScreenplayPDF } = await import('$lib/export'); await exportScreenplayPDF(screenplay.content, story!.title); } catch (e) { exportError = 'Screenplay PDF export failed. Please try again.'; console.error(e); } }} class="export-item">
										<span class="font-semibold" style="width: 1.2rem;">P</span>
										Screenplay as PDF
									</button>
									<div style="height: 1px; background: var(--border-base); margin: 2px 0;"></div>
								{/if}
								<button onclick={async () => { exportOpen = false; const { exportOutlineMarkdown } = await import('$lib/export'); exportOutlineMarkdown(story!); }} class="export-item">
									<span class="font-semibold" style="width: 1.2rem;">M</span>
									Outline as Markdown
								</button>
								<button onclick={async () => { exportOpen = false; const { exportOutlinePDF } = await import('$lib/export'); exportOutlinePDF(story!); }} class="export-item">
									<span class="font-semibold" style="width: 1.2rem;">P</span>
									Outline as PDF
								</button>
								<div style="height: 1px; background: var(--border-base); margin: 2px 0;"></div>
								<button onclick={async () => { exportOpen = false; const { exportActFile } = await import('$lib/export'); exportActFile(story!, screenplay); }} class="export-item">
									<span class="font-semibold" style="width: 1.2rem;">A</span>
									Story as .act
								</button>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Preview toggle — cycles outline / characters / closed -->
				
					<button
						onclick={cyclePreview}
						class="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs"
						style="min-height: 36px;"
						aria-label="Toggle preview: {previewLabel()}"
					>
						<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
							{#if previewMode !== 'closed'}
								<path d="M1.5 6.5s2-4 5-4 5 4 5 4-2 4-5 4-5-4-5-4Z" />
								<circle cx="6.5" cy="6.5" r="1.5" />
							{:else}
								<line x1="1.5" y1="1.5" x2="11.5" y2="11.5" />
								<path d="M4.8 3.4A5 5 0 0 1 6.5 2.5c3 0 5 4 5 4s-.6 1.2-1.7 2.2" />
								<path d="M3 4.8A5.1 5.1 0 0 0 1.5 6.5s2 4 5 4c.9 0 1.8-.3 2.6-.8" />
							{/if}
						</svg>
						<span class="text-xs font-medium">{previewLabel()}</span>
					</button>
			</div>

			<!-- Editor area — switches between Character panel, Scene editor, and Fountain editor -->
			{#if characterMode}
				<div class="flex flex-1 gap-3 p-3 min-h-0">
					<div class="flex flex-1 flex-col overflow-hidden rounded-sm min-h-0" style="background: var(--bg-front); border: 1.5px solid var(--border-base);">
						<CharacterPanel {story} selectedSceneId={$page.params.id ? selectedSceneId : null} onchange={debouncedPersist} />
					</div>
					{#if previewMode === 'outline'}
						<div class="flex flex-1 flex-col overflow-hidden rounded-sm min-h-0" style="background: var(--bg-front); border: 1.5px solid var(--border-base);">
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
					{/if}
					{#if previewMode === 'characters'}
						<div class="flex flex-1 flex-col overflow-hidden rounded-sm min-h-0" style="background: var(--bg-front); border: 1.5px solid var(--border-base);">
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
															style="background: {char.role === 'protagonist' ? 'oklch(0.42 0.18 260 / 0.12)' : char.role === 'antagonist' ? 'oklch(0.62 0.14 30 / 0.12)' : char.role === 'supporting' ? 'oklch(0.50 0.16 250 / 0.10)' : 'var(--ghost-hover)'}; color: {char.role === 'protagonist' ? 'var(--primary)' : char.role === 'antagonist' ? 'var(--warm)' : char.role === 'supporting' ? '#2563eb' : 'var(--text-dim)'};"
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
					{/if}
				</div>
			{:else if screenplayMode}
				<!-- Fountain Screenplay Editor + Preview / Outline / Characters -->
				{#if screenplay}
					<div class="flex flex-1 gap-3 p-3 min-h-0">
						<!-- Fountain source editor — 40% (50% when preview is closed) -->
						<div
							class="flex flex-col overflow-hidden rounded-sm min-h-0"
							class:flex-[2]={previewMode !== 'closed'}
							class:flex-1={previewMode === 'closed'}
							style="background: var(--bg-front); border: 1.5px solid var(--border-base); {previewMode === 'closed' ? 'width: 100%;' : ''}"
						>
							{#if FountainEditor}
								<svelte:component this={FountainEditor} content={screenplay.content} onUpdate={handleScreenplayUpdate} />
							{/if}
						</div>

						<!-- Right panel: Fountain preview (closed) / Outline / Characters -->
						{#if previewMode === 'closed'}
							<!-- Fountain formatted preview — 60% -->
							<div class="flex flex-[3] flex-col overflow-hidden rounded-sm" style="background: #fff; border: 1.5px solid var(--border-base);">
								<div class="border-b px-3 py-1.5" style="border-color: var(--border-base); background: var(--bg-base);">
									<span class="text-xs font-semibold" style="color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em;">Preview</span>
								</div>
								<div class="flex-1 overflow-y-auto min-h-0 h-0">
									{#if FountainPreview}
										<svelte:component this={FountainPreview} content={screenplay.content} />
									{/if}
								</div>
							</div>
						{:else if previewMode === 'outline'}
							<div class="flex flex-[3] flex-col overflow-hidden rounded-sm min-h-0" style="background: var(--bg-front); border: 1.5px solid var(--border-base);">
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
						{:else if previewMode === 'characters'}
							<div class="flex flex-[3] flex-col overflow-hidden rounded-sm min-h-0" style="background: var(--bg-front); border: 1.5px solid var(--border-base);">
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
																style="background: {char.role === 'protagonist' ? 'oklch(0.42 0.18 260 / 0.12)' : char.role === 'antagonist' ? 'oklch(0.62 0.14 30 / 0.12)' : 'var(--ghost-hover)'}; color: {char.role === 'protagonist' ? 'var(--primary)' : char.role === 'antagonist' ? 'var(--warm)' : 'var(--text-dim)'};"
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
						{/if}
					</div>
				{:else}
					<div class="flex flex-1 items-center justify-center">
						<div class="text-center">
							<p class="text-xs" style="color: var(--text-dim);">Loading screenplay...</p>
						</div>
					</div>
				{/if}
			{:else if selectedScene()}
				{@const scene = selectedScene()!}
				<div class="flex flex-1 gap-3 p-3 min-h-0">
					<!-- Editor panel -->
					<div
						class="flex flex-col overflow-hidden rounded-sm min-h-0 transition-all duration-200"
						class:flex-1={previewMode !== 'closed'}
						style="background: var(--bg-front); border: 1.5px solid var(--border-base); {previewMode === 'closed' ? 'width: 100%;' : ''}"
					>
						<div class="flex-1 overflow-y-auto min-h-0 h-0">
							<SceneEditor
								content={scene.content}
								placeholder="Write your scene content here…"
								focusTrigger={focusTrigger}
								key={scene.id}
								onUpdate={handleContentUpdate}
							/>
						</div>
					</div>

					<!-- Preview panel — story outline -->
					{#if previewMode === 'outline'}
						<div class="flex flex-1 flex-col overflow-hidden rounded-sm min-h-0 transition-all duration-200" style="background: var(--bg-front); border: 1.5px solid var(--border-base);">
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
					{/if}

					<!-- Preview panel — character overview -->
					{#if previewMode === 'characters'}
						<div class="flex flex-1 flex-col overflow-hidden rounded-sm min-h-0 transition-all duration-200" style="background: var(--bg-front); border: 1.5px solid var(--border-base);">
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
															style="background: {char.role === 'protagonist' ? 'oklch(0.42 0.18 260 / 0.12)' : char.role === 'antagonist' ? 'oklch(0.62 0.14 30 / 0.12)' : 'var(--ghost-hover)'}; color: {char.role === 'protagonist' ? 'var(--primary)' : char.role === 'antagonist' ? 'var(--warm)' : 'var(--text-dim)'};"
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
					{/if}
				</div>

				{#if exportError}
					<div class="flex items-center justify-between border-b px-4 py-2 text-xs" style="background: #fff0f0; color: #c00; border-color: #fcc;" role="alert">
						<span>{exportError}</span>
						<button onclick={() => (exportError = null)} class="ml-3 font-bold leading-none" style="color: #c00; font-size: 1.1rem;">&times;</button>
					</div>
				{/if}
			{:else}
				<div class="flex flex-1 items-center justify-center">
					<div class="text-center">
						<p class="mb-1 text-sm font-semibold" style="color: var(--text-muted);">No scene selected</p>
						<p class="text-xs" style="color: var(--text-dim);">Select or create a scene from the sidebar</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
