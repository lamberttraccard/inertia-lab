import { useSyncExternalStore } from 'react';

// This application's own chapter on useRemember teaches that it persists in history
// state: gone once the entry it lives on is gone, never surviving a closed tab or a new
// session (chapters/remembering-state.tsx). Which chapters a reader has already seen
// needs the opposite lifetime, so this reaches for localStorage instead. An app about
// state would be an odd place to reach for the wrong tool for that.
const STORAGE_KEY = 'inertia-lab:visited-chapters';
const CHANGE_EVENT = 'inertia-lab:visited-chapters-changed';

// One shared, empty instance for every server render and for the client's snapshot
// before localStorage has been read even once: useSyncExternalStore compares snapshots
// with Object.is, so returning the same reference every time nothing has changed is
// what keeps this from looking like a store that never settles.
const EMPTY: ReadonlySet<string> = new Set();

let cachedRaw: string | null = null;
let cachedVisited: ReadonlySet<string> = EMPTY;

function parse(raw: string | null): ReadonlySet<string> {
    if (raw === null) {
        return EMPTY;
    }

    try {
        const parsed: unknown = JSON.parse(raw);

        return Array.isArray(parsed)
            ? new Set(
                  parsed.filter(
                      (slug): slug is string => typeof slug === 'string',
                  ),
              )
            : EMPTY;
    } catch {
        // A disabled or unavailable storage value (private browsing, corrupted data)
        // should not break the page: it reads back as nothing visited yet, which is
        // honest rather than silently wrong.
        return EMPTY;
    }
}

// Cached on the raw string, not recomputed on every call: useSyncExternalStore invokes
// this on every render (and after every subscription notification) to check for
// tearing, so a fresh Set built from unchanged data would make the store look like it
// never stops changing.
function getSnapshot(): ReadonlySet<string> {
    let raw: string | null;

    try {
        raw = window.localStorage.getItem(STORAGE_KEY);
    } catch {
        raw = null;
    }

    if (raw !== cachedRaw) {
        cachedRaw = raw;
        cachedVisited = parse(raw);
    }

    return cachedVisited;
}

function getServerSnapshot(): ReadonlySet<string> {
    return EMPTY;
}

function subscribe(onStoreChange: () => void): () => void {
    // Same-tab writers never see the native `storage` event (it only fires in other
    // tabs), so markChapterVisited also dispatches CHANGE_EVENT itself: that is what
    // lets the home page's own counts update the moment a visit completes, in the same
    // tab, rather than only after some other tab's write or a future reload.
    window.addEventListener(CHANGE_EVENT, onStoreChange);
    window.addEventListener('storage', onStoreChange);

    return () => {
        window.removeEventListener(CHANGE_EVENT, onStoreChange);
        window.removeEventListener('storage', onStoreChange);
    };
}

export function markChapterVisited(slug: string): void {
    const current = getSnapshot();

    if (current.has(slug)) {
        return;
    }

    const next = new Set(current);
    next.add(slug);

    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    } catch {
        return;
    }

    cachedRaw = window.localStorage.getItem(STORAGE_KEY);
    cachedVisited = next;
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/**
 * The set of chapter slugs this browser has already opened, backed by localStorage
 * through useSyncExternalStore: the server snapshot is always empty, so a server-
 * rendered page and the client's first paint never disagree over data that only exists
 * in the browser, and React itself (not a manually-timed effect) reconciles the real
 * value in immediately after.
 */
export function useVisitedChapters(): ReadonlySet<string> {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
