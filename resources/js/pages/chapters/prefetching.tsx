import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';
import type { ChapterData, Neighbour } from './types';

type PrefetchingProps = {
    chapter: ChapterData;
    previous: Neighbour | null;
    next: Neighbour | null;
};

const DESTINATION = '/chapters/prefetching/destination';

// The array form is the stale-while-revalidate tuple, verified in
// node_modules/@inertiajs/core/dist/index.js's cacheForToStaleAndExpires(): the first
// number is how long a cached response stays fresh (re-triggering prefetch on it is a
// no-op), the second is how long until it is dropped from the cache entirely. A single
// value, string or number, is used for both. Passing 0 marks a single-use entry, evicted
// immediately after the first real visit consumes it.
const CACHE_FOR_PRESETS: Record<
    'default' | 'none' | 'ten_seconds' | 'swr',
    number | string | number[] | undefined
> = {
    default: undefined,
    none: 0,
    ten_seconds: '10s',
    swr: [3000, 15000],
};

type CacheForPresetKey = keyof typeof CACHE_FOR_PRESETS;

const LINK_CLASS =
    'rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600';

export default function Prefetching({
    chapter,
    previous,
    next,
}: PrefetchingProps) {
    const [cacheForKey, setCacheForKey] =
        useState<CacheForPresetKey>('default');
    const [tagged, setTagged] = useState(true);
    const [cacheStatus, setCacheStatus] = useState(
        'not checked yet, click the button below',
    );

    const cacheFor = CACHE_FOR_PRESETS[cacheForKey];
    const cacheTags = tagged ? 'prefetch-demo' : [];

    function checkCache() {
        const prefetching = router.getPrefetching(DESTINATION, {});

        if (prefetching) {
            setCacheStatus('a prefetch request is in flight right now');

            return;
        }

        const cached = router.getCached(DESTINATION, {});

        if (!cached || cached.inFlight) {
            setCacheStatus('nothing cached for this link right now');

            return;
        }

        const ageMs = Date.now() - cached.timestamp;

        setCacheStatus(
            `cached ${Math.round(ageMs / 1000)}s ago, tags [${cached.tags.join(', ') || 'none'}], ` +
                `${cached.singleUse ? 'single-use' : 'reusable until it expires'}`,
        );
    }

    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 text-sm">
                            cacheFor
                            <select
                                value={cacheForKey}
                                onChange={(event) =>
                                    setCacheForKey(
                                        event.target.value as CacheForPresetKey,
                                    )
                                }
                                className="rounded border border-neutral-400 bg-transparent px-2 py-1 text-sm dark:border-neutral-600"
                            >
                                <option value="default">
                                    default (30 seconds)
                                </option>
                                <option value="none">0, single-use</option>
                                <option value="ten_seconds">10 seconds</option>
                                <option value="swr">
                                    stale after 3s, evicted after 15s
                                </option>
                            </select>
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={tagged}
                                onChange={(event) =>
                                    setTagged(event.target.checked)
                                }
                            />
                            cacheTags=&quot;prefetch-demo&quot;
                        </label>
                    </div>
                    <p className="text-sm">
                        Every link below shares this{' '}
                        <code className="font-mono">cacheFor</code> (
                        <code className="font-mono">
                            {JSON.stringify(cacheFor) ?? 'undefined'}
                        </code>
                        ) and <code className="font-mono">cacheTags</code> (
                        <code className="font-mono">
                            {JSON.stringify(cacheTags)}
                        </code>
                        ), and all point at the same URL, so they read and write
                        the same cache entry.
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            href={DESTINATION}
                            prefetch="hover"
                            cacheFor={cacheFor}
                            cacheTags={cacheTags}
                            className={LINK_CLASS}
                        >
                            prefetch=&quot;hover&quot;
                        </Link>
                        <Link
                            href={DESTINATION}
                            prefetch="mount"
                            cacheFor={cacheFor}
                            cacheTags={cacheTags}
                            className={LINK_CLASS}
                        >
                            prefetch=&quot;mount&quot;
                        </Link>
                        <Link
                            href={DESTINATION}
                            prefetch="click"
                            cacheFor={cacheFor}
                            cacheTags={cacheTags}
                            className={LINK_CLASS}
                        >
                            prefetch=&quot;click&quot;
                        </Link>
                        <Link href={DESTINATION} className={LINK_CLASS}>
                            no prefetch, a plain link
                        </Link>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={checkCache}
                            className={LINK_CLASS}
                        >
                            Check cache status for the destination
                        </button>
                        <button
                            type="button"
                            onClick={() => router.flush(DESTINATION)}
                            className={LINK_CLASS}
                        >
                            router.flush(destination)
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                router.flushByCacheTags('prefetch-demo')
                            }
                            className={LINK_CLASS}
                        >
                            router.flushByCacheTags(&quot;prefetch-demo&quot;)
                        </button>
                        <button
                            type="button"
                            onClick={() => router.flushAll()}
                            className={LINK_CLASS}
                        >
                            router.flushAll()
                        </button>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Cache status: {cacheStatus}
                    </p>
                </div>
            }
            watchFor={
                <p className="mt-2">
                    The mount link starts{' '}
                    <Term term="Prefetch">prefetching</Term> on its own the
                    moment this page finishes loading, before you touch
                    anything: watch the wire strip below for a request carrying
                    a bare <code className="font-mono">Purpose: prefetch</code>{' '}
                    header right after the page appears. Hover the hover link
                    and, after 75 milliseconds (this installed version&apos;s
                    real default, read from{' '}
                    <code className="font-mono">
                        config.get(&apos;prefetch.hoverDelay&apos;)
                    </code>
                    ), a second one appears the same way. Press the click link
                    down (not up) and a third fires immediately, on mousedown,
                    before the click that actually navigates ever completes.
                    Whichever you trigger, the follow-up click itself records no
                    new entry in the wire strip at all: the response was already
                    sitting in the cache, so the visit that lands on the
                    destination page never leaves the browser. All four links
                    point at the same URL with the same options, so they read
                    and write one shared cache entry regardless of which one
                    triggered it: prefetch a second link after the first already
                    cached a response and nothing new is sent, since the entry
                    has not gone stale yet. Changing the preset above only takes
                    effect the next time this entry is actually populated; flush
                    it first if one is already cached and you want to see a new
                    preset apply.
                </p>
            }
            whenToUse={
                <p>
                    Reach for prefetch on links a reader is likely to follow and
                    where the destination does not change from one moment to the
                    next: navigation, a details page, the next item in a list.
                    Reach for a short cacheFor, or none at all, on anything that
                    goes stale quickly; reach for cacheTags when several
                    different links should be invalidated together after one
                    mutation, rather than one at a time by URL.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">
                    Three strategies, one option
                </h2>
                <p className="mt-1">
                    <code className="font-mono">prefetch</code> on{' '}
                    <code className="font-mono">Link</code> accepts{' '}
                    <code className="font-mono">true</code> (equivalent to{' '}
                    <code className="font-mono">&quot;hover&quot;</code>),{' '}
                    <code className="font-mono">false</code>, one of{' '}
                    <code className="font-mono">
                        &quot;hover&quot; | &quot;mount&quot; |
                        &quot;click&quot;
                    </code>
                    , or an array combining more than one, read from{' '}
                    <code className="font-mono">LinkPrefetchOption</code> in{' '}
                    <code className="font-mono">
                        node_modules/@inertiajs/core/types/types.d.ts
                    </code>
                    . There is no fourth strategy in this installed version. The
                    default cache duration a prefetched response is kept for is
                    30 seconds (
                    <code className="font-mono">
                        config.get(&apos;prefetch.cacheFor&apos;)
                    </code>
                    ), except for a link whose only strategy is{' '}
                    <code className="font-mono">&quot;click&quot;</code>: the
                    installed client&apos;s own{' '}
                    <code className="font-mono">Link</code> component
                    special-cases that combination to a cacheFor of 0, a single
                    use, since a response fetched on the mouse-down of the very
                    click that is about to consume it has nothing left to be
                    cached for afterwards.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    The signal on the wire
                </h2>
                <p className="mt-1">
                    A prefetch request carries no{' '}
                    <code className="font-mono">X-Inertia-*</code> header of its
                    own to say so. It is a bare{' '}
                    <code className="font-mono">Purpose: prefetch</code> header,
                    the same one a browser itself sends for a speculative
                    navigation, verified against{' '}
                    <code className="font-mono">
                        node_modules/@inertiajs/core/dist/index.js
                    </code>
                    . The wire strip&apos;s round-trip diagram already keys its
                    browser and render segments off exactly this header.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    A cache the router owns, not a page you visit
                </h2>
                <p className="mt-1">
                    <code className="font-mono">router.getCached()</code> and{' '}
                    <code className="font-mono">router.getPrefetching()</code>{' '}
                    read that cache for an arbitrary URL, which is what the
                    status line above uses.{' '}
                    <code className="font-mono">router.flush(href)</code> drops
                    one cached entry,{' '}
                    <code className="font-mono">
                        router.flushByCacheTags(tag)
                    </code>{' '}
                    drops every entry sharing that tag, and{' '}
                    <code className="font-mono">router.flushAll()</code> empties
                    the whole cache. All three exist on this installed router,
                    verified against{' '}
                    <code className="font-mono">
                        node_modules/@inertiajs/core/types/router.d.ts
                    </code>
                    , and every button above calls the real function, not a
                    stand-in for one that does not exist.
                </p>
            </section>
        </ChapterShell>
    );
}
