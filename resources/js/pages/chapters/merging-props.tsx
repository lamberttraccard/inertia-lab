import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';
import type { ChapterData, Neighbour } from './types';

type CommentRow = {
    id: number;
    post_id: number;
    body: string;
    created_at: string | null;
    author?: { id: number; name: string };
};

type DigestPost = { id: number; title: string; published_at: string | null };

type Digest = { items: DigestPost[]; fetchedAt: string };

type MergingPropsProps = {
    chapter: ChapterData;
    comments: CommentRow[];
    commentsHasMore: boolean;
    postDigest: Digest;
    usingDeepMerge: boolean;
    previous: Neighbour | null;
    next: Neighbour | null;
};

export default function MergingProps({
    chapter,
    comments,
    commentsHasMore,
    postDigest,
    usingDeepMerge,
    previous,
    next,
}: MergingPropsProps) {
    const [commentsPage, setCommentsPage] = useState(1);
    const [digestPage, setDigestPage] = useState(1);
    const [deep, setDeep] = useState(usingDeepMerge);

    // page.mergeProps, deepMergeProps and matchPropsOn are read directly, not retyped:
    // the same real metadata usePage() exposes for deferredProps and rescuedProps in the
    // deferred-props chapter, verified in node_modules/@inertiajs/core/types/types.d.ts.
    const page = usePage();

    function loadMoreComments() {
        const nextPage = commentsPage + 1;

        setCommentsPage(nextPage);
        router.reload({
            only: ['comments', 'commentsHasMore'],
            data: { commentsPage: nextPage },
        });
    }

    function resetComments() {
        setCommentsPage(1);
        router.reload({
            only: ['comments', 'commentsHasMore'],
            reset: ['comments'],
            data: { commentsPage: 1 },
        });
    }

    function loadMoreDigest() {
        const nextPage = digestPage + 1;

        setDigestPage(nextPage);
        router.reload({
            only: ['postDigest'],
            data: { digestPage: nextPage, deep },
        });
    }

    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={loadMoreComments}
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        Load more comments
                    </button>
                    <button
                        type="button"
                        onClick={resetComments}
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        Reset comments (reset: [&apos;comments&apos;])
                    </button>
                </div>
            }
            watchFor={
                <p className="mt-2">
                    Click &quot;Load more comments&quot; a few times: the count
                    below grows by twenty rows each time rather than swapping to
                    a fresh twenty, because comments is a{' '}
                    <Term term="Merge prop">merge prop</Term> and the trace
                    shows its path listed under page.mergeProps on every one of
                    those responses. Click &quot;Reset comments&quot; and the
                    list snaps back down to the first twenty: that request
                    carries reset: [&apos;comments&apos;], and page.mergeProps
                    no longer names comments on that one response, so the client
                    replaces instead of appending. matchOn(&apos;id&apos;) is
                    what makes it safe to click &quot;Load more comments&quot;
                    then ask for commentsPage 1 again without a reset: the
                    existing rows update in place instead of appearing twice,
                    because page.matchPropsOn names comments.id.
                </p>
            }
            whenToUse={
                <p>
                    Reach for merge on any list a partial reload extends: load
                    more, pull to refresh, a feed that grows downward. Reach for
                    deepMerge instead the moment the mergeable list is nested
                    inside an object rather than sitting at the prop's root, the
                    postDigest panel below is that exact case. Name matchOn
                    whenever the same item could plausibly arrive twice;
                    skipping it turns a refreshed row into a duplicate one.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">
                    Comments: a plain merge, matched by id
                </h2>
                <p className="mt-1">
                    {comments.length} comments loaded so far.{' '}
                    {commentsHasMore
                        ? 'More are available.'
                        : 'That is every comment.'}
                </p>
                <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto text-sm">
                    {comments.map((comment) => (
                        <li
                            key={comment.id}
                            className="rounded border border-neutral-200 p-2 dark:border-neutral-800"
                        >
                            <span className="font-medium">
                                {comment.author?.name ?? 'Unknown'}
                            </span>{' '}
                            on post #{comment.post_id}: {comment.body}
                        </li>
                    ))}
                </ul>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    Post digest: the same shape, wrapped two ways
                </h2>
                <p className="mt-1">
                    postDigest looks like {'{ items: [...], fetchedAt }'}, items
                    nested one level inside the prop rather than sitting at its
                    root. This server is currently wrapping it with{' '}
                    {usingDeepMerge
                        ? 'Inertia::deepMerge()'
                        : 'Inertia::merge()'}
                    , because the last request you sent set deep to{' '}
                    {String(usingDeepMerge)}. Flip the toggle, then click
                    &quot;Load more digest&quot;: with the toggle off, items
                    resets to just the newest five posts every single click,
                    because a plain merge on an object combines only at that
                    object's own root, spreading {'{ items, fetchedAt }'} as a
                    whole and letting the new items value win outright. With the
                    toggle on, items keeps growing, because deepMerge recurses
                    into the nested array the same way a root-level merge prop
                    would. Switching mid-stream does not rewrite what already
                    loaded, it only changes how the next response combines with
                    whatever is on screen right now.
                </p>
                <label className="mt-2 flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={deep}
                        onChange={(event) => setDeep(event.target.checked)}
                    />
                    Use deepMerge for the next load
                </label>
                <p className="mt-1 text-sm text-neutral-500">
                    Fetched at {postDigest.fetchedAt}
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                    {postDigest.items.map((post) => (
                        <li key={post.id}>{post.title}</li>
                    ))}
                </ul>
                <button
                    type="button"
                    onClick={loadMoreDigest}
                    className="mt-2 rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                >
                    Load more digest
                </button>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    The metadata driving all of this
                </h2>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                    <div>
                        <dt className="font-medium">mergeProps (metadata)</dt>
                        <dd className="font-mono">
                            {JSON.stringify(page.mergeProps ?? [])}
                        </dd>
                    </div>
                    <div>
                        <dt className="font-medium">
                            deepMergeProps (metadata)
                        </dt>
                        <dd className="font-mono">
                            {JSON.stringify(page.deepMergeProps ?? [])}
                        </dd>
                    </div>
                    <div>
                        <dt className="font-medium">matchPropsOn (metadata)</dt>
                        <dd className="font-mono">
                            {JSON.stringify(page.matchPropsOn ?? [])}
                        </dd>
                    </div>
                </dl>
            </section>
        </ChapterShell>
    );
}
