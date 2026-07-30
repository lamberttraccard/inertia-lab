import { Deferred, router, usePage, WhenVisible } from '@inertiajs/react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';
import type { ChapterData, Neighbour } from './types';

type PostStats = { total: number; published: number };
type CommentStats = { total: number };

type DeferredPropsProps = {
    chapter: ChapterData;
    summary: number;
    postStats?: PostStats;
    commentStats?: CommentStats;
    tagCloud?: string[];
    belowTheFold?: string | null;
    // riskyInsight has no entry here on purpose: its value is never read in JSX below, only
    // its key is named as a string for <Deferred data="riskyInsight">, so there is nothing
    // to type.
    previous: Neighbour | null;
    next: Neighbour | null;
};

export default function DeferredProps({
    chapter,
    summary,
    postStats,
    commentStats,
    tagCloud,
    belowTheFold,
    previous,
    next,
}: DeferredPropsProps) {
    // usePage() is read directly here, not passed down as a prop, because deferredProps
    // and rescuedProps are page-level metadata Inertia attaches next to props, the same
    // place component, url and version live: verified in
    // node_modules/@inertiajs/core/types/types.d.ts, not assumed from the PHP side alone.
    const page = usePage();

    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            router.post('/lab/slow-mode', { ms: 1500 })
                        }
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        Set slow mode to 1.5s
                    </button>
                    <button
                        type="button"
                        onClick={() => router.post('/lab/slow-mode', { ms: 0 })}
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        Reset slow mode to 0
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            router.reload({
                                only: ['postStats', 'commentStats'],
                            })
                        }
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        router.reload only: [&apos;postStats&apos;,
                        &apos;commentStats&apos;]
                    </button>
                </div>
            }
            watchFor={
                <p className="mt-2">
                    Set slow mode to 1.5s first, then reload this page from the
                    address bar: summary renders immediately, the stats panel
                    and the tags panel below both show their fallback, then fill
                    in on their own once their own follow-up request answers,
                    nobody clicked anything. Each group&apos;s own query still
                    carries the full 1.5 second delay; how long you actually see
                    the fallback for also depends on how many requests your PHP
                    server can run at once, since a single-worker development
                    server answers these follow-up requests one at a time rather
                    than truly in parallel. Reload again with slow mode at 0 and
                    the fallback is gone before you can see it, the lesson still
                    holds, it is just fast now. The reload button above targets
                    postStats and commentStats by name: watch the stats panel
                    while it runs, it shows a refreshing note for exactly as
                    long as that request is in flight, driven by the reloading
                    state <Term term="Deferred prop">Deferred</Term> hands its
                    children.
                </p>
            }
            whenToUse={
                <p>
                    Reach for defer when a panel is worth showing on its own
                    schedule rather than holding up everything else: it is a
                    promise the page keeps automatically, no click required.
                    Group props together only when they belong to the same panel
                    and should arrive as one request; put unrelated panels in
                    different groups so a slow one never holds up a fast one.
                    Reach for rescue on anything that can genuinely fail in a
                    way the rest of the page should survive. Reach for
                    WhenVisible instead of defer when the content is optional
                    and only worth fetching if the reader actually scrolls that
                    far.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">
                    A page that renders before its data
                </h2>
                <p className="mt-1">
                    summary is an ordinary closure, resolved like any other
                    prop: {summary} posts, already here. Everything below this
                    paragraph is a{' '}
                    <Term term="Deferred prop">deferred prop</Term>, sent as
                    undefined on this very same response and fetched by the
                    client afterwards, with no button involved.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    Three groups, three follow-up requests
                </h2>
                <p className="mt-1">
                    postStats and commentStats are declared in the same defer
                    group, stats. tagCloud is declared in a different group,
                    sidebar. riskyInsight, covered in the next section, is
                    declared in a third group, insights. The client fires one
                    follow-up request per group, regardless of which Deferred
                    components are actually mounted on the page: open your
                    browser&apos;s network tab and you will see exactly three
                    requests after this page loads, never a single request for
                    everything and never one request per prop. A rescued prop
                    does not get out of this: riskyInsight still costs its own
                    request and still gets its own entry in deferredProps below,
                    the same as postStats or tagCloud; rescue only changes what
                    happens once that request actually runs the callback, not
                    whether the request happens at all.
                </p>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Deferred
                        data={['postStats', 'commentStats']}
                        fallback={
                            <p className="rounded border border-dashed border-neutral-400 p-3 text-sm dark:border-neutral-600">
                                Loading the stats group…
                            </p>
                        }
                    >
                        {({ reloading }) => (
                            <div className="rounded border border-neutral-400 p-3 text-sm dark:border-neutral-600">
                                <p className="font-medium">
                                    Stats group{' '}
                                    {reloading ? '(refreshing…)' : ''}
                                </p>
                                <p className="mt-1">
                                    {postStats?.total} posts,{' '}
                                    {postStats?.published} published,{' '}
                                    {commentStats?.total} comments.
                                </p>
                            </div>
                        )}
                    </Deferred>
                    <Deferred
                        data="tagCloud"
                        fallback={
                            <p className="rounded border border-dashed border-neutral-400 p-3 text-sm dark:border-neutral-600">
                                Loading tags…
                            </p>
                        }
                    >
                        <div className="rounded border border-neutral-400 p-3 text-sm dark:border-neutral-600">
                            <p className="font-medium">Sidebar group</p>
                            <p className="mt-1">
                                {(tagCloud ?? []).join(', ')}
                            </p>
                        </div>
                    </Deferred>
                </div>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    When a deferred prop fails
                </h2>
                <p className="mt-1">
                    riskyInsight is declared with rescue, and its callback
                    always throws. The trace on this very first response already
                    names it deferred to a follow-up request, the same as any
                    other deferred prop, since nothing has attempted to resolve
                    it yet. Once the follow-up request for its group actually
                    runs the callback, the exception is caught, reported, and
                    the trace changes to resolution threw and was rescued: the
                    key is missing from props entirely, not null, and its path
                    is listed under this page&apos;s own rescuedProps metadata
                    instead. Deferred reads that list itself and switches to its
                    rescue slot, which does exist on this installed version,
                    rather than leaving the fallback spinning forever.
                </p>
                <div className="mt-3">
                    <Deferred
                        data="riskyInsight"
                        fallback={
                            <p className="rounded border border-dashed border-neutral-400 p-3 text-sm dark:border-neutral-600">
                                Computing an insight…
                            </p>
                        }
                        rescue={
                            <p
                                role="status"
                                className="rounded border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
                            >
                                This insight could not be computed. The server
                                caught the error and rescued the response
                                instead of failing the whole page.
                            </p>
                        }
                    >
                        {/* This never renders in this chapter: riskyInsight's callback
                            always throws, so props.riskyInsight never arrives and the
                            rescue slot above is what actually shows. */}
                        <p>This should never appear.</p>
                    </Deferred>
                </div>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    Waiting for the reader to scroll
                </h2>
                <p className="mt-1">
                    belowTheFold is optional, not deferred: nothing fetches it
                    automatically on mount. WhenVisible below wraps it in an
                    IntersectionObserver instead, and only issues its own reload
                    once this panel actually enters the viewport. Scroll away
                    from it and back and it stays loaded, since WhenVisible
                    stops observing once it has what it asked for.
                </p>
                <div className="mt-3">
                    <WhenVisible
                        data="belowTheFold"
                        fallback={
                            <p className="rounded border border-dashed border-neutral-400 p-3 text-sm dark:border-neutral-600">
                                Scroll here to load the most-viewed post…
                            </p>
                        }
                    >
                        {({ fetching }) => (
                            <p className="rounded border border-neutral-400 p-3 text-sm dark:border-neutral-600">
                                {fetching
                                    ? 'Fetching…'
                                    : `Most-viewed post: ${belowTheFold ?? 'none yet'}.`}
                            </p>
                        )}
                    </WhenVisible>
                </div>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    The metadata driving all of this
                </h2>
                <p className="mt-1">
                    Read directly from usePage(), not retyped: deferredProps
                    groups the props above by name, and rescuedProps lists
                    whichever ones have actually failed and been rescued so far
                    on this page.
                </p>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                    <div>
                        <dt className="font-medium">
                            deferredProps (metadata)
                        </dt>
                        <dd className="font-mono">
                            {JSON.stringify(page.deferredProps ?? {})}
                        </dd>
                    </div>
                    <div>
                        <dt className="font-medium">rescuedProps (metadata)</dt>
                        <dd className="font-mono">
                            {(page.rescuedProps ?? []).join(', ') || 'none yet'}
                        </dd>
                    </div>
                </dl>
            </section>
        </ChapterShell>
    );
}
