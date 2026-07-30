import { Link, usePrefetch } from '@inertiajs/react';

type PrefetchingDestinationProps = {
    reachedAt: string;
};

// Not wrapped in ChapterShell: this is the target the prefetching chapter's links point
// at, not a registered chapter of its own, so it carries none of the chapter furniture
// (translation callout, source view, prev/next footer).
export default function PrefetchingDestination({
    reachedAt,
}: PrefetchingDestinationProps) {
    // Scoped to the current URL (verified in node_modules/@inertiajs/react/dist/index.js:
    // usePrefetch() calls router.getCached(window.location.pathname, options)), so this
    // reports on this page's own arrival, not on any other link's cache entry.
    const { isPrefetched, isPrefetching, lastUpdatedAt, flush } = usePrefetch();

    return (
        <div className="mx-auto max-w-2xl space-y-6 p-6">
            <header>
                <h1 className="text-2xl font-semibold">You have arrived</h1>
                <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                    This is the page every link on the prefetching chapter
                    points at.
                </p>
            </header>

            <section>
                <h2 className="text-lg font-semibold">
                    When this page&apos;s own data was actually computed
                </h2>
                <p className="mt-1">
                    reachedAt: <code className="font-mono">{reachedAt}</code>.
                    Compare it with a clock. If you hovered a prefetching link,
                    waited, then clicked, this timestamp is from the hover: the
                    click itself asked nothing of the server.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    usePrefetch(), read live
                </h2>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                    <div>
                        <dt className="font-medium">isPrefetched</dt>
                        <dd className="font-mono">{String(isPrefetched)}</dd>
                    </div>
                    <div>
                        <dt className="font-medium">isPrefetching</dt>
                        <dd className="font-mono">{String(isPrefetching)}</dd>
                    </div>
                    <div>
                        <dt className="font-medium">lastUpdatedAt</dt>
                        <dd className="font-mono">
                            {lastUpdatedAt === null
                                ? 'null'
                                : new Date(lastUpdatedAt).toLocaleTimeString()}
                        </dd>
                    </div>
                </dl>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                    A visit that arrived here without ever being prefetched
                    shows isPrefetched as false and lastUpdatedAt as null.
                </p>
            </section>

            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={flush}
                    className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                >
                    usePrefetch().flush() this page&apos;s own cache entry
                </button>
                <Link
                    href="/chapters/prefetching"
                    className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                >
                    Back to the chapter
                </Link>
            </div>
        </div>
    );
}
