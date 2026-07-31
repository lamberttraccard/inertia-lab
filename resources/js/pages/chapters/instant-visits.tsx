import { Link, router } from '@inertiajs/react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';
import type { ChapterData, Neighbour } from './types';

type PostSummary = {
    id: number;
    title: string;
};

type InstantVisitsProps = {
    chapter: ChapterData;
    posts: PostSummary[];
    previous: Neighbour | null;
    next: Neighbour | null;
};

const LINK_CLASS =
    'rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600';

export default function InstantVisits({
    chapter,
    posts,
    previous,
    next,
}: InstantVisitsProps) {
    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                router.post('/lab/slow-mode', { ms: 1500 })
                            }
                            className={LINK_CLASS}
                        >
                            Set slow mode to 1.5s
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                router.post('/lab/slow-mode', { ms: 0 })
                            }
                            className={LINK_CLASS}
                        >
                            Reset slow mode to 0
                        </button>
                    </div>
                    <p className="text-sm">
                        Set slow mode first, then compare the two links for each
                        post below.
                    </p>
                    <div className="space-y-2">
                        {posts.map((post) => (
                            <div
                                key={post.id}
                                className="flex flex-wrap items-center gap-3 rounded border border-neutral-400 p-2 dark:border-neutral-600"
                            >
                                <span className="text-sm font-medium">
                                    {post.title}
                                </span>
                                <Link
                                    href={`/chapters/instant-visits/${post.id}`}
                                    className={LINK_CLASS}
                                >
                                    Open normally
                                </Link>
                                <Link
                                    href={`/chapters/instant-visits/${post.id}`}
                                    component="chapters/instant-visits-detail"
                                    preserveScroll
                                    className={LINK_CLASS}
                                >
                                    Open instantly
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            }
            watchFor={
                <p className="mt-2">
                    With slow mode at 1.5 seconds, &quot;Open normally&quot;
                    keeps you on this page, footer and all, until the response
                    arrives a second and a half later. &quot;Open
                    instantly&quot; replaces this whole page with the detail
                    component immediately: no inspector, no header nav, no
                    ChapterShell at all, because that component was never
                    wrapped in one. For 1.5 seconds it reads{' '}
                    <em>post is undefined right now</em>, the detail page&apos;s
                    own fallback text for exactly that state, not a loading
                    spinner bolted on afterwards. Once the real response lands,
                    the same component re-renders with post filled in, and the
                    key list on that page grows from the shared-only set to
                    include post. Reload this chapter from the address bar
                    afterwards (a real navigation, not an instant one) to come
                    back.
                </p>
            }
            whenToUse={
                <p>
                    Reach for an instant visit when the destination component is
                    one you already know by name and its layout tolerates its
                    page-specific props being briefly undefined: a list linking
                    to a detail view is the usual case. It buys perceived speed,
                    not real speed: the request for the real data still takes
                    exactly as long, the component just stops waiting for it
                    before painting something.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">
                    Named up front, rendered immediately
                </h2>
                <p className="mt-1">
                    An ordinary <Term term="Visit">visit</Term> waits for the
                    server to say which component to render, since that name is
                    part of the response. An{' '}
                    <Term term="Instant visit">instant visit</Term> is given
                    that name up front, through the component option on{' '}
                    <code className="font-mono">Link</code> or{' '}
                    <code className="font-mono">router.visit()</code>, both
                    verified against{' '}
                    <code className="font-mono">LinkComponentBaseProps</code>{' '}
                    and <code className="font-mono">Visit</code> in{' '}
                    <code className="font-mono">
                        node_modules/@inertiajs/core/types/types.d.ts
                    </code>
                    . The client resolves and renders that component before the
                    request for its data has even reached the server, verified
                    by reading{' '}
                    <code className="font-mono">performInstantSwap()</code> in{' '}
                    <code className="font-mono">
                        node_modules/@inertiajs/core/dist/index.js
                    </code>
                    .
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    What that render actually holds
                </h2>
                <p className="mt-1">
                    performInstantSwap() builds the intermediate page&apos;s
                    props from two things only: whichever keys the current
                    page&apos;s own sharedProps metadata lists (the props{' '}
                    <code className="font-mono">HandleInertiaRequests</code>
                    &apos;s share() and shareOnce() contribute on every
                    response), and an empty errors object. Nothing page-specific
                    survives from the page you were just on, and nothing
                    page-specific for the new page exists yet either: this is
                    the shared-props-only state the detail page has to render
                    correctly, not an edge case to guard against. Once the real
                    response for the new page arrives, it replaces this
                    intermediate page exactly as an ordinary visit would, which
                    is what makes the missing prop appear to fill in.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    One page, reused as its own destination
                </h2>
                <p className="mt-1">
                    Both links above point at the same detail route; the only
                    difference is that the instant one also names its component.
                    In a larger application the two links would usually go to
                    different routes, a list and a detail view most commonly,
                    but the client-side mechanism is identical either way: what
                    matters is that the reader already knows the target
                    component, not which URL it happens to live at.
                </p>
            </section>
        </ChapterShell>
    );
}
