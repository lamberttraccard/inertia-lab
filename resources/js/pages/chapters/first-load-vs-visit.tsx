import { Link, usePage } from '@inertiajs/react';
import { ChapterShell } from '@/lab/ChapterShell';

type ChapterData = {
    slug: string;
    title: string;
    question: string;
    concept: string;
    routeName: string;
    serverFile: string;
    clientFile: string;
    translationFrom: string;
    translationTo: string;
    docsUrl: string;
    wave: number;
    order: number;
};

type Sample = {
    ingredients: string[];
    note: string;
};

type Neighbour = { slug: string; title: string };

type FirstLoadVsVisitProps = {
    chapter: ChapterData;
    sample: Sample;
    renderedAt: string;
    previous: Neighbour | null;
    next: Neighbour | null;
};

export default function FirstLoadVsVisit({
    chapter,
    sample,
    renderedAt,
    previous,
    next,
}: FirstLoadVsVisitProps) {
    // usePage() returns the page object of whatever response produced the current render, so
    // this is a live read, not a hardcoded description: it changes after the Link visit below,
    // and stays the anatomy of a fresh document after the plain anchor reloads the page.
    const page = usePage();

    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <p className="flex flex-wrap items-center gap-3">
                    <Link
                        href="/chapters/first-load-vs-visit"
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        Visit this page again with a Link
                    </Link>
                    <a
                        href="/chapters/first-load-vs-visit"
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        Load this page again with a plain anchor
                    </a>
                </p>
            }
            watchFor={
                <p className="mt-2">
                    Watch renderedAt for the Link, not the wire strip: this
                    visit swaps in a fresh copy of this very page without
                    preserveState, so the strip you are reading remounts as part
                    of that same visit and starts over empty, missing its own
                    entry (your browser&apos;s own network tab would show it:
                    X-Inertia: true on the request, JSON back). The plain anchor
                    is the clearer contrast to see directly here: a completely
                    new page load, wire strip and all, with no X-Inertia header
                    anywhere. Either way, renderedAt changes, proving the
                    controller ran again rather than the browser reusing what it
                    already had.
                </p>
            }
            whenToUse={
                <p>
                    This is not a feature to turn on. It is the one request
                    every page in this application answers, first load or not.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">
                    The page object, field by field
                </h2>
                <p className="mt-1">
                    Not a description: read live from this render with
                    usePage(), the same object the client router keeps between
                    visits.
                </p>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                    <div>
                        <dt className="font-medium">component</dt>
                        <dd className="font-mono">{page.component}</dd>
                    </div>
                    <div>
                        <dt className="font-medium">url</dt>
                        <dd className="font-mono">{page.url}</dd>
                    </div>
                    <div>
                        <dt className="font-medium">version</dt>
                        <dd className="font-mono break-all">{page.version}</dd>
                    </div>
                    <div>
                        <dt className="font-medium">props (keys)</dt>
                        <dd className="font-mono">
                            {Object.keys(page.props).join(', ')}
                        </dd>
                    </div>
                    {page.sharedProps ? (
                        <div>
                            <dt className="font-medium">
                                sharedProps (metadata)
                            </dt>
                            <dd className="font-mono">
                                {page.sharedProps.join(', ')}
                            </dd>
                        </div>
                    ) : null}
                </dl>
                <p className="mt-4">
                    sample travelled inside props, unchanged on every visit:{' '}
                    {sample.ingredients.join(', ')}.
                </p>
                <p className="mt-1">renderedAt did not: {renderedAt}.</p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    Two requests, one route
                </h2>
                <p className="mt-1">
                    Both controls point at the exact same URL. The difference is
                    entirely in what the request asks for: a visit sends an
                    X-Inertia header and wants JSON back; a normal browser
                    navigation sends neither and gets the full document, with
                    the page object embedded for the client to boot from.
                </p>
            </section>
        </ChapterShell>
    );
}
