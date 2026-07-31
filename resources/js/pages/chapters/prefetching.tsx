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
// value, string or number, is used for both.
//
// 0 is not a general single-use marker: node_modules/@inertiajs/react/dist/index.js's Link
// component destructures its own cacheFor prop as `cacheFor = 0`, so a caller who passes 0
// and a caller who passes nothing at all are indistinguishable once inside it. The value it
// resolves to is `cacheFor !== 0 ? cacheFor : (linkIsClickOnly ? 0 : config.get('prefetch.cacheFor'))`,
// so 0 only survives as single-use on a link whose sole strategy is "click"; for hover or
// mount it silently becomes the 30 second default instead. See the note next to the
// selector below.
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
                                <option value="none">0 (see note below)</option>
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
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                        The 0 preset only reads as single-use on the click link
                        below. For hover or mount, this installed version cannot
                        tell 0 apart from leaving cacheFor unset entirely, so
                        both fall back to the 30 second default: pick 0, flush
                        the cache, hover the hover link, then press &quot;Check
                        cache status&quot; below.
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                        It will report &quot;reusable until it expires&quot;,
                        not single-use. The mount link only prefetches once, on
                        this page&apos;s first load, so it cannot be retried
                        against a different preset without a fresh page load,
                        which resets this selector back to its own default
                        anyway.
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
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                        Cache status: {cacheStatus}
                    </p>
                </div>
            }
            watchFor={
                <>
                    <p className="mt-2">
                        Each strategy fires at a different moment, each one
                        showing up in the inspector&apos;s Wire tab as a request
                        carrying a bare{' '}
                        <code className="font-mono">Purpose: prefetch</code>{' '}
                        header:
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                        <li>
                            the mount link starts{' '}
                            <Term term="Prefetch">prefetching</Term> on its own
                            the moment this page finishes loading, before you
                            touch anything.
                        </li>
                        <li>
                            the hover link fires after 75 milliseconds of
                            hovering (this installed version&apos;s real
                            default, read from{' '}
                            <code className="font-mono">
                                config.get(&apos;prefetch.hoverDelay&apos;)
                            </code>
                            ).
                        </li>
                        <li>
                            the click link fires immediately on mousedown: press
                            it down (not up) and it fires before the click that
                            actually navigates ever completes.
                        </li>
                    </ul>
                    <p className="mt-2">
                        All four links point at the same URL with the same
                        options, so they read and write one shared cache entry
                        regardless of which one triggered it. The follow-up
                        click itself records no new entry in the inspector at
                        all: the response was already sitting in the cache, so
                        the visit that lands on the destination page never
                        leaves the browser. Prefetch a second link after the
                        first already cached a response and nothing new is sent
                        either, since the entry has not gone stale yet.
                    </p>
                    <p className="mt-2">
                        Changing the preset above only takes effect the next
                        time this entry is actually populated; flush it first if
                        one is already cached and you want to see a new preset
                        apply.
                    </p>
                </>
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
                    default cache duration{' '}
                    <Term term="Prefetch">a prefetched response</Term> is kept
                    for is 30 seconds (
                    <code className="font-mono">
                        config.get(&apos;prefetch.cacheFor&apos;)
                    </code>
                    ), except for a link whose only strategy is{' '}
                    <code className="font-mono">&quot;click&quot;</code>.
                </p>
                <p className="mt-2">
                    The installed client&apos;s own{' '}
                    <code className="font-mono">Link</code> component
                    special-cases that combination to a cacheFor of 0, a single
                    use, since a response fetched on the mouse-down of the very
                    click that is about to consume it has nothing left to be
                    cached for afterwards. That special case is the only way to
                    reach a single-use entry in this version: the same component
                    destructures its own cacheFor prop as{' '}
                    <code className="font-mono">cacheFor = 0</code>, so a caller
                    who passes <code className="font-mono">0</code> explicitly
                    and a caller who passes nothing at all are indistinguishable
                    once inside it. A hover or mount link therefore has no
                    cacheFor value that makes it single-use: 0 collapses to the
                    same 30 second default that leaving it undefined would
                    produce.
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
                    . The inspector&apos;s Diagram tab already keys its browser
                    and render segments off exactly this header.
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
