import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { LifecycleEvent, WireEntry } from './types';
import { installWireCapture, readInitialTrace } from './wire-capture';

// Verified against node_modules/@inertiajs/core/types/types.d.ts (GlobalEventsMap), not
// copied from the spec as given. Two corrections against that spec:
// - 'cancel' is dropped: it is a key of GlobalEventsMap, so router.on('cancel', ...) type
//   checks, but grep of node_modules/@inertiajs/core/dist/index.js finds no
//   `fireCancelEvent` anywhere; nothing in this installed version ever fires it.
// - 'clientVisit' is added: `fireClientVisitEvent` is defined and called (client-side
//   visits such as router.push/replace), and the spec's list omitted it.
const EVENTS = [
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
const CANCELABLE = new Set([
    'before',
    'httpException',
    'networkError',
    'location',
]);

type WireStripProps = {
    // Lets a host page observe the latest entry too (used to drive the round-trip
    // diagram before the chapter shell exists to lift this state properly).
    onEntry?: (entry: WireEntry) => void;
};

export function WireStrip({ onEntry }: WireStripProps) {
    const [entries, setEntries] = useState<WireEntry[]>([]);
    const [events, setEvents] = useState<LifecycleEvent[]>([]);
    const [tab, setTab] = useState<'wire' | 'lifecycle'>('wire');
    const initialTrace = readInitialTrace();

    // Synced through its own effect rather than written during render (React forbids
    // mutating a ref mid-render): kept out of the capture effect's dependency array so
    // that effect installs once instead of repeatedly patching and unpatching
    // window.fetch and XMLHttpRequest on every onEntry identity change.
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

    const trace = entries[0]?.trace ?? initialTrace;

    return (
        <section
            aria-label="Wire"
            className="fixed inset-x-0 bottom-0 z-50 max-h-[40vh] overflow-y-auto border-t border-neutral-200 bg-white/95 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950/95 dark:text-neutral-100"
        >
            <nav className="flex gap-2 border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
                <button
                    type="button"
                    onClick={() => setTab('wire')}
                    aria-pressed={tab === 'wire'}
                    className={
                        tab === 'wire'
                            ? 'font-semibold underline'
                            : 'text-neutral-500'
                    }
                >
                    Wire
                </button>
                <button
                    type="button"
                    onClick={() => setTab('lifecycle')}
                    aria-pressed={tab === 'lifecycle'}
                    className={
                        tab === 'lifecycle'
                            ? 'font-semibold underline'
                            : 'text-neutral-500'
                    }
                >
                    Lifecycle
                </button>
            </nav>

            {/* This is the failure rule from the spec, in code: a missing trace and a
                disabled recorder both say so out loud. Neither ever falls through to an
                empty panel, which would read as "nothing happened" and teach something
                false. */}
            {trace && !trace.enabled && (
                <p
                    role="status"
                    className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
                >
                    {trace.reason}
                </p>
            )}

            {!trace && (
                <p
                    role="status"
                    className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
                >
                    No trace found on this page. The lab middleware did not run,
                    so prop resolution cannot be shown.
                </p>
            )}

            {tab === 'wire' ? (
                <ol className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {entries.length === 0 && (
                        <li className="px-3 py-2 text-neutral-500">
                            No Inertia visit yet. Follow a link to record one.
                        </li>
                    )}
                    {entries.map((entry) => (
                        <li key={entry.id} className="px-3 py-2">
                            <p className="flex flex-wrap items-baseline gap-x-2 font-mono break-all">
                                <span className="font-semibold">
                                    {entry.method}
                                </span>
                                <span>{entry.url}</span>
                                <span>{entry.status}</span>
                                <span>{entry.durationMs} ms</span>
                                <span>{entry.bytes} bytes</span>
                            </p>
                            <dl className="mt-1 grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                                {Object.entries(entry.requestHeaders).map(
                                    ([key, value]) => (
                                        <div
                                            key={`request-${key}`}
                                            className="flex gap-1 break-all"
                                        >
                                            <dt className="text-neutral-500">
                                                request {key}
                                            </dt>
                                            <dd>{value}</dd>
                                        </div>
                                    ),
                                )}
                                {Object.entries(entry.responseHeaders).map(
                                    ([key, value]) => (
                                        <div
                                            key={`response-${key}`}
                                            className="flex gap-1 break-all"
                                        >
                                            <dt className="text-neutral-500">
                                                response {key}
                                            </dt>
                                            <dd>{value}</dd>
                                        </div>
                                    ),
                                )}
                            </dl>
                            {entry.trace?.enabled && (
                                <div className="mt-1">
                                    <p className="text-neutral-500">
                                        Resolved on the server
                                    </p>
                                    <ul>
                                        {Object.entries(entry.trace.props).map(
                                            ([key, prop]) => (
                                                <li key={key}>
                                                    {key} ({prop.type}){' '}
                                                    {prop.ms} ms
                                                    {prop.delayMs > 0
                                                        ? ` including ${prop.delayMs} ms of slow mode`
                                                        : ''}
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                    <p className="text-neutral-500">
                                        Skipped by the server
                                    </p>
                                    <ul>
                                        {Object.entries(
                                            entry.trace.skipped,
                                        ).map(([key, prop]) => (
                                            <li key={key}>
                                                {key} ({prop.type}):{' '}
                                                {prop.reason}.{' '}
                                                {prop.explanation}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <details className="mt-1">
                                <summary className="cursor-pointer text-neutral-500">
                                    Page object
                                </summary>
                                <pre className="mt-1 max-w-full overflow-x-auto text-wrap break-all whitespace-pre-wrap">
                                    {JSON.stringify(entry.page, null, 2)}
                                </pre>
                            </details>
                        </li>
                    ))}
                </ol>
            ) : (
                <ol className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {events.length === 0 && (
                        <li className="px-3 py-2 text-neutral-500">
                            No lifecycle event yet.
                        </li>
                    )}
                    {events.map((event) => (
                        <li
                            key={event.id}
                            className="flex justify-between gap-2 px-3 py-1"
                        >
                            <span>
                                {event.name}
                                {event.cancelable ? ' (cancelable)' : ''}
                            </span>
                            <span className="text-neutral-500">
                                {Math.round(event.at)} ms
                            </span>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}
