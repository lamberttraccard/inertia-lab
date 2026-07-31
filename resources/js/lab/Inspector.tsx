import type { KeyboardEvent } from 'react';
import { useState, useSyncExternalStore } from 'react';
import { RoundTrip } from './RoundTrip';
import { SourceView } from './SourceView';
import type { LabTrace, LifecycleEvent, WireEntry } from './types';
import { useWireCapture } from './useWireCapture';
import { readInitialTrace } from './wire-capture';

type TabId = 'wire' | 'lifecycle' | 'trace' | 'diagram' | 'source';

const TABS: ReadonlyArray<{ id: TabId; label: string }> = [
    { id: 'wire', label: 'Wire' },
    { id: 'lifecycle', label: 'Lifecycle' },
    { id: 'trace', label: 'Trace' },
    { id: 'diagram', label: 'Diagram' },
    { id: 'source', label: 'Source' },
];

const FOCUS_RING =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-neutral-400 dark:focus-visible:ring-offset-neutral-950';

function formatBytes(bytes: number): string {
    return `${bytes.toLocaleString('en-US')} B`;
}

// Matches the lg breakpoint the layout itself switches on (ChapterShell's two-column
// grid activates at lg, 1024px, the same width the sidebar-vs-dock decision depends on).
const WIDE_SCREEN_QUERY = '(min-width: 1024px)';

function subscribeToWidth(onChange: () => void): () => void {
    const media = window.matchMedia(WIDE_SCREEN_QUERY);
    media.addEventListener('change', onChange);

    return () => media.removeEventListener('change', onChange);
}

function isWideScreen(): boolean {
    return window.matchMedia(WIDE_SCREEN_QUERY).matches;
}

// The spec's own default: open on a wide screen. Used verbatim for the server snapshot
// too, so a server-rendered page and the client's first paint agree before this settles
// to the real value through useSyncExternalStore, the same after-mount pattern
// resources/js/lab/visited.ts uses for the same reason.
function isWideScreenServerSnapshot(): boolean {
    return true;
}

function useIsWideScreen(): boolean {
    return useSyncExternalStore(
        subscribeToWidth,
        isWideScreen,
        isWideScreenServerSnapshot,
    );
}

type InspectorProps = {
    slug: string;
    serverFile: string;
    clientFile: string;
    // Lets a chapter keep its own history of entries (partial-reloads compares payload
    // sizes across several requests) without installing a second capture on top of this
    // one: every entry the inspector records is forwarded here too, if given.
    onEntry?: (entry: WireEntry) => void;
};

/**
 * The right-hand pane of the two-pane workbench: everything that is evidence rather than
 * lesson, behind one persistent byte counter and five tabs. A sidebar at 1024px and up,
 * a normal-flow (never fixed, never floating) collapsible block at the end of the lesson
 * below that, per the spec this replaced: the old wire strip's `position: fixed` panel
 * permanently covered the bottom of the viewport, which is exactly the defect this
 * layout exists to remove.
 */
export function Inspector({
    slug,
    serverFile,
    clientFile,
    onEntry,
}: InspectorProps) {
    const { entries, events } = useWireCapture(onEntry);
    const [tab, setTab] = useState<TabId>('wire');
    const isWideScreen = useIsWideScreen();
    // null means "no manual choice yet": open follows the screen width, matching the
    // spec's own default of open on a wide screen. Below lg, the dock sits in normal
    // document flow rather than becoming a fixed sidebar, so an open one adds its own
    // full height to the page; defaulting to closed there keeps a chapter's first paint
    // short on a phone. Once the reader actually clicks the toggle, that choice sticks
    // regardless of width, rather than being overridden by a later resize.
    const [userChoseOpen, setUserChoseOpen] = useState<boolean | null>(null);
    const open = userChoseOpen ?? isWideScreen;

    const latest = entries[0] ?? null;
    const previousEntry = entries[1] ?? null;
    const trace = latest?.trace ?? readInitialTrace();
    const delta =
        latest && previousEntry ? latest.bytes - previousEntry.bytes : null;

    function focusTab(id: TabId) {
        setTab(id);
        document.getElementById(`inspector-tab-${id}`)?.focus();
    }

    // Roving-tabindex arrow-key navigation, per the WAI-ARIA tabs pattern: the tablist
    // itself is one stop in the tab order, arrow keys move the roving focus (and the
    // selection with it) inside it.
    function handleTabListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        const ids = TABS.map((t) => t.id);
        const at = ids.indexOf(tab);
        const moves: Partial<Record<string, number>> = {
            ArrowRight: (at + 1) % ids.length,
            ArrowLeft: (at - 1 + ids.length) % ids.length,
            Home: 0,
            End: ids.length - 1,
        };
        const next = moves[event.key];

        if (next !== undefined) {
            event.preventDefault();
            focusTab(ids[next]);
        }
    }

    return (
        <aside
            aria-label="Inspector"
            className="mt-10 min-w-0 border-t border-neutral-200 pt-6 lg:sticky lg:top-4 lg:mt-0 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto lg:border-t-0 lg:pt-0 dark:border-neutral-800"
        >
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/40">
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                        <p className="text-xs tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
                            Last response
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 font-mono">
                            {latest ? (
                                <>
                                    <span className="text-3xl leading-none font-semibold text-neutral-900 tabular-nums dark:text-neutral-50">
                                        {formatBytes(latest.bytes)}
                                    </span>
                                    {delta !== null && delta !== 0 && (
                                        <span
                                            className={
                                                delta < 0
                                                    ? 'text-sm font-medium text-sky-700 tabular-nums dark:text-sky-400'
                                                    : 'text-sm font-medium text-emerald-700 tabular-nums dark:text-emerald-400'
                                            }
                                        >
                                            {delta < 0 ? '▼' : '▲'}{' '}
                                            {formatBytes(Math.abs(delta))}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span className="text-base font-normal text-neutral-500 dark:text-neutral-400">
                                    no visit recorded yet
                                </span>
                            )}
                        </p>
                    </div>
                    {/* Only the mobile dock needs a toggle: the spec's own default is
                        open on a wide screen, full stop, so the sidebar never offers a
                        control the wide layout has no use for. One less button around
                        the one element this design is supposed to keep quiet. */}
                    <button
                        type="button"
                        onClick={() => setUserChoseOpen(!open)}
                        aria-expanded={open}
                        aria-controls="inspector-panel"
                        className={`shrink-0 rounded border border-neutral-300 px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 lg:hidden dark:border-neutral-700 dark:text-neutral-300 dark:hover:text-neutral-50 ${FOCUS_RING}`}
                    >
                        {open ? 'Collapse' : 'Expand'}
                    </button>
                </div>

                {open && (
                    <div
                        id="inspector-panel"
                        className="border-t border-neutral-200 dark:border-neutral-800"
                    >
                        <div
                            role="tablist"
                            aria-label="Inspector views"
                            onKeyDown={handleTabListKeyDown}
                            className="flex flex-wrap gap-1 px-2 py-2"
                        >
                            {TABS.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    role="tab"
                                    id={`inspector-tab-${t.id}`}
                                    aria-selected={tab === t.id}
                                    aria-controls={`inspector-tabpanel-${t.id}`}
                                    tabIndex={tab === t.id ? 0 : -1}
                                    onClick={() => setTab(t.id)}
                                    className={`rounded px-2.5 py-1 text-sm ${FOCUS_RING} ${
                                        tab === t.id
                                            ? 'bg-neutral-200/70 font-semibold text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50'
                                            : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        <div className="max-h-[28rem] overflow-y-auto border-t border-neutral-200 p-4 text-sm lg:max-h-none dark:border-neutral-800">
                            {tab === 'wire' && (
                                <div
                                    role="tabpanel"
                                    id="inspector-tabpanel-wire"
                                    aria-labelledby="inspector-tab-wire"
                                >
                                    <WireTab entries={entries} />
                                </div>
                            )}
                            {tab === 'lifecycle' && (
                                <div
                                    role="tabpanel"
                                    id="inspector-tabpanel-lifecycle"
                                    aria-labelledby="inspector-tab-lifecycle"
                                >
                                    <LifecycleTab events={events} />
                                </div>
                            )}
                            {tab === 'trace' && (
                                <div
                                    role="tabpanel"
                                    id="inspector-tabpanel-trace"
                                    aria-labelledby="inspector-tab-trace"
                                >
                                    <TraceTab trace={trace} />
                                </div>
                            )}
                            {tab === 'diagram' && (
                                <div
                                    role="tabpanel"
                                    id="inspector-tabpanel-diagram"
                                    aria-labelledby="inspector-tab-diagram"
                                >
                                    <RoundTrip entry={latest} />
                                </div>
                            )}
                            {tab === 'source' && (
                                <div
                                    role="tabpanel"
                                    id="inspector-tabpanel-source"
                                    aria-labelledby="inspector-tab-source"
                                >
                                    <SourceView
                                        slug={slug}
                                        serverFile={serverFile}
                                        clientFile={clientFile}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}

function WireTab({ entries }: { entries: WireEntry[] }) {
    if (entries.length === 0) {
        return (
            <p className="text-neutral-500 dark:text-neutral-400">
                No Inertia visit yet. Use a link or a control in this chapter to
                record one.
            </p>
        );
    }

    return (
        <ol className="space-y-4">
            {entries.map((entry) => (
                <li
                    key={entry.id}
                    className="border-b border-neutral-200 pb-4 last:border-0 last:pb-0 dark:border-neutral-800"
                >
                    <p className="flex flex-wrap items-baseline gap-x-2 font-mono break-all">
                        <span className="font-semibold">{entry.method}</span>
                        <span>{entry.url}</span>
                        <span>{entry.status}</span>
                        <span>{entry.durationMs} ms</span>
                        <span>{formatBytes(entry.bytes)}</span>
                    </p>
                    <dl className="mt-1.5 grid grid-cols-1 gap-x-4 font-mono text-xs">
                        {Object.entries(entry.requestHeaders).map(
                            ([key, value]) => (
                                <div
                                    key={`request-${key}`}
                                    className="flex gap-1 break-all"
                                >
                                    <dt className="text-neutral-500 dark:text-neutral-400">
                                        req {key}
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
                                    <dt className="text-neutral-500 dark:text-neutral-400">
                                        res {key}
                                    </dt>
                                    <dd>{value}</dd>
                                </div>
                            ),
                        )}
                    </dl>
                    <details className="mt-1.5">
                        <summary
                            className={`cursor-pointer text-neutral-500 dark:text-neutral-400 ${FOCUS_RING}`}
                        >
                            Page object
                        </summary>
                        <pre className="mt-1 max-w-full overflow-x-auto font-mono text-xs text-wrap break-all whitespace-pre-wrap">
                            {JSON.stringify(entry.page, null, 2)}
                        </pre>
                    </details>
                </li>
            ))}
        </ol>
    );
}

function LifecycleTab({ events }: { events: LifecycleEvent[] }) {
    if (events.length === 0) {
        return (
            <p className="text-neutral-500 dark:text-neutral-400">
                No lifecycle event yet.
            </p>
        );
    }

    return (
        <ol className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {events.map((event) => (
                <li
                    key={event.id}
                    className="flex justify-between gap-2 py-1.5 font-mono text-xs"
                >
                    <span>
                        {event.name}
                        {event.cancelable ? ' (cancelable)' : ''}
                    </span>
                    <span className="text-neutral-500 dark:text-neutral-400">
                        {Math.round(event.at)} ms
                    </span>
                </li>
            ))}
        </ol>
    );
}

// Fail loudly: a missing trace and a disabled recorder both say so out loud, in their
// own tab now rather than smeared atop the Wire and Lifecycle tabs regardless of which
// one was open. Neither case falls through to an empty panel, and neither is a spinner
// that could get stuck: both are a single, immediate, textual state.
function TraceTab({ trace }: { trace: LabTrace | null }) {
    if (!trace) {
        return (
            <p
                role="status"
                className="border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
            >
                No trace found on this page. The lab middleware did not run, so
                prop resolution cannot be shown.
            </p>
        );
    }

    if (!trace.enabled) {
        return (
            <p
                role="status"
                className="border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
            >
                {trace.reason}
            </p>
        );
    }

    const resolved = Object.entries(trace.props);
    const skipped = Object.entries(trace.skipped);

    return (
        <div className="space-y-5">
            <div>
                {/* The two semantic accents used throughout the inspector: this text label
                    carries the meaning on its own, the colour only repeats it, per the
                    rule that colour is never the only signal. */}
                <p className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Resolved on the server ({resolved.length})
                </p>
                {resolved.length === 0 ? (
                    <p className="mt-1 text-neutral-500 dark:text-neutral-400">
                        Nothing resolved on this response.
                    </p>
                ) : (
                    <ul className="mt-1.5 space-y-1 font-mono text-xs">
                        {resolved.map(([key, prop]) => (
                            <li key={key}>
                                {key}{' '}
                                <span className="text-neutral-500 dark:text-neutral-400">
                                    ({prop.type})
                                </span>{' '}
                                {prop.ms} ms
                                {prop.delayMs > 0
                                    ? ` incl. ${prop.delayMs} ms slow mode`
                                    : ''}
                                {prop.rescued ? ' · rescued' : ''}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div>
                <p className="font-mono text-xs font-semibold text-sky-700 dark:text-sky-400">
                    Skipped by the server ({skipped.length})
                </p>
                {skipped.length === 0 ? (
                    <p className="mt-1 text-neutral-500 dark:text-neutral-400">
                        Nothing skipped on this response.
                    </p>
                ) : (
                    <ul className="mt-1.5 space-y-2">
                        {skipped.map(([key, prop]) => (
                            <li key={key}>
                                <p className="font-mono text-xs">
                                    {key}{' '}
                                    <span className="text-neutral-500 dark:text-neutral-400">
                                        ({prop.type})
                                    </span>
                                </p>
                                <p className="text-neutral-600 dark:text-neutral-300">
                                    {prop.reason}. {prop.explanation}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {trace.partial && (
                <div>
                    <p className="font-mono text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                        This request&apos;s partial-reload headers
                    </p>
                    <dl className="mt-1.5 grid grid-cols-1 gap-x-4 font-mono text-xs">
                        {(
                            [
                                ['component', trace.partial.component],
                                ['only', trace.partial.only],
                                ['except', trace.partial.except],
                                ['exceptOnce', trace.partial.exceptOnce],
                            ] as const
                        ).map(([key, value]) => (
                            <div key={key} className="flex gap-1 break-all">
                                <dt className="text-neutral-500 dark:text-neutral-400">
                                    {key}
                                </dt>
                                <dd>{value ?? 'none'}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            )}
        </div>
    );
}
