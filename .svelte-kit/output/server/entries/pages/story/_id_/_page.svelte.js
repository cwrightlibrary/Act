import "../../../../chunks/index-server.js";
import { s as unsubscribe_stores } from "../../../../chunks/dev.js";
import "../../../../chunks/client.js";
import "../../../../chunks/db.js";
import "@tiptap/starter-kit";
import "@tiptap/extension-placeholder";
import "@tiptap/extension-underline";
//#region src/routes/story/[id]/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<div class="flex items-center justify-center py-16" style="background: var(--bg-back);" aria-live="polite"><div class="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" style="border-color: var(--border-base); border-top-color: var(--text-muted);"></div></div>`);
		$$renderer.push(`<!--]-->`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
//#endregion
export { _page as default };
