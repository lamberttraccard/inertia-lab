import { Link, router, useRemember } from '@inertiajs/react';
import { useState } from 'react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';
import type { ChapterData, Neighbour } from './types';

type PostSummary = {
    id: number;
    title: string;
    excerpt: string;
};

type RememberingStateProps = {
    chapter: ChapterData;
    filter: string;
    posts: PostSummary[];
    previous: Neighbour | null;
    next: Neighbour | null;
};

const SELF = '/chapters/remembering-state';

const INPUT_CLASS =
    'mt-1 block w-full rounded border border-neutral-400 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-900';

const BUTTON_CLASS =
    'rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600';

function matching(posts: PostSummary[], query: string): PostSummary[] {
    const needle = query.trim().toLowerCase();

    return needle === ''
        ? posts
        : posts.filter((post) => post.title.toLowerCase().includes(needle));
}

export default function RememberingState({
    chapter,
    filter,
    posts,
    previous,
    next,
}: RememberingStateProps) {
    const [plainFilter, setPlainFilter] = useState('');
    const [rememberedFilter, setRememberedFilter] = useRemember(
        '',
        'remembering-state:filter',
    );
    const [preserveScroll, setPreserveScroll] = useState(false);
    const [preserveState, setPreserveState] = useState(false);

    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <div className="space-y-3">
                    <p className="text-sm">
                        Type into both boxes, open a post from either column,
                        then use the &quot;Go back&quot; button on that
                        post&apos;s page (a real browser back navigation, not a
                        link back to this URL). Watch which box still holds what
                        you typed.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium">
                                Plain useState (not remembered)
                            </label>
                            <input
                                type="text"
                                value={plainFilter}
                                onChange={(event) =>
                                    setPlainFilter(event.target.value)
                                }
                                placeholder="Filter this column"
                                className={INPUT_CLASS}
                            />
                            <ul className="mt-2 space-y-1 text-sm">
                                {matching(posts, plainFilter).map((post) => (
                                    <li key={post.id}>
                                        <Link
                                            href={`${SELF}/${post.id}`}
                                            className="underline"
                                        >
                                            {post.title}
                                        </Link>
                                    </li>
                                ))}
                                {matching(posts, plainFilter).length === 0 ? (
                                    <li className="text-neutral-500">
                                        No title matches.
                                    </li>
                                ) : null}
                            </ul>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">
                                <Term term="Remembered state">useRemember</Term>
                            </label>
                            <input
                                type="text"
                                value={rememberedFilter}
                                onChange={(event) =>
                                    setRememberedFilter(event.target.value)
                                }
                                placeholder="Filter this column"
                                className={INPUT_CLASS}
                            />
                            <ul className="mt-2 space-y-1 text-sm">
                                {matching(posts, rememberedFilter).map(
                                    (post) => (
                                        <li key={post.id}>
                                            <Link
                                                href={`${SELF}/${post.id}`}
                                                className="underline"
                                            >
                                                {post.title}
                                            </Link>
                                        </li>
                                    ),
                                )}
                                {matching(posts, rememberedFilter).length ===
                                0 ? (
                                    <li className="text-neutral-500">
                                        No title matches.
                                    </li>
                                ) : null}
                            </ul>
                        </div>
                    </div>
                </div>
            }
            watchFor={
                <p className="mt-2">
                    Both boxes filter the exact same posts array in the browser:
                    neither keystroke sends a request, so the wire strip stays
                    quiet while you type. Coming back from a detail page through
                    its own &quot;Go back&quot; button is what tells the
                    difference: the plain box reads empty again, because the
                    component that held its state was thrown away and rebuilt
                    from nothing when you left this page and returned to it. The
                    useRemember box keeps what you typed, because that value was
                    written into the current history entry as you typed it, and
                    read back out of that same entry when the component was
                    rebuilt.
                </p>
            }
            whenToUse={
                <p>
                    Reach for <code className="font-mono">useRemember</code> for
                    state you would be annoyed to retype after stepping away and
                    back: a filter, a draft, an open accordion section. It is
                    unrelated to whether the data itself is current. Do not
                    reach for it as a substitute for a real visit option: a
                    same-page reload that should keep this component alive wants{' '}
                    <code className="font-mono">preserveState</code>, not a
                    remembered value duplicating what the component already
                    holds.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">
                    A scroll region, and what a reload keeps
                </h2>
                <p className="mt-1">
                    The boxed list below carries the bare{' '}
                    <code className="font-mono">scroll-region</code> attribute,
                    verified in{' '}
                    <code className="font-mono">
                        node_modules/@inertiajs/core/dist/index.js
                    </code>{' '}
                    as the exact string Inertia&apos;s client scans for with{' '}
                    <code className="font-mono">
                        document.querySelectorAll(&apos;[scroll-region]&apos;)
                    </code>
                    , not <code className="font-mono">data-scroll-region</code>.
                    Scroll it, then reload this same page with{' '}
                    <code className="font-mono">preserveScroll</code> and{' '}
                    <code className="font-mono">preserveState</code> checked in
                    every combination; the four results were observed directly,
                    not assumed from either option&apos;s name.{' '}
                    <code className="font-mono">preserveScroll</code> alone
                    controls the window&apos;s own scroll position: checked
                    keeps it, unchecked resets it to the top, regardless of{' '}
                    <code className="font-mono">preserveState</code>. This
                    region needs both checked to keep its own position: with{' '}
                    <code className="font-mono">preserveState</code> unchecked,
                    this whole component unmounts and remounts, so the boxed
                    list below is a brand new element whose scroll starts at
                    zero no matter what{' '}
                    <code className="font-mono">preserveScroll</code> asked for;
                    with <code className="font-mono">preserveState</code>{' '}
                    checked but{' '}
                    <code className="font-mono">preserveScroll</code> unchecked,
                    the element survives but Inertia&apos;s own reset explicitly
                    zeroes every{' '}
                    <code className="font-mono">scroll-region</code> it finds,
                    this one included. Only both checked together keep this
                    region&apos;s position.{' '}
                    <code className="font-mono">preserveState</code> is also why
                    checking it keeps the plain filter box above intact across
                    this same reload; it cannot help that box survive a trip to
                    a detail page and back, because that trip never reloads this
                    component at all, it unmounts it, then builds a fresh one
                    regardless of either option.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
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
                            checked={preserveState}
                            onChange={(event) =>
                                setPreserveState(event.target.checked)
                            }
                        />
                        preserveState
                    </label>
                    <button
                        type="button"
                        onClick={() =>
                            router.get(
                                SELF,
                                {},
                                { preserveScroll, preserveState },
                            )
                        }
                        className={BUTTON_CLASS}
                    >
                        Reload this page
                    </button>
                </div>
                <div
                    {...{ 'scroll-region': '' }}
                    className="mt-3 h-40 overflow-y-auto rounded border border-neutral-400 p-2 text-sm dark:border-neutral-600"
                >
                    <ul className="space-y-1">
                        {Array.from({ length: 40 }, (_, index) => (
                            <li key={index}>Row {index + 1} of this list.</li>
                        ))}
                    </ul>
                </div>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    A deep-linkable filter, on the server side
                </h2>
                <p className="mt-1">
                    This route also reads a{' '}
                    <code className="font-mono">filter</code> query parameter on
                    the server and returns only the matching posts: the current
                    value is{' '}
                    <code className="font-mono">
                        &quot;{filter || '(none)'}&quot;
                    </code>
                    , and {posts.length} post
                    {posts.length === 1 ? '' : 's'} came back for it. That
                    mechanism is entirely independent of the two boxes above,
                    which filter client-side without ever asking the server
                    again; it exists so a bookmarked or shared link can open to
                    an already-filtered list.
                </p>
            </section>
        </ChapterShell>
    );
}
