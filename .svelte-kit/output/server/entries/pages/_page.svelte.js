import "../../chunks/index-server.js";
import "../../chunks/dev.js";
import "../../chunks/db.js";
//#region src/routes/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		$$renderer.push(`<div class="mx-auto max-w-4xl px-6 py-8"><div class="rounded-sm border" style="background: var(--bg-base); border-color: var(--border-strong);"><div class="flex items-center justify-between border-b px-5 py-3" style="border-color: var(--border-strong); background: var(--bg-front);"><h1 style="color: var(--text-strong);">My Stories</h1> <button class="sidebar-action-btn rounded-sm px-3 py-1.5 text-sm">New Story</button></div> <div class="px-5 py-4">`);
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<div class="flex items-center justify-center py-12" aria-live="polite"><div class="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" style="border-color: var(--border-base); border-top-color: var(--text-muted);"></div></div>`);
		$$renderer.push(`<!--]--></div></div></div>`);
	});
}
//#endregion
export { _page as default };
