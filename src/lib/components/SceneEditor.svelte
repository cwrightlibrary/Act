<script lang="ts">
	import { untrack } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Placeholder from '@tiptap/extension-placeholder';
	import Underline from '@tiptap/extension-underline';

	let {
		content = '',
		placeholder = 'Start writing...',
		focusTrigger = 0,
		key = '',
		onUpdate = (_html: string) => {}
	} = $props();

	let editorEl = $state<HTMLDivElement>();
	let editor: Editor;
	let activeStates = $state<Record<string, boolean>>({});

	$effect(() => {
		// Track key and editorEl; do NOT track content/placeholder reactively
		const sceneKey = key;
		if (!editorEl) return;
		if (editor) editor.destroy();

		const c = untrack(() => content ?? '');
		const p = untrack(() => placeholder);

		editor = new Editor({
			element: editorEl,
			extensions: [
				StarterKit.configure({
					heading: { levels: [1, 2, 3] }
				}),
				Underline,
				Placeholder.configure({ placeholder: p })
			],
			content: c,
			editorProps: {
				attributes: {
					class: 'focus:outline-none prose prose-sm max-w-none',
					style: 'min-height: 200px; padding: 1rem; color: var(--text-base); font-family: var(--font-sans); font-size: 0.9375rem; line-height: 1.7;'
				}
			},
			onUpdate: ({ editor: e }) => {
				onUpdate(e.getHTML());
				// Refresh active states
				refreshActive();
			},
			onSelectionUpdate: () => {
				refreshActive();
			}
		});
		refreshActive();

		return () => {
			editor.destroy();
		};
	});

	function refreshActive() {
		if (!editor) return;
		activeStates = {
			bold: editor.isActive('bold'),
			italic: editor.isActive('italic'),
			underline: editor.isActive('underline'),
			heading1: editor.isActive('heading', { level: 1 }),
			heading2: editor.isActive('heading', { level: 2 }),
			heading3: editor.isActive('heading', { level: 3 }),
			bulletList: editor.isActive('bulletList'),
			orderedList: editor.isActive('orderedList')
		};
	}

	$effect(() => {
		if (focusTrigger > 0 && editor) {
			editor.commands.focus();
		}
	});

	function exec(cmd: string, ...args: unknown[]) {
		if (!editor) return;
		// @ts-ignore
		editor.chain().focus()[cmd](...args).run();
	}
</script>

<div class="flex w-full flex-col">
	<!-- Toolbar -->
	<div class="panel-header flex items-center gap-1">
		<button onclick={() => exec('toggleBold')} class="toolbar-btn" class:active={activeStates.bold} aria-label="Bold"><b>B</b></button>
		<button onclick={() => exec('toggleItalic')} class="toolbar-btn" class:active={activeStates.italic} aria-label="Italic"><i>I</i></button>
		<button onclick={() => exec('toggleUnderline')} class="toolbar-btn" class:active={activeStates.underline} aria-label="Underline"><u>U</u></button>
		<span class="toolbar-sep"></span>
		<button onclick={() => exec('toggleHeading', { level: 1 })} class="toolbar-btn" class:active={activeStates.heading1} aria-label="Heading 1">H1</button>
		<button onclick={() => exec('toggleHeading', { level: 2 })} class="toolbar-btn" class:active={activeStates.heading2} aria-label="Heading 2">H2</button>
		<button onclick={() => exec('toggleHeading', { level: 3 })} class="toolbar-btn" class:active={activeStates.heading3} aria-label="Heading 3">H3</button>
		<span class="toolbar-sep"></span>
		<button onclick={() => exec('toggleBulletList')} class="toolbar-btn" class:active={activeStates.bulletList} aria-label="Bullet List">&bull;</button>
		<button onclick={() => exec('toggleOrderedList')} class="toolbar-btn" class:active={activeStates.orderedList} aria-label="Ordered List">1.</button>
	</div>

	<!-- Editor body -->
	<div bind:this={editorEl} class="w-full"></div>
</div>
