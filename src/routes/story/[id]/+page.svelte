<script lang="ts">
	import { page } from '$app/stores';
	import { getStory, saveStory, getScreenplayByStory, saveScreenplay } from '$lib/persistence/db';
	import { createScene, createAct, createScreenplay } from '$lib/domain/story';
	import type { Story, Scene, Screenplay } from '$lib/domain/story';
	import SceneEditor from '$lib/components/SceneEditor.svelte';
	import CharacterPanel from '$lib/components/CharacterPanel.svelte';
	import NotesEditor from '$lib/components/NotesEditor.svelte';
	import OutlinePreview from '$lib/components/OutlinePreview.svelte';
	import CharactersPreview from '$lib/components/CharactersPreview.svelte';
	import type { Component } from 'svelte';

	let story = $state<Story | null>(null);
	let loading = $state(true);
	let selectedSceneId = $state<string | null>(null);
	let sidebarOpen = $state(true);
	type PreviewMode = 'closed' | 'outline' | 'characters';
	let previewMode = $state<PreviewMode>('closed');
	// Screenplay Fountain formatted preview visibility (hidden by default on mobile)
	let previewVisible = $state(true);

	// Resizable split position — percentage for left panel (editor/character panel)
	let splitPos = $state(40);
			let resizeInfo = $state<{ startX: number; startPct: number; container: HTMLElement } | null>(null);
			let sidebarDetailsOpen = $state(false);

	function startResize(e: MouseEvent | TouchEvent) {
		const handle = e.currentTarget as HTMLElement;
		const container = handle.parentElement!;
		const startPct = splitPos;
		resizeInfo = { startX: 'touches' in e ? e.touches[0].clientX : e.clientX, startPct, container };
		e.preventDefault();
	}

	// Global mousemove / mouseup during resize
	$effect(() => {
		if (!resizeInfo) return;
		const { container } = resizeInfo;
		function onMove(e: MouseEvent | TouchEvent) {
			const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
			const rect = container.getBoundingClientRect();
			const pct = ((clientX - rect.left) / rect.width) * 100;
			splitPos = Math.max(20, Math.min(80, pct));
		}
		function onUp() {
			resizeInfo = null;
		}
		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
		window.addEventListener('touchmove', onMove, { passive: true });
		window.addEventListener('touchend', onUp);
		return () => {
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
			window.removeEventListener('touchmove', onMove);
			window.removeEventListener('touchend', onUp);
		};
	});

	function cyclePreview() {
		// In screenplay mode: closed → fountain preview → outline → characters → closed
		if (screenplayMode && previewMode === 'closed' && !previewVisible) {
			previewVisible = true;
			return;
		}
		if (screenplayMode && previewMode === 'closed' && previewVisible) {
			previewVisible = false;
			previewMode = 'outline';
			return;
		}
		const modes: PreviewMode[] = ['closed', 'outline', 'characters'];
		const idx = modes.indexOf(previewMode);
		previewMode = modes[(idx + 1) % modes.length];
	}

	function previewLabel(): string {
		if (screenplayMode && previewMode === 'closed' && previewVisible) return 'Preview';
		switch (previewMode) {
			case 'outline': return 'Outline';
			case 'characters': return 'Characters';
			default: return 'Preview';
		}
	}

	// Whether a panel is actually visible on the right side (accounts for
	// the screenplay Fountain preview which lives outside the previewMode cycle).
	function previewActive(): boolean {
		if (screenplayMode && previewMode === 'closed') return previewVisible;
		return previewMode !== 'closed';
	}
	let exportOpen = $state(false);
	let exportContainer = $state<HTMLElement>();
	let focusTrigger = $state(0);
	let saveTimer: ReturnType<typeof setTimeout> | null = null;

	let screenplayMode = $state(false);
	let characterMode = $state(false);
	let notesMode = $state(false);
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

	// Set preview visibility based on viewport — hidden by default on mobile
	$effect(() => {
		if (typeof window !== 'undefined') {
			previewVisible = !window.matchMedia('(max-width: 767px)').matches;
		}
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

	function handleNotesUpdate(text: string) {
		if (!story) return;
		story.notes = text;
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
			case 'supporting': return 'var(--accent)';
			default: return 'var(--text-dim)';
		}
	}

	function sceneCharacters(scene: Scene) {
		if (!story) return [];
		return scene.characters.map(id => story!.characters.find(c => c.id === id)).filter(Boolean);
	}

	// ── Drag and drop reordering ──
	let dragInfo = $state<{ sceneId: string; sourceActId: string; sourceIndex: number } | null>(null);
	let dropTargetActId = $state<string | null>(null);
	let dropIndex = $state<number | null>(null);

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

	// ── Close export dropdown on click outside ──
	$effect(() => {
		if (!exportOpen) return;
		function handleClick(e: MouseEvent) {
			if (!exportContainer) return;
			const target = e.target as Node;
			if (target && !exportContainer.contains(target)) {
				exportOpen = false;
			}
		}
		queueMicrotask(() => window.addEventListener('click', handleClick));
		return () => window.removeEventListener('click', handleClick);
	});

	// ── Global keyboard shortcuts ──
	$effect(() => {
		function handleKeydown(e: KeyboardEvent) {
			if (!story) return;
			// Ctrl+K or Cmd+K: cycle editor modes (Scenes → Screenplay → Characters → Notes → Scenes)
			if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
				e.preventDefault();
				if (!screenplayMode && !characterMode && !notesMode) {
					// Scenes → Screenplay
					screenplayMode = true;
				} else if (screenplayMode) {
					// Screenplay → Characters
					screenplayMode = false;
					characterMode = true;
				} else if (characterMode) {
					// Characters → Notes
					characterMode = false;
					notesMode = true;
				} else if (notesMode) {
					// Notes → Scenes
					notesMode = false;
				}
				return;
			}
			// Escape: close export dropdown, exit character/notes mode
			if (e.key === 'Escape') {
				if (exportOpen) {
					exportOpen = false;
					e.preventDefault();
				} else if (characterMode || notesMode) {
					characterMode = false;
					notesMode = false;
					e.preventDefault();
				}
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
				class="sidebar-panel flex w-64 flex-shrink-0 flex-col overflow-y-auto border-r"
				style="border-color: var(--border-strong); background: var(--bg-base);"
			>
				<!-- Story metadata — title always visible; author/logline expandable -->
				<div class="border-b px-4 py-4" style="border-color: var(--border-strong);">
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

					<button
						onclick={() => (sidebarDetailsOpen = !sidebarDetailsOpen)}
						class="mt-2 flex items-center gap-1 text-xs"
						style="color: var(--text-dim);"
						aria-label="Toggle story details"
					>
						<svg
							width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
							class="transition-transform duration-150"
							class:rotate-90={sidebarDetailsOpen}
							aria-hidden="true"
						>
							<path d="M2.5 1l3 3-3 3" />
						</svg>
						Details
					</button>

					{#if sidebarDetailsOpen}
						<div class="mt-3 space-y-3">
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
					{/if}
				</div>

				<!-- Acts -->
				<div class="flex-1 overflow-y-auto px-3 py-4">
					{#each story.acts as act (act.id)}
						<div class="mb-5 group">
							<div class="mb-1.5 flex items-center justify-between gap-2 px-2">
								<input
									type="text"
									bind:value={act.title}
									onchange={persist}
									class="field-input min-w-0 flex-1 text-sm font-semibold outline-none"
									style="color: var(--text-strong);"
									aria-label="Act title"
								/>
								<div class="flex flex-shrink-0 items-center gap-1">
									<span class="text-xs" style="color: var(--text-muted);">{act.scenes.length}</span>
									<button
										onclick={(e) => { e.stopPropagation(); deleteAct(act.id); }}
										class="act-delete-btn"
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
										class="sidebar-scene-btn group relative flex w-full cursor-pointer items-center justify-between gap-1 px-3 py-2"
										class:selected={selectedSceneId === scene.id}
										class:dragging={dragInfo?.sceneId === scene.id}
										class:drop-indicator={isDropTarget(act.id, scene.order)}
										aria-label="Scene {scene.order + 1}: {scene.title || 'New Scene'}"
									>
										<span class="flex min-w-0 items-center gap-2 text-xs">
											<span class="flex-shrink-0" style="color: var(--text-muted);">{scene.order + 1}.</span>
											<span class="truncate font-medium" title={scene.title || 'New Scene'}>{scene.title || 'New Scene'}</span>
										</span>
										<button
											onclick={(e) => { e.stopPropagation(); deleteScene(act.id, scene.id); }}
											class="scene-delete-btn"
											aria-label="Delete scene"
										>&times;</button>
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
										class="sidebar-action-btn w-full px-3 py-2.5 text-left text-xs"
									>
										{dragInfo && dropTargetActId === act.id && dropIndex === null ? 'Drop here to append' : '+ Add Scene'}
									</button>
								</div>
							</div>
						</div>
					{/each}

					<!-- Add Act -->
					<button
						onclick={addAct}
						class="sidebar-action-btn w-full px-3 py-2.5 text-xs font-semibold"
					>
						+ Add Act
					</button>
				</div>

				<!-- Footer stats -->
				<div class="border-t px-4 py-3" style="border-color: var(--border-strong);">
					<div class="flex items-center justify-between text-xs" style="color: var(--text-muted);">
						<span>{story.acts.length} {story.acts.length === 1 ? 'act' : 'acts'}</span>
						<span>{totalWordCount()} {totalWordCount() === 1 ? 'word' : 'words'}</span>
					</div>
				</div>
			</aside>
		{/if}

		<!-- Editor area -->
		<div class="flex flex-1 flex-col min-h-0">
			<!-- Editor header bar — simplified -->
			<div class="flex items-center border-b px-1" style="border-color: var(--border-strong); background: var(--bg-base); min-height: 44px;">
				<div class="flex items-center flex-shrink-0">
					<button
						onclick={() => (sidebarOpen = !sidebarOpen)}
						class="btn-ghost flex items-center justify-center px-3"
						style="min-height: 44px;"
						aria-label="Toggle sidebar"
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
				</div>

				<!-- Story title — centered -->
				<div class="flex-1 flex items-center justify-center min-w-0 px-3">
					<h1
						class="truncate text-sm font-semibold"
						style="color: var(--text-strong);"
						title={story?.title}
					>
						{story?.title ?? 'Untitled'}
					</h1>
				</div>

				<!-- Right-side actions — icon only -->
				<div class="flex items-center gap-0.5 flex-shrink-0">
					<!-- Export -->
					<div class="relative" bind:this={exportContainer}>
						<button
							onclick={() => (exportOpen = !exportOpen)}
							class="btn-ghost flex items-center justify-center px-2"
							style="min-height: 36px; min-width: 36px;"
							aria-label="Export"
							title="Export"
						>
							<svg width="14" height="14" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
								<path d="M6.5 1v7M4 5.5l2.5 2.5L9 5.5" />
								<path d="M1 8.5v2.5a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V8.5" />
							</svg>
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
						class="btn-ghost flex items-center justify-center px-2"
						style="min-height: 36px; min-width: 36px;"
						aria-label="Cycle preview: {previewLabel()}"
						title={previewLabel()}
					>
						<svg width="14" height="14" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
							{#if previewActive()}
								<path d="M1.5 6.5s2-4 5-4 5 4 5 4-2 4-5 4-5-4-5-4Z" />
								<circle cx="6.5" cy="6.5" r="1.5" />
							{:else}
								<line x1="1.5" y1="1.5" x2="11.5" y2="11.5" />
								<path d="M4.8 3.4A5 5 0 0 1 6.5 2.5c3 0 5 4 5 4s-.6 1.2-1.7 2.2" />
								<path d="M3 4.8A5.1 5.1 0 0 0 1.5 6.5s2 4 5 4c.9 0 1.8-.3 2.6-.8" />
							{/if}
						</svg>
					</button>


				</div>
			</div>

			<!-- Mode tabs — attached to top of editor panel -->
			<div class="editor-tabs flex items-center border-b" style="border-color: var(--border-strong); background: var(--bg-base); min-height: 36px;">
				<button
					onclick={() => { screenplayMode = false; characterMode = false; notesMode = false; }}
					class="editor-tab"
					class:active={!screenplayMode && !characterMode && !notesMode}
				>Scenes</button>
				<button
					onclick={() => { screenplayMode = false; characterMode = false; notesMode = false; setTimeout(() => { screenplayMode = true; }, 0); }}
					class="editor-tab"
					class:active={screenplayMode && !characterMode && !notesMode}
				>Screenplay</button>
				<button
					onclick={() => { characterMode = !characterMode; if (characterMode) { screenplayMode = false; notesMode = false; } }}
					class="editor-tab"
					class:active={characterMode}
				>Characters</button>
				<button
					onclick={() => { notesMode = !notesMode; if (notesMode) { screenplayMode = false; characterMode = false; } }}
					class="editor-tab"
					class:active={notesMode}
				>Notes</button>
			</div>

			<!-- Editor content — switches between Notes, Characters, Screenplay, and Scenes modes -->
			{#if notesMode}
				{@const notesResize = previewMode === 'outline' || previewMode === 'characters'}
				<div class="flex flex-1 gap-3 md:gap-0 p-3 min-h-0 flex-col md:flex-row">
					<!-- Notes editor — resizable when preview is shown -->
					<div
						class="flex flex-col overflow-hidden rounded-sm min-h-0 w-full"
						style="background: var(--bg-front); border: 1.5px solid var(--border-base);"
						style:width={notesResize ? splitPos + '%' : undefined}
						style:flex={notesResize ? 'none' : undefined}
					>
						<NotesEditor key={story.id} content={story.notes} onUpdate={handleNotesUpdate} />
					</div>

					{#if previewMode === 'outline' || previewMode === 'characters'}
						<!-- Resize handle — desktop only -->
						<div
							class="hidden md:flex resize-handle"
							onmousedown={startResize}
							ontouchstart={startResize}
							aria-label="Resize panels"
							role="separator"
							tabindex="0"
							onkeydown={(e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { splitPos = Math.max(20, Math.min(80, splitPos + (e.key === 'ArrowLeft' ? -2 : 2))); e.preventDefault(); } }}
						>
							<div class="resize-handle-dots"></div>
						</div>

						<div class="flex-1 min-w-0">
							{#if previewMode === 'outline'}
								<OutlinePreview {story} />
							{:else}
								<CharactersPreview {story} />
							{/if}
						</div>
					{/if}
				</div>
			{:else if characterMode}
				{@const charResize = previewMode === 'outline' || previewMode === 'characters'}
				<div class="flex flex-1 gap-3 md:gap-0 p-3 min-h-0 flex-col md:flex-row">
					<!-- Character panel — resizable when preview is shown -->
					<div
						class="flex flex-col overflow-hidden rounded-sm min-h-0 w-full"
						style="background: var(--bg-front); border: 1.5px solid var(--border-base);"
						style:width={charResize ? splitPos + '%' : undefined}
						style:flex={charResize ? 'none' : undefined}
					>
						<CharacterPanel {story} selectedSceneId={$page.params.id ? selectedSceneId : null} onchange={debouncedPersist} />
					</div>

					{#if previewMode === 'outline' || previewMode === 'characters'}
						<!-- Resize handle — desktop only -->
						<div
							class="hidden md:flex resize-handle"
							onmousedown={startResize}
							ontouchstart={startResize}
							aria-label="Resize panels"
							role="separator"
							tabindex="0"
							onkeydown={(e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { splitPos = Math.max(20, Math.min(80, splitPos + (e.key === 'ArrowLeft' ? -2 : 2))); e.preventDefault(); } }}
						>
							<div class="resize-handle-dots"></div>
						</div>

						{#if previewMode === 'outline'}
							<OutlinePreview {story} containerClass="flex-1 min-w-0" />
						{:else if previewMode === 'characters'}
							<CharactersPreview {story} containerClass="flex-1 min-w-0" />
						{/if}
					{/if}
				</div>
			{:else if screenplayMode}
				<!-- Fountain Screenplay Editor + Preview / Outline / Characters -->
				{#if screenplay}
					{@const spResize = previewMode !== 'closed' || (previewMode === 'closed' && previewVisible)}
					<div class="flex flex-1 gap-3 md:gap-0 p-3 min-h-0 flex-col md:flex-row">
						<!-- Fountain source editor — resizable width -->
						<div
							class="flex flex-col overflow-hidden rounded-sm min-h-0 w-full"
							style="background: var(--bg-front); border: 1.5px solid var(--border-base);"
							style:width={spResize ? splitPos + '%' : undefined}
							style:flex={spResize ? 'none' : undefined}
						>
							{#if FountainEditor}
								<FountainEditor content={screenplay.content} onUpdate={handleScreenplayUpdate} />
							{/if}
						</div>

						<!-- Right panel: Fountain preview (closed) / Outline / Characters -->
						{#if previewMode === 'closed'}
							<!-- Fountain formatted preview — resizable -->
							{#if previewVisible}
								<div
									class="hidden md:flex resize-handle"
									onmousedown={startResize}
									ontouchstart={startResize}
									aria-label="Resize panels"
									role="separator"
									tabindex="0"
									onkeydown={(e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { splitPos = Math.max(20, Math.min(80, splitPos + (e.key === 'ArrowLeft' ? -2 : 2))); e.preventDefault(); } }}
								>
									<div class="resize-handle-dots"></div>
								</div>
								<div class="flex-1 min-w-0 flex flex-col overflow-hidden rounded-sm" style="background: var(--bg-front); border: 1.5px solid var(--border-base);">
									<div class="border-b px-3 py-1.5 flex items-center justify-between" style="border-color: var(--border-base); background: var(--bg-base);">
										<span class="text-xs font-semibold" style="color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em;">Preview</span>
										<button
											onclick={() => (previewVisible = false)}
											class="text-xs px-1.5 py-0.5 rounded-sm md:hidden"
											style="color: var(--text-dim); border: 1px solid var(--border-base);"
											aria-label="Hide preview"
										>Hide</button>
									</div>
									<div class="flex-1 overflow-y-auto min-h-0 h-0">
									{#if FountainPreview}
										<FountainPreview content={screenplay.content} />
									{/if}
									</div>
								</div>
							{/if}
						{:else if previewMode === 'outline'}
							<div
								class="hidden md:flex resize-handle"
								onmousedown={startResize}
								ontouchstart={startResize}
								aria-label="Resize panels"
								role="separator"
								tabindex="0"
								onkeydown={(e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { splitPos = Math.max(20, Math.min(80, splitPos + (e.key === 'ArrowLeft' ? -2 : 2))); e.preventDefault(); } }}
							>
								<div class="resize-handle-dots"></div>
							</div>
							<OutlinePreview {story} containerClass="flex-1 min-w-0" />
						{:else if previewMode === 'characters'}
							<div
								class="hidden md:flex resize-handle"
								onmousedown={startResize}
								ontouchstart={startResize}
								aria-label="Resize panels"
								role="separator"
								tabindex="0"
								onkeydown={(e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { splitPos = Math.max(20, Math.min(80, splitPos + (e.key === 'ArrowLeft' ? -2 : 2))); e.preventDefault(); } }}
							>
								<div class="resize-handle-dots"></div>
							</div>
							<CharactersPreview {story} containerClass="flex-1 min-w-0" />
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
				{@const sceneResize = previewMode === 'outline' || previewMode === 'characters'}
				<div class="flex flex-1 gap-3 md:gap-0 p-3 min-h-0 flex-col md:flex-row">
					<!-- Editor panel — resizable when preview is shown -->
					<div
						class="flex flex-col overflow-hidden rounded-sm min-h-0 w-full"
						style="background: var(--bg-front); border: 1.5px solid var(--border-base);"
						style:width={sceneResize ? splitPos + '%' : undefined}
						style:flex={sceneResize ? 'none' : undefined}
					>
						<!-- Scene title + summary (within editor panel) -->
						<div class="hidden md:flex items-center gap-2 px-3 border-b" style="border-color: var(--border-base); background: var(--bg-base); min-height: 36px;">
							<input
								type="text"
								bind:value={scene.title}
								onchange={persist}
								class="field-input min-w-0 flex-1 text-xs font-medium outline-none"
								style="color: var(--text-strong);"
								placeholder="Scene title"
								aria-label="Scene title"
							/>
							<span class="flex-shrink-0 text-[10px]" style="color: var(--text-dim);">—</span>
							<input
								type="text"
								bind:value={scene.summary}
								onchange={persist}
								class="field-input min-w-0 flex-[2] text-xs outline-none"
								style="color: var(--text-muted);"
								placeholder="Brief summary..."
								aria-label="Scene summary"
							/>
						</div>
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

					{#if previewMode === 'outline' || previewMode === 'characters'}
						<!-- Resize handle — desktop only -->
						<div
							class="hidden md:flex resize-handle"
							onmousedown={startResize}
							ontouchstart={startResize}
							aria-label="Resize panels"
							role="separator"
							tabindex="0"
							onkeydown={(e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { splitPos = Math.max(20, Math.min(80, splitPos + (e.key === 'ArrowLeft' ? -2 : 2))); e.preventDefault(); } }}
						>
							<div class="resize-handle-dots"></div>
						</div>

						<div class="flex-1 min-w-0">
							{#if previewMode === 'outline'}
								<OutlinePreview {story} />
							{:else}
								<CharactersPreview {story} />
							{/if}
						</div>
					{/if}
				</div>

				{#if exportError}
					<div class="flex items-center justify-between border-b px-4 py-2 text-xs" style="background: oklch(from var(--warm) l c h / 0.12); color: var(--warm); border-color: oklch(from var(--warm) l c h / 0.22);" role="alert">
						<span>{exportError}</span>
						<button onclick={() => (exportError = null)} class="ml-3 font-bold leading-none" style="color: var(--warm); font-size: 1.1rem;">&times;</button>
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
