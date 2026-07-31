import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { LifecycleEvent, WireEntry } from './types';
import { installWireCapture } from './wire-capture';

// Verified against node_modules/@inertiajs/core/types/types.d.ts (GlobalEventsMap), not
// copied from the spec as given. Two corrections against that spec:
// - 'cancel' is dropped: it is a key of GlobalEventsMap, so router.on('cancel', ...) type
//   checks, but grep of node_modules/@inertiajs/core/dist/index.js finds no
//   `fireCancelEvent` anywhere; nothing in this installed version ever fires it.
// - 'clientVisit' is added: `fireClientVisitEvent` is defined and called (client-side
//   visits such as router.push/replace), and the spec's list omitted it.
// Exported so a chapter teaching the event list (chapters/events.tsx) reads the same
// two constants the inspector renders from, rather than keeping a second copy that
// could drift from the one actually wired up here.
export const EVENTS = [
    'before',
    'start',
    'progress',
    'beforeUpdate',
    'success',
    'flash',
    'error',
    'httpException',
    'networkError',
    'finish',
    'navigate',
    'clientVisit',
    'location',
    'prefetching',
    'prefetched',
] as const;

// The only members whose `result` type in GlobalEventsMap is `boolean | void` rather than
// plain `void`: returning false from one of these is what can actually cancel something.
export const CANCELABLE = new Set([
    'before',
    'httpException',
    'networkError',
    'location',
]);

/**
 * Every visit's request/response and every router lifecycle event, captured once and
 * shared by the inspector's Wire, Lifecycle, Trace and Diagram tabs alike (they all key
 * off the same `entries` list, most recent first, or its head for "the latest visit").
 * Lifted out of the panel component itself so the capture installs exactly once per
 * chapter regardless of which tab is open or how many times the inspector re-renders.
 *
 * onEntry lets the host page keep its own history of entries (partial-reloads.tsx
 * compares payload sizes across several requests) without installing a second capture
 * on top of this one. Read through a ref, not a dependency, so a host passing a new
 * closure on every render never causes window.fetch/XMLHttpRequest to be patched and
 * unpatched again.
 */
export function useWireCapture(onEntry?: (entry: WireEntry) => void): {
    entries: WireEntry[];
    events: LifecycleEvent[];
} {
    const [entries, setEntries] = useState<WireEntry[]>([]);
    const [events, setEvents] = useState<LifecycleEvent[]>([]);
    const onEntryRef = useRef(onEntry);

    useEffect(() => {
        onEntryRef.current = onEntry;
    }, [onEntry]);

    useEffect(() => {
        return installWireCapture((entry) => {
            setEntries((all) => [entry, ...all].slice(0, 25));
            onEntryRef.current?.(entry);
        });
    }, []);

    useEffect(() => {
        let id = 0;
        const remove = EVENTS.map((name) =>
            router.on(name, () => {
                setEvents((all) =>
                    [
                        {
                            id: ++id,
                            name,
                            at: performance.now(),
                            cancelable: CANCELABLE.has(name),
                        },
                        ...all,
                    ].slice(0, 60),
                );
            }),
        );

        return () => remove.forEach((off) => off());
    }, []);

    return { entries, events };
}
