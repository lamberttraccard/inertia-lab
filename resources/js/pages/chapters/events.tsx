import { router } from '@inertiajs/react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';
import { CANCELABLE, EVENTS } from '@/lab/useWireCapture';
import type { ChapterData, Neighbour } from './types';

type EventsProps = {
    chapter: ChapterData;
    note: string;
    previous: Neighbour | null;
    next: Neighbour | null;
};

// A one-shot global listener: it cancels only the one visit this button triggers, then
// removes itself, so it never blocks every later visit on this page (a permanent listener
// returning false would break navigation for the rest of the chapter, including the
// shell's own footer links).
function triggerCancelledVisit() {
    const off = router.on('before', () => {
        off();

        return false;
    });

    router.reload();
}

export default function Events({ chapter, note, previous, next }: EventsProps) {
    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.reload()}
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        Trigger a normal visit
                    </button>
                    <button
                        type="button"
                        onClick={triggerCancelledVisit}
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        Cancel this visit from before
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            router.post('/chapters/events/unprocessable')
                        }
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        Trigger a 422
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            router.post('/chapters/events/server-error')
                        }
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        Trigger a 500
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            router.get('/chapters/events/non-inertia')
                        }
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        Visit a non-Inertia route
                    </button>
                </div>
            }
            watchFor={
                <p className="mt-2">
                    {note} The normal visit runs the full sequence below in
                    order. The cancel button fires before, then nothing else: no
                    request ever leaves the browser, because the per-visit check
                    happens before start. The last three buttons each open the
                    client&apos;s own error dialog, layered over this page
                    (click outside it to dismiss); the Lifecycle tab behind it
                    still records httpException for all three, for the reason
                    explained below.
                </p>
            }
            whenToUse={
                <p>
                    Reach for <code className="font-mono">router.on()</code>{' '}
                    when something in the application needs to react to every{' '}
                    <Term term="Visit">visit</Term>, not just one: a global
                    progress bar, a toast on error, or logging. Reach for a
                    per-visit callback (
                    <code className="font-mono">onSuccess</code>,{' '}
                    <code className="font-mono">onError</code>, and so on) when
                    only the one call that started this particular visit cares
                    about its outcome.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">
                    Every event this installed version fires
                </h2>
                <p className="mt-1">
                    Read from{' '}
                    <code className="font-mono">
                        node_modules/@inertiajs/core/types/types.d.ts
                    </code>{' '}
                    and confirmed against the bundle itself, not copied from the
                    documentation: cancelable means its result type is{' '}
                    <code className="font-mono">boolean | void</code> rather
                    than plain <code className="font-mono">void</code>, and
                    returning exactly <code className="font-mono">false</code>{' '}
                    from any listener is what turns that into a cancellation.
                </p>
                <table className="mt-2 w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-neutral-300 dark:border-neutral-700">
                            <th className="py-1 pr-4">Event</th>
                            <th className="py-1">Cancelable</th>
                        </tr>
                    </thead>
                    <tbody>
                        {EVENTS.map((name) => (
                            <tr
                                key={name}
                                className="border-b border-neutral-200 dark:border-neutral-800"
                            >
                                <td className="py-1 pr-4 font-mono">{name}</td>
                                <td className="py-1">
                                    {CANCELABLE.has(name) ? 'yes' : 'no'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p className="mt-2">
                    Two corrections against the type file taken at face value.{' '}
                    <code className="font-mono">cancel</code> is a key of{' '}
                    <code className="font-mono">GlobalEventsMap</code>, so{' '}
                    <code className="font-mono">
                        router.on(&apos;cancel&apos;, ...)
                    </code>{' '}
                    type-checks, but nothing in this bundle ever fires it: the
                    dist file has no{' '}
                    <code className="font-mono">fireCancelEvent</code> function
                    at all, so it is left out of the table above.{' '}
                    <code className="font-mono">clientVisit</code> is real and
                    included: it fires for a client-side visit that never
                    reaches the server at all, such as{' '}
                    <code className="font-mono">router.push()</code> or{' '}
                    <code className="font-mono">router.replace()</code>, neither
                    of which this chapter has a control for.
                </p>
                <h2 className="mt-4 text-lg font-semibold">
                    The order for a normal visit
                </h2>
                <p className="mt-1">
                    Watched directly in the Lifecycle tab for the button above,
                    not assumed: before, start, beforeUpdate, success, finish,
                    in that order.
                </p>
                <p className="mt-2">
                    navigate does not appear, and that absence is itself worth
                    explaining: this button reloads the exact URL you are
                    already on, and{' '}
                    <code className="font-mono">
                        node_modules/@inertiajs/core/dist/index.js
                    </code>{' '}
                    always forces a same-URL visit to replace history rather
                    than push a new entry, and the function that fires navigate
                    skips doing so whenever the visit replaces. A visit to a
                    different URL, such as the next or previous chapter link at
                    the bottom of this page, does fire navigate, at the cost of
                    leaving this page, and its Lifecycle tab, behind.
                </p>
                <p className="mt-2">
                    progress does not appear either: the client only fires it
                    for a request whose body is{' '}
                    <code className="font-mono">FormData</code>, which a plain
                    GET never carries.
                </p>
                <h2 className="mt-4 text-lg font-semibold">
                    One event, three unrelated causes
                </h2>
                <p className="mt-1">
                    All three buttons fire the same event: httpException, not
                    three different ones. The 422 and the 500 both come from{' '}
                    <code className="font-mono">abort()</code>, thrown before
                    the controller ever calls{' '}
                    <code className="font-mono">Inertia::render()</code>; the
                    exception unwinds past{' '}
                    <code className="font-mono">
                        Inertia\Middleware::handle()
                    </code>
                    &apos;s own post-processing, the same mechanism chapter 2
                    observed for its broken component name, so neither response
                    carries the X-Inertia header that Inertia sets only inside{' '}
                    <code className="font-mono">Response::toResponse()</code>.
                    The client&apos;s own check for whether a response is an{' '}
                    <Term term="Page object">Inertia response</Term> reads that
                    header, not the status code, so a 422, a 500 and a plain 200
                    that never called{' '}
                    <code className="font-mono">Inertia::render()</code> are
                    indistinguishable to it.
                </p>
                <p className="mt-2">
                    The dialogs still look different from each other, for a
                    reason that has nothing to do with Inertia: Laravel ships
                    its own generic view for a handful of status codes, 500
                    among them, and{' '}
                    <code className="font-mono">
                        Handler::renderHttpException()
                    </code>{' '}
                    renders that plain page before the detailed one ever runs.
                    422 has no such bundled view, so it falls through to the
                    same detailed page chapter 2&apos;s broken component name
                    produced.
                </p>
            </section>
        </ChapterShell>
    );
}
