<script lang="ts">
	import { Fountain } from 'fountain-js';

	let {
		content = '',
	} = $props();

	let fountain = $state(new Fountain());
	let html = $state('');
	let titlePageHtml = $state('');
	let error = $state<string | null>(null);
	let isParsing = $state(false);

	$effect(() => {
		const currentContent = content;
		isParsing = true;
		error = null;

		const timer = setTimeout(() => {
			try {
				const trimmed = currentContent.trim();
				if (!trimmed) {
					html = '';
					titlePageHtml = '';
					error = null;
					return;
				}
				const result = fountain.parse(trimmed);
				titlePageHtml = result.html.title_page || '';
				html = result.html.script || '';
				error = null;
			} catch (e) {
				html = '';
				titlePageHtml = '';
				error = e instanceof Error ? e.message : 'Invalid Fountain syntax';
			} finally {
				isParsing = false;
			}
		}, 400);
		return () => {
			clearTimeout(timer);
			isParsing = false;
		};
	});
</script>

<div class="fountain-page">
	{#if isParsing}
		<div class="spinner"></div>
	{/if}
	<div class="fountain-content">
		{#if error}
			<div class="error-banner" role="alert">
				⚠ {error}
			</div>
		{:else if titlePageHtml || html}
			{#if titlePageHtml}
				<div class="title-page-preview">
					{@html titlePageHtml}
				</div>
			{/if}
			{#if html}
				<div class="script">
					{@html html}
				</div>
			{/if}
		{:else}
			<p class="empty-state">Write Fountain on the left to see your formatted screenplay preview here.</p>
		{/if}
	</div>
</div>

<style>
	/* ════════════════════════════════════════════
	   Screenplay Page — US Letter proportions
	   ════════════════════════════════════════════ */
	.fountain-page {
		position: relative;
		min-height: 100%;
		padding: 0.5in 0;
		background: #fff;
		color: #000;
	}

	/* Page margins: 1.5" left, 1" right — scales down on narrow containers */
	.fountain-content {
		max-width: 8.5in;
		width: 100%;
		margin: 0 auto;
		padding: 0 min(1in, 10%) 0 min(1.5in, 15%);
		box-sizing: border-box;
		overflow-wrap: break-word;
	}

	/* Script wrapper base font */
	.fountain-content .script {
		font-family: 'Courier Prime', 'Courier New', Courier, monospace;
		font-size: 12px;
		line-height: 1.25;
		color: #000;
		overflow-wrap: break-word;
		word-break: break-word;
	}

	.fountain-content .empty-state {
		color: #999;
		font-style: italic;
		font-size: 12px;
		margin: 2in 0 0 0;
		padding: 0;
		text-align: center;
	}

	/* ════════════════════════════════════════════
	   Loading spinner — subtle pulse during parse
	   ════════════════════════════════════════════ */
	.spinner {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #888;
		opacity: 0.6;
		animation: pulse 0.6s ease-in-out infinite alternate;
		pointer-events: none;
	}

	@keyframes pulse {
		from { opacity: 0.2; }
		to   { opacity: 0.8; }
	}

	/* ════════════════════════════════════════════
	   Error banner — inline parse error
	   ════════════════════════════════════════════ */
	.error-banner {
		font-family: 'Courier Prime', 'Courier New', Courier, monospace;
		font-size: 11px;
		color: #c00;
		background: #fff0f0;
		border: 1px solid #fcc;
		border-radius: 4px;
		padding: 8px 12px;
		margin-top: 1in;
		text-align: center;
	}

	/* ════════════════════════════════════════════
	   Scene Heading — ALL CAPS, underlined
	   Starts at left margin (1.5" from page edge)
	   ════════════════════════════════════════════ */
	.fountain-content :global(h3) {
		font-family: 'Courier Prime', 'Courier New', Courier, monospace;
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		text-decoration: underline;
		text-underline-offset: 2px;
		margin: 1.5em 0 1em 0;
		padding: 0;
		color: #000;
	}

	/* ════════════════════════════════════════════
	   Transition — right-aligned, ALL CAPS
	   ════════════════════════════════════════════ */
	.fountain-content :global(h2) {
		font-family: 'Courier Prime', 'Courier New', Courier, monospace;
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		margin: 1.5em 0;
		padding: 0;
		margin-left: 2.5in;
		text-align: right;
		color: #000;
	}

	/* ════════════════════════════════════════════
	   Dialogue block
	   Indented 1in from content edge
	   → dialogue starts at 2.5" from page edge
	   ════════════════════════════════════════════ */
	.fountain-content :global(.dialogue) {
		margin: 0 0 1em 1in;
		max-width: 3.5in;
		width: 100%;
		box-sizing: border-box;
	}

	/* When the container is narrower than ~4.5in, scale the indent down */
	@media (max-width: 600px) {
		.fountain-content :global(.dialogue) {
			margin: 0 0 1em 0.5in;
		}
		.fountain-content :global(.dialogue h4) {
			margin-left: 0.6in;
		}
		.fountain-content :global(.dialogue .parenthetical) {
			margin-left: 0.4in;
		}
		.fountain-content :global(h2) {
			margin-left: 1.5in;
		}
		.fountain-content :global(.lyrics) {
			margin-left: 0.75in;
		}
	}

	/* ── Character inside dialogue ──
	     Positioned at ~3.7" from page edge
	     (1.5" page margin + 1" dialog indent + 1.2" offset) */
	.fountain-content :global(.dialogue h4) {
		font-family: 'Courier Prime', 'Courier New', Courier, monospace;
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		margin: 1.2em 0 0.1em 1.2in;
		padding: 0;
		color: #000;
	}

	/* ── Parenthetical inside dialogue ──
	     Sits between character & dialogue, slightly indented */
	.fountain-content :global(.dialogue .parenthetical) {
		font-family: 'Courier Prime', 'Courier New', Courier, monospace;
		font-size: 12px;
		margin: 0.2em 0 0.2em 0.75in;
		padding: 0;
		width: 2.5in;
		font-style: normal;
		color: #000;
	}

	/* ── Dialogue lines inside .dialogue ──
	     No extra indent — starts at block margin (2.5" from page edge) */
	.fountain-content :global(.dialogue p) {
		font-family: 'Courier Prime', 'Courier New', Courier, monospace;
		font-size: 12px;
		line-height: 1.25;
		margin: 0 0 0.3em 0;
		padding: 0;
		color: #000;
		overflow-wrap: break-word;
		word-break: break-word;
	}

	/* ── Override for parenthetical ps — don't double-apply dialogue margins */
	.fountain-content :global(.dialogue p.parenthetical) {
		margin: 0.2em 0 0.2em 0.75in;
	}

	/* ════════════════════════════════════════════
	   Action — full width from content edge
	   ════════════════════════════════════════════ */
	.fountain-content :global(p) {
		font-family: 'Courier Prime', 'Courier New', Courier, monospace;
		font-size: 12px;
		line-height: 1.25;
		margin: 0 0 0.3em 0;
		padding: 0;
		color: #000;
		overflow-wrap: break-word;
		word-break: break-word;
	}

	/* ── Centered text ( > text < ) ── */
	.fountain-content :global(.centered) {
		font-family: 'Courier Prime', 'Courier New', Courier, monospace;
		font-size: 12px;
		text-align: center;
		margin: 1.5em 0;
		width: 100%;
		color: #000;
	}

	/* ── Lyrics ── */
	.fountain-content :global(.lyrics) {
		font-family: 'Courier Prime', 'Courier New', Courier, monospace;
		font-size: 12px;
		margin: 0.3em 0 0.3em 1.5in;
		padding: 0 0 0 0.2in;
		font-style: italic;
		border-left: 2px solid #ccc;
		color: #000;
	}

	/* ── Page break inside script ── */
	.fountain-content :global(hr) {
		border: none;
		border-top: 1px dashed #888;
		margin: 2em 0;
	}

	/* ════════════════════════════════════════════
	   Title Page Preview — centered on its own page
	   ════════════════════════════════════════════ */
	.title-page-preview {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 80vh;
		padding: 1in 0;
		text-align: center;
		border-bottom: 1px dashed #bbb;
		margin-bottom: 1.5em;
	}

	.title-page-preview :global(h1) {
		font-family: 'Courier Prime', 'Courier New', Courier, monospace;
		font-size: 20px;
		font-weight: 700;
		text-transform: uppercase;
		margin: 0 0 0.4in 0;
		padding: 0;
		color: #000;
		letter-spacing: 0.02em;
	}

	.title-page-preview :global(.credit) {
		font-family: 'Courier Prime', 'Courier New', Courier, monospace;
		font-size: 12px;
		margin: 0 0 0.2in 0;
		padding: 0;
		color: #000;
	}

	.title-page-preview :global(.authors) {
		font-family: 'Courier Prime', 'Courier New', Courier, monospace;
		font-size: 14px;
		font-weight: 700;
		margin: 0 0 0.3in 0;
		padding: 0;
		color: #000;
	}

	.title-page-preview :global(.source),
	.title-page-preview :global(.date),
	.title-page-preview :global(.contact),
	.title-page-preview :global(p) {
		font-family: 'Courier Prime', 'Courier New', Courier, monospace;
		font-size: 12px;
		margin: 0.15in 0;
		padding: 0;
		color: #000;
	}
</style>
