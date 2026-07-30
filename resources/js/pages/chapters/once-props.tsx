import { Link, router, usePage } from '@inertiajs/react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';
import type { ChapterData, Neighbour } from './types';

type OncePropsProps = {
    chapter: ChapterData;
    tags: string[];
    visitedAt: string;
    previous: Neighbour | null;
    next: Neighbour | null;
};

export default function OnceProps({
    chapter,
    tags,
    visitedAt,
    previous,
    next,
}: OncePropsProps) {
    // onceProps is read directly from usePage(), the same real page-level metadata
    // mergeProps and scrollProps already are in the previous two chapters, not passed
    // down as a prop of its own.
    const page = usePage();
    const onceProps = page.onceProps ?? {};

    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href="/chapters/once-props"
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        Visit again (Link)
                    </Link>
                    <button
                        type="button"
                        onClick={() => router.reload()}
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        router.reload(), bare
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            router.reload({ only: ['tags', 'visitedAt'] })
                        }
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        router.reload only: [&apos;tags&apos;,
                        &apos;visitedAt&apos;]
                    </button>
                </div>
            }
            watchFor={
                <p className="mt-2">
                    tags is a <Term term="Once prop">once prop</Term>. The very
                    first response you ever received for this page carried it
                    and listed it under page.onceProps, shown below. Click
                    &quot;Visit again&quot; or &quot;router.reload(),
                    bare&quot;: neither sends only or except, so neither is a
                    partial reload of this page, and both requests carry
                    X-Inertia-Except-Once-Props: tags, because your client
                    already holds a value for it. The trace agrees: tags moves
                    to skipped, reason once prop already held by the client,
                    while visitedAt, an ordinary closure, refreshes to a new
                    timestamp every time regardless. tags itself never blinks
                    empty on screen either way: the client's own
                    mergeOncePropsIntoResponse() quietly copies the value it
                    already holds back into a response that skipped it, which is
                    the entire point of once, continuity, not a missing update.
                    Click the third button and tags comes back for real: naming
                    it inside only makes this request a partial reload of the
                    current component, and the server only consults the
                    except-once header when a request is not one of those, so
                    the exclusion never gets a chance to run and tags resolves
                    again, fresh from the database.
                </p>
            }
            whenToUse={
                <p>
                    Reach for once on a prop that is expensive or just pointless
                    to keep resending once the client has it: a filter option
                    list, a country list, anything that does not change within a
                    session. The demo user switcher&apos;s own option list,
                    demoUserOptions, is this exact mechanism already at work
                    elsewhere in this application, added through
                    HandleInertiaRequests::shareOnce() because it belongs to
                    every page rather than to just this one; the shared-data
                    chapter is where to see that variant.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">One list, sent once</h2>
                <p className="mt-1">
                    tags:{' '}
                    {tags.length > 0
                        ? tags.join(', ')
                        : 'not sent on this response.'}
                </p>
                <p className="mt-1">
                    visitedAt, an ordinary closure for contrast: {visitedAt}
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    The metadata driving this
                </h2>
                <p className="mt-1">
                    Read from page.onceProps: present the moment tags is
                    actually sent, and still present, unchanged, on a response
                    that skips it, since the client needs to keep knowing what
                    it already holds either way.
                </p>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                    <div>
                        <dt className="font-medium">onceProps (metadata)</dt>
                        <dd className="font-mono">
                            {JSON.stringify(onceProps)}
                        </dd>
                    </div>
                </dl>
            </section>
        </ChapterShell>
    );
}
