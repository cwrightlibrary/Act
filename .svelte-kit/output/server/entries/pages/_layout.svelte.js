import { L as attr, T as writable, i as head, o as store_get, s as unsubscribe_stores } from "../../chunks/dev.js";
import "../../chunks/index-server2.js";
//#region src/lib/assets/favicon.svg
var favicon_default = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='24'%20height='24'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='currentColor'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3e%3cpolyline%20points='2%2022%206%2011%2010%2018%2014%207%2018%2016%2022%2022'%20/%3e%3c/svg%3e";
writable(null);
writable(true);
/** Theme — cycles through light, dark, oled */
var theme = writable("light");
//#endregion
//#region src/routes/+layout.svelte
function _layout($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { children } = $$props;
		function nextThemeLabel(t) {
			return {
				light: "Switch to dark",
				dark: "Switch to OLED",
				oled: "Switch to light"
			}[t];
		}
		head("12qhfyh", $$renderer, ($$renderer) => {
			$$renderer.push(`<link rel="icon"${attr("href", favicon_default)}/>`);
		});
		$$renderer.push(`<div class="flex min-h-dvh flex-col"><a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-sm focus:px-3 focus:py-1.5 focus:text-sm focus:font-semibold" style="color: var(--control-text); background: var(--control-bg);">Skip to main content</a> <header class="flex h-12 items-center justify-center border-b" style="border-color: var(--border-strong); background: var(--bg-front);"><div class="flex w-full items-center justify-between px-2"><a href="/" class="flex items-center gap-2 no-underline" style="color: var(--text-strong);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="2 20 6 9 10 16 14 5 18 14 22 20"></polyline></svg> <span class="text-base font-bold" style="letter-spacing: -0.02em;">Act</span></a> <div class="flex items-center gap-4"><button class="btn-ghost flex h-7 w-7 items-center justify-center rounded-sm p-0 text-sm"${attr("aria-label", nextThemeLabel(store_get($$store_subs ??= {}, "$theme", theme)))}>`);
		if (store_get($$store_subs ??= {}, "$theme", theme) === "light") {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M12.5 9a5.5 5.5 0 0 1-6.5-6.5A5.5 5.5 0 1 0 12.5 9Z"></path></svg>`);
		} else if (store_get($$store_subs ??= {}, "$theme", theme) === "dark") {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" aria-hidden="true"><path d="M12.5 9a5.5 5.5 0 0 1-6.5-6.5A5.5 5.5 0 1 0 12.5 9Z"></path><circle cx="9.5" cy="4.5" r="0.8" fill="currentColor" stroke="none"></circle></svg>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="7.5" cy="7.5" r="3"></circle><line x1="7.5" y1="0.5" x2="7.5" y2="2.5"></line><line x1="7.5" y1="12.5" x2="7.5" y2="14.5"></line><line x1="0.5" y1="7.5" x2="2.5" y2="7.5"></line><line x1="12.5" y1="7.5" x2="14.5" y2="7.5"></line><line x1="2.5" y1="2.5" x2="4" y2="4"></line><line x1="11" y1="11" x2="12.5" y2="12.5"></line><line x1="11" y1="4" x2="12.5" y2="2.5"></line><line x1="4" y1="11" x2="2.5" y2="12.5"></line></svg>`);
		}
		$$renderer.push(`<!--]--></button></div></div></header> <main id="main-content" class="flex-1" style="background: var(--bg-back); background-image: radial-gradient(var(--grid-dot) 1px, transparent 1px); background-size: var(--grid-size) var(--grid-size);">`);
		children($$renderer);
		$$renderer.push(`<!----></main></div>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
//#endregion
export { _layout as default };
