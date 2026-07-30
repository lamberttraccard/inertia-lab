import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';
import { supportsViewTransitions } from '@/lab/viewTransitionSupport';
import type { ChapterData, Neighbour } from './types';

type PostSummary = {
    id: number;
    title: string;
    excerpt: string;
};

type ViewTransitionsProps = {
    chapter: ChapterData;
    posts: PostSummary[];
    previous: Neighbour | null;
    next: Neighbour | null;
};

export default function ViewTransitions({
    chapter,
    posts,
    previous,
    next,
}: ViewTransitionsProps) {
    const [enabled, setEnabled] = useState(true);
    const supported = supportsViewTransitions();

    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(event) =>
                                setEnabled(event.target.checked)
                            }
                        />
                        viewTransition on every card link below
                    </label>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        This browser{' '}
                        {supported ? 'supports' : 'does not support'} the View
                        Transitions API right now, read live from{' '}
                        <code className="font-mono">
                            &apos;startViewTransition&apos; in document
                        </code>
                        .
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {posts.map((post) => (
                            <Link
                                key={post.id}
                                href={`/chapters/view-transitions/${post.id}`}
                                viewTransition={enabled}
                                className="block rounded border border-neutral-400 p-3 text-sm dark:border-neutral-600"
                            >
                                {/* Same view-transition-name as this post's own <h1> on
                                    the detail page: the shared element the browser
                                    morphs between the two layouts. */}
                                <span
                                    className="block font-medium"
                                    style={{
                                        viewTransitionName: `post-title-${post.id}`,
                                    }}
                                >
                                    {post.title}
                                </span>
                                <span className="mt-1 block text-neutral-600 dark:text-neutral-400">
                                    {post.excerpt}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            }
            watchFor={
                <p className="mt-2">
                    With the checkbox on, in a browser that supports the API,
                    clicking a card cross-fades the whole page into the detail
                    view while the clicked card&apos;s own title visibly moves
                    and resizes into the detail page&apos;s heading, rather than
                    the two just swapping. Switch the checkbox off and the same
                    click replaces the page instantly, exactly like any other
                    visit in every earlier chapter, since that is genuinely all
                    a visit without viewTransition ever does. If this browser
                    does not support the API at all, the checkbox makes no
                    visible difference either way: the line above already says
                    so, and <code className="font-mono">Page.swap()</code> in
                    the installed core falls back to the same plain swap on its
                    own, silently, whenever{' '}
                    <code className="font-mono">
                        document.startViewTransition
                    </code>{' '}
                    does not exist, or the tab is not currently visible.
                </p>
            }
            whenToUse={
                <p>
                    Reach for viewTransition on navigations where the reader
                    benefits from seeing where the new content came from: a list
                    opening into one of its own items is the clearest case.
                    Reach for a shared view-transition-name only on the element
                    that should visibly carry over; leave the rest of the page
                    to the browser&apos;s own default cross-fade rather than
                    naming everything.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">
                    One visit option, handed to the browser
                </h2>
                <p className="mt-1">
                    <code className="font-mono">viewTransition</code> accepts a
                    plain boolean, or a callback receiving the browser&apos;s
                    own <code className="font-mono">ViewTransition</code> object
                    once the swap starts, read from{' '}
                    <code className="font-mono">Visit</code> in{' '}
                    <code className="font-mono">
                        node_modules/@inertiajs/core/types/types.d.ts
                    </code>{' '}
                    (that type itself comes from TypeScript&apos;s own DOM
                    library, not from Inertia, confirming this is the real
                    browser API and not a wrapper around it). Passing{' '}
                    <code className="font-mono">true</code>, as every card link
                    above does while the checkbox is checked, wraps the{' '}
                    <Term term="Visit">visit</Term>&apos;s page swap in a call
                    to{' '}
                    <code className="font-mono">
                        document.startViewTransition()
                    </code>
                    , verified by reading{' '}
                    <code className="font-mono">Page.swap()</code> in{' '}
                    <code className="font-mono">
                        node_modules/@inertiajs/core/dist/index.js
                    </code>
                    . The browser then animates a cross-fade between the old and
                    new document states on its own, at no cost beyond that one
                    option: no animation library, no manual{' '}
                    <code className="font-mono">FLIP</code> calculation.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    A named element carries itself across
                </h2>
                <p className="mt-1">
                    Each card&apos;s title above and the corresponding heading
                    on its detail page both carry the same{' '}
                    <code className="font-mono">
                        view-transition-name: post-title-N
                    </code>{' '}
                    CSS property, set here through React&apos;s inline{' '}
                    <code className="font-mono">style</code> prop rather than a
                    class, since the value is different for every post. Two
                    elements sharing that name across the old and new page are
                    what the browser recognises as the same logical element and
                    animates between their two positions and sizes, instead of
                    leaving the whole document to the default cross-fade. Only
                    one element in the whole document may carry a given name at
                    any moment the browser is not mid-transition; three cards on
                    this same page therefore need three different names, one per
                    post, never one name reused across all of them.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    Where this degrades, and why silently
                </h2>
                <p className="mt-1">
                    <code className="font-mono">Page.swap()</code> checks three
                    things before it ever calls{' '}
                    <code className="font-mono">startViewTransition()</code>:
                    the visit actually asked for one, the current browser
                    exposes the function at all, and the document is currently
                    visible. Any one of those failing falls straight through to
                    the same plain swap a visit without viewTransition performs,
                    with no warning and no error: verified directly in that
                    function&apos;s own source rather than assumed from the
                    option existing. The Chromium engine (Chrome, Edge and other
                    browsers built on it) shipped same-document view transitions
                    first, in 2023; other engines have added support since, at
                    their own pace, which is exactly why this page checks the
                    browser it is running in directly above rather than naming
                    versions that would go stale.
                </p>
            </section>
        </ChapterShell>
    );
}
