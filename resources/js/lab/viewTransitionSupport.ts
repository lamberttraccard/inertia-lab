// Shared by the view-transitions chapter's index and detail pages, so the browser check
// backing what each one displays cannot drift into two different expressions.
//
// Guards a server-side render (Inertia SSR is enabled in config/inertia.php): there is no
// document in that environment, the same guard resources/js/lab/wire-capture.ts already
// uses for the same reason. The browser's own support for the API never changes once the
// page has loaded, so this is a plain function call read directly during render rather
// than a state-plus-effect pair that would only ever run once anyway.
export function supportsViewTransitions(): boolean {
    return typeof document !== 'undefined' && 'startViewTransition' in document;
}
