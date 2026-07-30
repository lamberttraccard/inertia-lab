import { router } from '@inertiajs/react';
import { useState } from 'react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';
import type { WireEntry } from '@/lab/types';
import type { ChapterData, Neighbour } from './types';

type PostSummary = {
    id: number;
    title: string;
    excerpt: string;
    published_at: string | null;
};

type Stats = { posts: number; comments: number; likes: number };

type PartialReloadsProps = {
    chapter: ChapterData;
    posts: PostSummary[];
    tags: string[];
    stats: Stats;
    previous: Neighbour | null;
    next: Neighbour | null;
};

type Comparison = {
    id: number;
    label: string;
    bytes: number;
    propKeys: string[];
};

let nextComparisonId = 1;

// Read back from the same request headers the wire strip already displays, rather than
// tracked separately: this is the one true record of what this exact request asked for,
// so the label can never drift from what actually left the browser.
function labelFor(entry: WireEntry): string {
    const only = entry.requestHeaders['x-inertia-partial-data'];
    const except = entry.requestHeaders['x-inertia-partial-except'];

    if (only) {
        return `only: ${only}`;
    }

    if (except) {
        return `except: ${except}`;
    }

    return 'full reload';
}

export default function PartialReloads({
    chapter,
    posts,
    tags,
    stats,
    previous,
    next,
}: PartialReloadsProps) {
    const [comparisons, setComparisons] = useState<Comparison[]>([]);

    function recordComparison(entry: WireEntry) {
        if (!entry.url.includes('/chapters/partial-reloads')) {
            return;
        }

        const propKeys =
            entry.page?.props && typeof entry.page.props === 'object'
                ? Object.keys(entry.page.props).filter((key) => key !== '_lab')
                : [];

        setComparisons((all) =>
            [
                {
                    id: nextComparisonId++,
                    label: labelFor(entry),
                    bytes: entry.bytes,
                    propKeys,
                },
                ...all,
            ].slice(0, 6),
        );
    }

    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            onWireEntry={recordComparison}
            tryThis={
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => router.reload({ only: ['posts'] })}
                            className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                        >
                            router.reload only: [&apos;posts&apos;]
                        </button>
                        <button
                            type="button"
                            onClick={() => router.reload({ except: ['stats'] })}
                            className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                        >
                            router.reload except: [&apos;stats&apos;]
                        </button>
                        <button
                            type="button"
                            onClick={() => router.reload()}
                            className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                        >
                            router.reload, full
                        </button>
                    </div>

                    {comparisons.length > 0 && (
                        <table className="w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-neutral-300 dark:border-neutral-700">
                                    <th className="py-1 pr-3 font-medium">
                                        Request
                                    </th>
                                    <th className="py-1 pr-3 font-medium">
                                        Payload
                                    </th>
                                    <th className="py-1 font-medium">
                                        Props in the response
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisons.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="border-b border-neutral-100 dark:border-neutral-900"
                                    >
                                        <td className="py-1 pr-3 font-mono">
                                            {row.label}
                                        </td>
                                        <td className="py-1 pr-3 font-mono">
                                            {row.bytes} bytes
                                        </td>
                                        <td className="py-1 font-mono">
                                            {row.propKeys.join(', ')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            }
            watchFor={
                <p className="mt-2">
                    Click all three and compare rows in the table above:{' '}
                    <Term term="Partial reload">only</Term> keeps just posts, so
                    tags and stats disappear from &quot;Props in the
                    response&quot; and the payload shrinks to a fraction of the
                    full reload&apos;s. except keeps everything but stats. The
                    trace below tells you why each miss happened: only marks
                    tags and stats &quot;not requested by only&quot;, except
                    marks stats &quot;excluded by except&quot;, a different
                    SkipReason for a different header. Turn on slow mode from
                    the round-trip diagram above and click except again: stats
                    is the slow one, so skipping it saves real time, not only
                    bytes.
                </p>
            }
            whenToUse={
                <p>
                    Reach for only when a component only ever needs one prop
                    refreshed, a sort or a filter on a single table. Reach for
                    except when everything but one expensive prop should stay
                    current. reset belongs to the same header family but only
                    means something for a prop marked mergeable, which a later
                    chapter introduces; nothing on this page is mergeable, so no
                    reset control appears here.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">
                    Three props, three different sizes
                </h2>
                <p className="mt-1">
                    posts is a real query, tags is a short list, and stats runs
                    three count queries nobody asked to see on every single
                    reload. All three are ordinary props: nothing here is
                    deferred or optional, so a plain full load always includes
                    every one of them. The only thing that can make the server
                    skip one is a{' '}
                    <Term term="Partial reload">partial reload</Term> naming it,
                    which is exactly what the buttons above send.
                </p>
                <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                    <div>
                        <dt className="font-medium">posts</dt>
                        <dd>{posts.length} rows</dd>
                    </div>
                    <div>
                        <dt className="font-medium">tags</dt>
                        <dd>{tags.length} names</dd>
                    </div>
                    <div>
                        <dt className="font-medium">stats</dt>
                        <dd>
                            {stats.posts} posts, {stats.comments} comments,{' '}
                            {stats.likes} likes
                        </dd>
                    </div>
                </dl>
            </section>
        </ChapterShell>
    );
}
