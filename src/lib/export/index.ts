import TurndownService from 'turndown';
import { jsPDF } from 'jspdf';
import { Fountain } from 'fountain-js';
import type { Story } from '$lib/domain/story';

const turndown = new TurndownService({
	headingStyle: 'atx',
	hr: '---',
	bulletListMarker: '-',
	codeBlockStyle: 'fenced',
});

function escapeHtml(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Sanitize a title for use as a filename */
function slugify(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60) || 'story';
}

// ── Markdown ──

/** Full story as Markdown */
export function storyToMarkdown(story: Story): string {
	const parts: string[] = [];

	parts.push(`# ${story.title}`);
	parts.push('');

	if (story.author) {
		parts.push(`**Author:** ${story.author}`);
		parts.push('');
	}
	if (story.logline) {
		parts.push(`> ${story.logline}`);
		parts.push('');
	}

	for (const act of story.acts) {
		parts.push(`## ${act.title}`);
		parts.push('');

		for (const scene of act.scenes) {
			const label = scene.title ? `: ${scene.title}` : '';
			parts.push(`### Scene ${scene.order + 1}${label}`);
			parts.push('');

			if (scene.summary) {
				parts.push(`*${scene.summary}*`);
				parts.push('');
			}
			if (scene.content) {
				parts.push(turndown.turndown(scene.content));
				parts.push('');
			}
		}

		parts.push('---');
		parts.push('');
	}

	return parts.join('\n');
}

/** Outline/preview as Markdown */
export function outlineToMarkdown(story: Story): string {
	const parts: string[] = [];

	parts.push(`# ${story.title} — Outline`);
	parts.push('');

	for (const act of story.acts) {
		parts.push(`## ${act.title}`);
		parts.push('');

		if (act.scenes.length === 0) {
			parts.push('*No scenes yet*');
			parts.push('');
		} else {
			for (const scene of act.scenes) {
				const title = scene.title ? ` — ${scene.title}` : '';
				parts.push(`- **Scene ${scene.order + 1}${title}**`);
				if (scene.summary) {
					parts.push(`  ${scene.summary}`);
				}
				parts.push('');
			}
		}
	}

	return parts.join('\n');
}

// ── Download helper ──

/** Download a string as a file */
export function downloadFile(content: string, filename: string, mimeType: string) {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// ── PDF helpers (direct jsPDF rendering — no html2canvas) ──

const PAGE_W = 8.5; // inches
const PAGE_H = 11;
const MARGIN = 1;     // page margin for story/outline PDFs
const CONTENT_W = PAGE_W - MARGIN * 2; // 6.5 in

function addWrappedText(doc: jsPDF, text: string, x: number, y: number, maxW: number, opts?: { fontSize?: number; fontStyle?: 'normal' | 'italic'; align?: 'left' | 'center' | 'right' }): number {
	const size = opts?.fontSize || 12;
	const style = opts?.fontStyle || 'normal';
	const align = opts?.align || 'left';
	doc.setFontSize(size);
	doc.setFont('Helvetica', style);

	// Split to fit width (doc unit is inches)
	const maxWInches = maxW;
	const lines = doc.splitTextToSize(text, maxWInches);

	const lineH = size * 1.4 / 72; // in inches per line
	for (const line of lines) {
		if (y + lineH > PAGE_H - MARGIN) {
			doc.addPage();
			y = MARGIN;
		}
		let xPos = x;
		if (align === 'center') xPos = PAGE_W / 2;
		else if (align === 'right') xPos = PAGE_W - MARGIN;

		doc.text(line, xPos, y, { align });
		y += lineH;
	}
	return y;
}

/** Draw a horizontal line separator */
function addHR(doc: jsPDF, y: number): number {
	if (y + 0.3 > PAGE_H - MARGIN) {
		doc.addPage();
		y = MARGIN;
	}
	y += 0.1;
	doc.setDrawColor(180, 180, 180);
	doc.setLineWidth(0.01);
	doc.line(MARGIN, y, PAGE_W - MARGIN, y);
	return y + 0.2;
}

function addBlankLine(doc: jsPDF, y: number, spacing = 0.22): number {
	if (y + spacing > PAGE_H - MARGIN) {
		doc.addPage();
		return MARGIN;
	}
	return y + spacing;
}

// ── Story PDF ──

function buildStoryText(story: Story): string {
	const parts: string[] = [];

	parts.push(`# ${story.title}`);

	if (story.author) parts.push(`Author: ${story.author}`);
	if (story.logline) parts.push(`> ${story.logline}`);

	for (const act of story.acts) {
		parts.push(`\n## ${act.title}`);
		if (act.scenes.length === 0) {
			parts.push('No scenes yet.');
		} else {
			for (const scene of act.scenes) {
				const label = scene.title ? `: ${scene.title}` : '';
				parts.push(`\nScene ${scene.order + 1}${label}`);
				if (scene.summary) parts.push(scene.summary);
				if (scene.content) {
					parts.push(turndown.turndown(scene.content));
				}
			}
		}
		parts.push('---');
	}

	return parts.join('\n\n');
}

function renderStoryToPDF(story: Story): jsPDF {
	const doc = new jsPDF({ unit: 'in', format: 'letter' });
	let y = MARGIN;

	// Title
	y = addWrappedText(doc, story.title, MARGIN, y, CONTENT_W, { fontSize: 22, fontStyle: 'bold' });
	y = addBlankLine(doc, y, 0.15);

	if (story.author) {
		y = addWrappedText(doc, `Author: ${story.author}`, MARGIN, y, CONTENT_W, { fontSize: 11, fontStyle: 'italic' });
		y = addBlankLine(doc, y, 0.1);
	}
	if (story.logline) {
		y = addWrappedText(doc, story.logline, MARGIN + 0.2, y, CONTENT_W - 0.4, { fontSize: 11, fontStyle: 'italic' });
		y = addBlankLine(doc, y, 0.15);
	}

	for (const act of story.acts) {
		y = addBlankLine(doc, y, 0.15);
		y = addWrappedText(doc, act.title, MARGIN, y, CONTENT_W, { fontSize: 16, fontStyle: 'bold' });

		// Underline act title
		doc.setDrawColor(180, 180, 180);
		doc.setLineWidth(0.01);
		doc.line(MARGIN, y - 0.04, PAGE_W - MARGIN, y - 0.04);

		y = addBlankLine(doc, y, 0.1);

		if (act.scenes.length === 0) {
			y = addWrappedText(doc, 'No scenes yet.', MARGIN, y, CONTENT_W, { fontSize: 11, fontStyle: 'italic' });
		} else {
			for (const scene of act.scenes) {
				const label = scene.title ? `: ${scene.title}` : '';
				y = addWrappedText(doc, `Scene ${scene.order + 1}${label}`, MARGIN, y, CONTENT_W, { fontSize: 12, fontStyle: 'bold' });

				if (scene.summary) {
					y = addWrappedText(doc, scene.summary, MARGIN + 0.2, y, CONTENT_W - 0.2, { fontSize: 11, fontStyle: 'italic' });
				}
				if (scene.content) {
					const md = turndown.turndown(scene.content);
					y = addWrappedText(doc, md, MARGIN + 0.2, y, CONTENT_W - 0.2, { fontSize: 10 });
				}
				y = addBlankLine(doc, y, 0.1);
			}
		}

		y = addHR(doc, y);
	}

	return doc;
}

// ── Outline PDF ──

function renderOutlineToPDF(story: Story): jsPDF {
	const doc = new jsPDF({ unit: 'in', format: 'letter' });
	let y = MARGIN;

	y = addWrappedText(doc, `${story.title} — Outline`, MARGIN, y, CONTENT_W, { fontSize: 18, fontStyle: 'bold' });
	y = addBlankLine(doc, y, 0.2);

	for (const act of story.acts) {
		y = addWrappedText(doc, act.title, MARGIN, y, CONTENT_W, { fontSize: 14, fontStyle: 'bold' });
		y = addBlankLine(doc, y, 0.1);

		if (act.scenes.length === 0) {
			y = addWrappedText(doc, 'No scenes yet.', MARGIN + 0.2, y, CONTENT_W - 0.2, { fontSize: 11, fontStyle: 'italic' });
		} else {
			for (const scene of act.scenes) {
				const title = scene.title ? ` — ${scene.title}` : '';
				y = addWrappedText(doc, `Scene ${scene.order + 1}${title}`, MARGIN + 0.2, y, CONTENT_W - 0.2, { fontSize: 11, fontStyle: 'bold' });
				if (scene.summary) {
					y = addWrappedText(doc, scene.summary, MARGIN + 0.4, y, CONTENT_W - 0.4, { fontSize: 10, fontStyle: 'italic' });
				}
				y = addBlankLine(doc, y, 0.08);
			}
		}

		y = addHR(doc, y);
	}

	return doc;
}

// ── High-level export actions ──

export function exportStoryMarkdown(story: Story) {
	const md = storyToMarkdown(story);
	const filename = `${slugify(story.title)}.md`;
	downloadFile(md, filename, 'text/markdown;charset=utf-8');
}

export function exportStoryPDF(story: Story) {
	const doc = renderStoryToPDF(story);
	doc.save(`${slugify(story.title)}.pdf`);
}

export function exportOutlineMarkdown(story: Story) {
	const md = outlineToMarkdown(story);
	const filename = `${slugify(story.title)}-outline.md`;
	downloadFile(md, filename, 'text/markdown;charset=utf-8');
}

export function exportOutlinePDF(story: Story) {
	const doc = renderOutlineToPDF(story);
	doc.save(`${slugify(story.title)}-outline.pdf`);
}

export function exportScreenplayPDF(fountainText: string, storyTitle: string): void {
	// Opens a new window with the formatted screenplay and triggers
	// the print dialog, where the user selects "Save as PDF".
	const fountain = new Fountain();
	const result = fountain.parse(fountainText.trim());
	const scriptHtml = result.html.script || '';
	const titlePageHtml = result.html.title_page || '';

	const titleSection = titlePageHtml
		? `<div class="page title-page">${titlePageHtml}</div>`
		: '';

	// Split script into individual page sections (fountain-js uses <hr> for === page breaks)
	const scriptParts = scriptHtml.trim()
		? scriptHtml.split(/<hr\b[^>]*>/i).filter(p => p.trim())
		: [];
	const scriptPages = scriptParts.map(part =>
		`<div class="page"><div class="fountain-content"><div class="script">${part.trim()}</div></div></div>`
	).join('\n');

	const contentHtml = titleSection + (scriptPages ? '\n' + scriptPages : '');

	const printCSS = `
@page { size: letter; margin: 1in 1in 1in 1.5in; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #fff; color: #000; font-family: 'Courier Prime', 'Courier New', Courier, monospace; }

/* Each .page is exactly the content height (9in = 11in page - 1in margins × 2).
   Since it fills the content area perfectly, the browser naturally puts each
   .page on its own page without needing page-break-after. No blank pages. */
.page { min-height: 9in; }

.title-page {
	display: flex; flex-direction: column; align-items: center; justify-content: center;
	text-align: center;
}
.title-page h1 { font-size: 16px; font-weight: 700; margin: 0 0 0.5em; text-transform: uppercase; }
.title-page p { font-size: 12px; margin: 0.25em 0; }
.title-page .authors { font-size: 14px; font-weight: 700; }
.script { font-size: 12px; line-height: 1.25; }
.script h3 { font-weight: 700; text-transform: uppercase; text-decoration: underline; text-underline-offset: 2px; margin: 1.5em 0 1em 0; }
.script h2 { font-weight: 700; text-transform: uppercase; margin: 1.5em 0; margin-left: 2.5in; text-align: right; }
.script .dialogue { margin: 0 0 1em 1in; max-width: 3.5in; }
.script .dialogue h4 { font-weight: 700; text-transform: uppercase; margin: 1.2em 0 0.1em 1.2in; }
.script .dialogue .parenthetical { margin: 0.2em 0 0.2em 0.75in; }
.script .dialogue p { margin: 0 0 0.3em 0; }
.script p { margin: 0 0 0.3em 0; }
.script .centered { text-align: center; margin: 1.5em 0; }
.script .lyrics { margin: 0.3em 0 0.3em 1.5in; padding: 0 0 0 0.2in; font-style: italic; border-left: 2px solid #ccc; }
`;

	const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(storyTitle)} — Screenplay</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<style>${printCSS}</style>
</head>
<body>
${contentHtml}
</body>
</html>`;

	const printWindow = window.open('', '_blank');
	if (!printWindow) {
		throw new Error('Popup blocked. Please allow popups to export the screenplay.');
	}

	printWindow.document.write(fullHtml);
	printWindow.document.close();

	// Wait for fonts and layout, then trigger print
	printWindow.onload = () => {
		printWindow.document.fonts.ready.then(() => {
			setTimeout(() => {
				printWindow.focus();
				printWindow.print();
			}, 300);
		});
	};
	setTimeout(() => {
		printWindow.focus();
		printWindow.print();
	}, 2000);
}
