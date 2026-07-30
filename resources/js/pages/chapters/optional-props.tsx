import { router } from '@inertiajs/react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';
import type { ChapterData, Neighbour } from './types';

type Stats = { posts: number; comments: number; likes: number };

type OptionalPropsProps = {
    chapter: ChapterData;
    cheap: number;
    eagerStats: Stats;
    expensive?: Stats;
    previous: Neighbour | null;
    next: Neighbour | null;
};

export default function OptionalProps({
    chapter,
    cheap,
    eagerStats,
    expensive,
    previous,
    next,
}: OptionalPropsProps) {
    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <button
                    type="button"
                    onClick={() => router.reload({ only: ['expensive'] })}
                    className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                >
                    router.reload only: [&apos;expensive&apos;]
                </button>
            }
            watchFor={
                <p className="mt-2">
                    expensive is undefined below until you click the button,
                    even though this was a completely ordinary full page load
                    with no only or except anywhere. eagerStats already has a
                    value on the very first render: it runs the same three
                    queries as expensive, through a bare closure instead of{' '}
                    <Term term="Optional prop">Inertia::optional()</Term>, and a
                    closure buys nothing here, it always resolves. The trace
                    agrees: eagerStats is listed under resolved from the start,
                    expensive is skipped with the reason optional and not
                    requested. Click the button and expensive appears, with the
                    trace now naming eagerStats and cheap as skipped for a
                    different reason, not requested by only, because this second
                    request is a partial reload that named only expensive.
                </p>
            }
            whenToUse={
                <p>
                    Reach for optional when a prop is genuinely expensive and
                    the page can render sensibly without it on first paint: a
                    detail panel behind a click, a report nobody may ever ask to
                    see this visit. Wrapping something in a closure is not a
                    substitute; a closure only postpones evaluation to response
                    time, not to a later request.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">
                    Three props, one lesson
                </h2>
                <p className="mt-1">
                    cheap is a plain value: {cheap} tags, already known, nothing
                    to defer. eagerStats is a bare closure computing the same
                    aggregate as expensive: {eagerStats.posts} posts,{' '}
                    {eagerStats.comments} comments, {eagerStats.likes} likes.
                    expensive runs the identical three queries, but only once
                    asked for:{' '}
                    {expensive
                        ? `${expensive.posts} posts, ${expensive.comments} comments, ${expensive.likes} likes.`
                        : 'not loaded yet.'}
                </p>
            </section>
        </ChapterShell>
    );
}
