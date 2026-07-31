import { Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ChapterShell } from '@/lab/ChapterShell';
import { CodeBlock } from '@/lab/CodeBlock';
import { Term } from '@/lab/Term';
import type { ChapterData, Neighbour } from './types';

type LinksAndVisitsProps = {
    chapter: ChapterData;
    items: string[];
    serverTime: string;
    previous: Neighbour | null;
    next: Neighbour | null;
};

// The shape router.get's third argument and <Link>'s own props both accept: built fresh on
// every render from the toggle state below, so the JSON shown on screen is the literal
// object handed to the client, not a description of it.
type VisitToggleOptions = {
    replace?: boolean;
    preserveState?: boolean;
    preserveScroll?: boolean;
    preserveUrl?: boolean;
    only?: string[];
    except?: string[];
};

const SELF = '/chapters/links-and-visits';

export default function LinksAndVisits({
    chapter,
    items,
    serverTime,
    previous,
    next,
}: LinksAndVisitsProps) {
    const [replace, setReplace] = useState(false);
    const [preserveState, setPreserveState] = useState(false);
    const [preserveScroll, setPreserveScroll] = useState(false);
    const [preserveUrl, setPreserveUrl] = useState(false);
    const [only, setOnly] = useState(false);
    const [except, setExcept] = useState(false);

    const options = useMemo(() => {
        const built: VisitToggleOptions = {};

        if (replace) {
            built.replace = true;
        }

        if (preserveState) {
            built.preserveState = true;
        }

        if (preserveScroll) {
            built.preserveScroll = true;
        }

        if (preserveUrl) {
            built.preserveUrl = true;
        }

        if (only) {
            built.only = ['items'];
        }

        if (except) {
            built.except = ['serverTime'];
        }

        return built;
    }, [replace, preserveState, preserveScroll, preserveUrl, only, except]);

    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={replace}
                                onChange={(event) =>
                                    setReplace(event.target.checked)
                                }
                            />
                            replace
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={preserveState}
                                onChange={(event) =>
                                    setPreserveState(event.target.checked)
                                }
                            />
                            preserveState
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={preserveScroll}
                                onChange={(event) =>
                                    setPreserveScroll(event.target.checked)
                                }
                            />
                            preserveScroll
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={preserveUrl}
                                onChange={(event) =>
                                    setPreserveUrl(event.target.checked)
                                }
                            />
                            preserveUrl
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={only}
                                onChange={(event) =>
                                    setOnly(event.target.checked)
                                }
                            />
                            only: [&apos;items&apos;]
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={except}
                                onChange={(event) =>
                                    setExcept(event.target.checked)
                                }
                            />
                            except: [&apos;serverTime&apos;]
                        </label>
                    </div>

                    <CodeBlock
                        code={JSON.stringify(options, null, 2)}
                        lang="json"
                        className="overflow-x-auto"
                    />

                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            href={SELF}
                            {...options}
                            className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                        >
                            Same options, as a Link
                        </Link>
                        <button
                            type="button"
                            onClick={() => router.get(SELF, {}, options)}
                            className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                        >
                            Same options, as router.get
                        </button>
                    </div>
                </div>
            }
            watchFor={
                <p className="mt-2">
                    Without preserveState checked, clicking either button
                    remounts this whole page as a fresh component instance: your
                    toggles reset to their defaults, and the inspector goes back
                    to empty too, since it is part of the same instance. Even
                    the entry for the request that caused this remount is lost,
                    recorded into an instance that no longer exists. Check
                    preserveState first and click again: the same instance
                    survives, the toggles stay exactly as you left them, and the
                    inspector keeps every earlier entry, adding this one on top.
                </p>
            }
            whenToUse={
                <p>
                    Reach for a plain{' '}
                    <code className="font-mono">router.*</code> call when the
                    target, the options or the callbacks depend on something
                    computed at the moment of the click, rather than being known
                    when the link is rendered.{' '}
                    <code className="font-mono">{'<Link>'}</code> reads better
                    for anything that is really just navigation: it is a visit,
                    described declaratively instead of imperatively.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">
                    A <Term term="Visit">visit</Term>, two syntaxes
                </h2>
                <p className="mt-1">
                    <code className="font-mono">{'<Link>'}</code> and{' '}
                    <code className="font-mono">router.get()</code> above are
                    built from the exact same options object and point at the
                    exact same URL. Neither is a wrapper around the other:{' '}
                    <code className="font-mono">{'<Link>'}</code> calls{' '}
                    <code className="font-mono">router.visit()</code> from its
                    own click handler, with whatever props it was given mapped
                    onto visit options. There is no dedicated
                    <code className="font-mono"> useLink</code> hook or similar
                    in this installed version; the component is the whole
                    implementation.
                </p>
                <h2 className="mt-4 text-lg font-semibold">
                    only and except are a{' '}
                    <Term term="Partial reload">partial reload</Term>
                </h2>
                <p className="mt-1">
                    items: {items.join(', ')}. serverTime: {serverTime}. Check
                    only and visit: the response contains just items, plus
                    whatever Inertia includes unconditionally (the shared{' '}
                    <code className="font-mono">errors</code> prop, wrapped in{' '}
                    <code className="font-mono">Inertia::always()</code> by the
                    framework's own base middleware). serverTime does not go
                    blank on screen even though the server did not send it this
                    time: the client merges a partial response onto the props it
                    already had, so an omitted prop keeps showing its last known
                    value rather than disappearing.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    Cancelling a visit in flight
                </h2>
                <p className="mt-1">
                    Slow mode delays every prop this lab resolves through{' '}
                    <code className="font-mono">Lab</code>, including serverTime
                    above, which is enough to make a visit slow enough to cancel
                    before it answers.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            router.post('/lab/slow-mode', { ms: 2000 })
                        }
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        Set slow mode to 2s
                    </button>
                    <button
                        type="button"
                        onClick={() => router.get(SELF)}
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        Start a slow visit
                    </button>
                    <button
                        type="button"
                        onClick={() => router.cancelAll()}
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        router.cancelAll()
                    </button>
                    <button
                        type="button"
                        onClick={() => router.post('/lab/slow-mode', { ms: 0 })}
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        Reset slow mode to 0
                    </button>
                </div>
                <p className="mt-2">
                    Set slow mode, start the slow visit, then click cancelAll
                    before it answers: the Wire tab never gets an entry for it
                    (the response is discarded on arrival), and the Lifecycle
                    tab shows before, start and finish for it with neither
                    success nor error in between. Reset slow mode back to 0
                    afterwards, since it otherwise keeps delaying every prop on
                    every chapter, not only this one.
                </p>
            </section>
        </ChapterShell>
    );
}
