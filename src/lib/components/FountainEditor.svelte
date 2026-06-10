<script lang="ts">
	let {
		content = '',
		placeholder = 'Start writing your screenplay in Fountain...',
		onUpdate = (_text: string) => {},
	} = $props();

	let textareaEl = $state<HTMLTextAreaElement>();
	let helpOpen = $state(false);

	// ── Syntax highlighting ──
	let highlightHtml = $derived(highlightFountain(content));

	function escapeHtml(text: string): string {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	}

	function highlightFountain(text: string): string {
		const lines = text.split('\n');
		const result: string[] = [];

		// Track whether previous line was blank for character detection
		let prevBlank = true;

		// Multi-line comment state (/* ... */)
		let inComment = false;

		for (let i = 0; i < lines.length; i++) {
			const raw = lines[i];
			const trimmed = raw.trim();

			// ── Multi-line comment ──
			if (inComment) {
				if (trimmed.includes('*/')) {
					const idx = raw.indexOf('*/');
					const before = raw.substring(0, idx + 2);
					const after = raw.substring(idx + 2);
					inComment = false;
					result.push(`<span class="sp-comment">${escapeHtml(before)}</span>${escapeHtml(after)}`);
				} else {
					result.push(`<span class="sp-comment">${escapeHtml(raw)}</span>`);
				}
				prevBlank = trimmed === '';
				continue;
			}
			if (/\/\*/.test(trimmed) && !/\*\/\s*$/.test(trimmed)) {
				inComment = true;
				result.push(`<span class="sp-comment">${escapeHtml(raw)}</span>`);
				prevBlank = trimmed === '';
				continue;
			}

			// ── Single line: classify ──
			let lineClass = '';
			const trimmedUpper = trimmed.toUpperCase();

			if (trimmed === '') {
				// Blank line — no highlighting
				lineClass = '';
				prevBlank = true;
			} else if (/^={3,}\s*$/.test(trimmed)) {
				// Page break
				lineClass = 'sp-page-break';
				prevBlank = true;
			} else if (/^\[/.test(trimmed) || /^\/\*/.test(trimmed)) {
				// Boneyard / comment line
				lineClass = 'sp-comment';
				prevBlank = false;
			} else if (/^(INT\.|EXT\.|INT\.\/EXT\.)/i.test(trimmed)) {
				// Scene heading
				lineClass = 'sp-scene-heading';
				prevBlank = false;
			} else if (/^\./.test(trimmed) && !/^\.\./.test(trimmed)) {
				// Forced scene heading (starts with .)
				lineClass = 'sp-scene-heading';
				prevBlank = false;
			} else if (/^>/.test(trimmed) && /<\s*$/.test(trimmed)) {
				// Centered text
				lineClass = 'sp-centered';
				prevBlank = false;
			} else if (/^>/.test(trimmed)) {
				// Transition > CUT TO:
				lineClass = 'sp-transition';
				prevBlank = false;
			} else if (/\bTO:\s*$/.test(trimmed) && trimmed === trimmedUpper && trimmed.length <= 30) {
				// Transition (CUT TO: etc.)
				lineClass = 'sp-transition';
				prevBlank = false;
			} else if (/^~/.test(trimmed)) {
				// Lyrics
				lineClass = 'sp-lyrics';
				prevBlank = false;
			} else if (/^\(/.test(trimmed)) {
				// Parenthetical
				lineClass = 'sp-parenthetical';
				prevBlank = false;
			} else if (
				prevBlank &&
				trimmed === trimmedUpper &&
				/[A-Z]{2,}/.test(trimmed) &&
				!/[a-z]/.test(trimmed)
			) {
				// Character (ALL CAPS after blank line)
				lineClass = 'sp-character';
				prevBlank = false;
			} else if (i === 0 && trimmed === trimmedUpper && /[A-Z]{2,}/.test(trimmed) && !/[a-z]/.test(trimmed)) {
				// First line, all caps — also could be a character
				lineClass = 'sp-character';
				prevBlank = false;
			} else if (/^(Title|Author|Source|Notes|Draft Date|Contact|Copyright):\s*/i.test(trimmed)) {
				// Title page key
				lineClass = 'sp-title-key';
				prevBlank = false;
			} else {
				// Action / dialogue (default)
				prevBlank = false;
			}

			if (lineClass) {
				result.push(`<span class="${lineClass}">${escapeHtml(raw)}</span>`);
			} else {
				result.push(escapeHtml(raw));
			}

			// Handle single-line /* ... */
			if (/\*\/\s*$/.test(trimmed) && /\/\*/.test(trimmed)) {
				inComment = false;
			}
		}

		return result.join('\n');
	}

	// ── Text insertion helpers ──
	function insertAround(before: string, after = '') {
		if (!textareaEl) return;
		const start = textareaEl.selectionStart;
		const end = textareaEl.selectionEnd;
		const selected = textareaEl.value.substring(start, end);
		const replacement = before + selected + after;
		const newValue = textareaEl.value.substring(0, start) + replacement + textareaEl.value.substring(end);
		textareaEl.value = newValue;
		textareaEl.selectionStart = Math.min(start + before.length, newValue.length);
		textareaEl.selectionEnd = textareaEl.selectionStart;
		textareaEl.focus();
		textareaEl.dispatchEvent(new Event('input', { bubbles: true }));
	}

	function needsBlankLineBefore(): boolean {
		if (!textareaEl) return false;
		const before = textareaEl.value.substring(0, textareaEl.selectionStart);
		return before.length > 0 && !before.endsWith('\n\n') && !before.endsWith('\n');
	}

	function insertSceneHeading() {
		if (!textareaEl) return;
		const pad = needsBlankLineBefore() ? '\n' : '';
		insertAround(pad + 'INT. LOCATION - DAY\n\n', '');
	}

	function insertCharacter() {
		if (!textareaEl) return;
		const start = textareaEl.selectionStart;
		const end = textareaEl.selectionEnd;
		const selected = textareaEl.value.substring(start, end).trim();
		const pad = needsBlankLineBefore() ? '\n' : '';
		if (selected) {
			insertAround(pad + selected.toUpperCase() + '\n', '');
		} else {
			insertAround(pad + 'CHARACTER NAME\n', '');
		}
	}

	function insertDialogue() {
		insertAround('\n\t', '\n');
	}

	function insertParenthetical() {
		insertAround('(', ')');
	}

	function insertTransition() {
		insertAround('\n> CUT TO:\n\n');
	}

	function insertPageBreak() {
		insertAround('\n===\n\n');
	}

	function handleInput() {
		if (textareaEl) {
			onUpdate(textareaEl.value);
		}
	}

	function lineCount(): number {
		if (!textareaEl) return 0;
		return textareaEl.value.split('\n').length;
	}

	function wordCount(): number {
		if (!textareaEl) return 0;
		return textareaEl.value.trim().split(/\s+/).filter(Boolean).length;
	}

	// Keep the highlight layer scrolled in sync with the textarea
	let highlightEl = $state<HTMLElement>();
	function onScroll() {
		if (highlightEl && textareaEl) {
			highlightEl.scrollTop = textareaEl.scrollTop;
			highlightEl.scrollLeft = textareaEl.scrollLeft;
		}
	}
</script>

<div class="fountain-editor">
	<!-- Toolbar -->
	<div class="panel-header flex flex-wrap items-center gap-1">
		<button onclick={insertSceneHeading} class="toolbar-btn" aria-label="Insert scene heading">SCENE</button>
		<button onclick={insertCharacter} class="toolbar-btn" aria-label="Insert character">CHAR.</button>
		<button onclick={insertDialogue} class="toolbar-btn" aria-label="Insert dialogue">DIAL.</button>
		<button onclick={insertParenthetical} class="toolbar-btn" aria-label="Insert parenthetical">( )</button>
		<button onclick={insertTransition} class="toolbar-btn" aria-label="Insert transition">TRANS.</button>
		<span class="toolbar-sep"></span>
		<button onclick={insertPageBreak} class="toolbar-btn" aria-label="Insert page break">PAGE BRK</button>
		<span class="toolbar-sep"></span>
		<button onclick={() => insertAround('Title: ', '\n')} class="toolbar-btn" aria-label="Insert title page title">TITLE</button>
		<button onclick={() => insertAround('Author: ', '\n')} class="toolbar-btn" aria-label="Insert title page author">AUTHOR</button>
		<span class="toolbar-sep"></span>
		<button onclick={() => (helpOpen = !helpOpen)} class="toolbar-btn" aria-label="Toggle Fountain syntax help">?</button>
	</div>

	<!-- Fountain syntax help panel -->
	{#if helpOpen}
		<div class="help-panel">
			<div class="help-grid">
				<div class="help-item"><code class="help-code">INT. LOCATION - DAY</code><span class="help-desc">Scene heading</span></div>
				<div class="help-item"><code class="help-code">.FORCED HEADING</code><span class="help-desc">Forced scene heading</span></div>
				<div class="help-item"><code class="help-code">CHARACTER NAME</code><span class="help-desc">Character (ALL CAPS, after blank line)</span></div>
				<div class="help-item"><code class="help-code">&lt;tab&gt;Dialogue text</code><span class="help-desc">Dialogue (indented)</span></div>
				<div class="help-item"><code class="help-code">(beat)</code><span class="help-desc">Parenthetical</span></div>
				<div class="help-item"><code class="help-code">&gt; CUT TO:</code><span class="help-desc">Transition</span></div>
				<div class="help-item"><code class="help-code">===</code><span class="help-desc">Page break</span></div>
				<div class="help-item"><code class="help-code">&gt;Center this&lt;</code><span class="help-desc">Centered text</span></div>
				<div class="help-item"><code class="help-code">~La la la...</code><span class="help-desc">Lyrics</span></div>
				<div class="help-item"><code class="help-code">/* boneyard */</code><span class="help-desc">Comment (not rendered)</span></div>
				<div class="help-item"><code class="help-code">Title: My Story</code><span class="help-desc">Title page key</span></div>
				<div class="help-item"><code class="help-code">Author: Name</code><span class="help-desc">Title page author</span></div>
			</div>
		</div>
	{/if}

	<!-- Editor body — textarea + highlight overlay -->
	<div class="editor-body">
		<div class="highlight-layer" bind:this={highlightEl}>
			{@html highlightHtml}<span class="sp-cursor-guard">&nbsp;</span>
		</div>
		<textarea
			bind:this={textareaEl}
			value={content}
			oninput={handleInput}
			onscroll={onScroll}
			class="editor-textarea"
			{placeholder}
			spellcheck="true"
		></textarea>
	</div>

	<!-- Footer stats -->
	<div class="footer-stats">
		<span class="stat">{lineCount()} lines</span>
		<span class="stat">{wordCount()} words</span>
	</div>
</div>

<style>
	/* ════════════════════════════════════════════
	   Fountain Editor with syntax highlighting
	   ════════════════════════════════════════════ */
	.fountain-editor {
		display: flex;
		flex: 1;
		min-height: 0;
		width: 100%;
		flex-direction: column;
	}

	/* ── Editor body: highlight + textarea stacked ── */
	.editor-body {
		position: relative;
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	/* ── Shared font settings (must match exactly) ── */
	.highlight-layer, .editor-textarea {
		font-family: 'Courier Prime', 'Courier New', Courier, monospace;
		font-size: 13px;
		line-height: 1.6;
		padding: 1rem;
		tab-size: 8;
		white-space: pre-wrap;
		overflow-wrap: break-word;
		word-wrap: break-word;
		word-break: break-word;
		letter-spacing: 0;
	}

	/* ── Highlight overlay (behind textarea) ──
	     overflow:hidden + scrollTop sync means the visible
	     portion of the highlighted text matches the textarea exactly. ── */
	.highlight-layer {
		position: absolute;
		inset: 0;
		margin: 0;
		border: 0;
		overflow: hidden;
		pointer-events: none;
		user-select: none;
		background: transparent;
	}

	/* ── Textarea (transparent text, visible caret) ── */
	.editor-textarea {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		resize: none;
		border: none;
		outline: none;
		background: transparent;
		color: transparent;
		caret-color: var(--text-strong);
		overflow: auto;
		scrollbar-width: thin;
	}

	.editor-textarea::placeholder {
		color: var(--text-dim);
		opacity: 0.7;
	}

	/* ── Syntax highlight colors ──
	     :global() needed because class names are generated by
	     the highlightFountain function at runtime via {@html} ── */
	:global(.sp-scene-heading)  { color: #2563eb; font-weight: 700; }
	:global(.sp-character)      { color: #15803d; font-weight: 700; }
	:global(.sp-parenthetical)  { color: #b45309; font-style: italic; }
	:global(.sp-dialogue)       { color: var(--text-base); }
	:global(.sp-transition)     { color: #7e22ce; font-weight: 700; }
	:global(.sp-comment)        { color: var(--text-dim); font-style: italic; }
	:global(.sp-page-break)     { color: #dc2626; font-weight: 700; }
	:global(.sp-title-key)      { color: var(--text-muted); font-weight: 600; }
	:global(.sp-centered)       { color: var(--text-muted); }
	:global(.sp-lyrics)         { color: var(--text-muted); font-style: italic; }
	:global(.sp-cursor-guard)   { user-select: none; }

	/* ── Dark theme overrides ── */
	:global([data-theme="dark"]) :global(.sp-scene-heading)  { color: #60a5fa; }
	:global([data-theme="dark"]) :global(.sp-character)      { color: #4ade80; }
	:global([data-theme="dark"]) :global(.sp-parenthetical)  { color: #fbbf24; }
	:global([data-theme="dark"]) :global(.sp-transition)     { color: #c084fc; }
	:global([data-theme="dark"]) :global(.sp-page-break)     { color: #f87171; }

	/* ── OLED theme (inherit from dark) ── */
	:global([data-theme="oled"]) :global(.sp-scene-heading)  { color: #60a5fa; }
	:global([data-theme="oled"]) :global(.sp-character)      { color: #4ade80; }
	:global([data-theme="oled"]) :global(.sp-parenthetical)  { color: #fbbf24; }
	:global([data-theme="oled"]) :global(.sp-transition)     { color: #c084fc; }
	:global([data-theme="oled"]) :global(.sp-page-break)     { color: #f87171; }

	/* ── Syntax help panel ── */
	.help-panel {
		border-bottom: 1px solid var(--border-base);
		padding: 0.5rem 0.75rem;
		background: var(--bg-base);
	}
	.help-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.25rem 1rem;
	}
	.help-item {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		font-size: 0.7rem;
		line-height: 1.6;
	}
	.help-code {
		font-family: 'Courier Prime', 'Courier New', Courier, monospace;
		font-size: 0.7rem;
		color: var(--text-strong);
		flex-shrink: 0;
	}
	.help-desc {
		color: var(--text-muted);
	}

	/* ── Footer ── */
	.footer-stats {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-top: 1px solid var(--border-base);
		padding: 0.5rem 1rem;
	}

	.stat {
		font-size: 0.75rem;
		color: var(--text-dim);
		font-family: 'Courier Prime', monospace;
	}
</style>
