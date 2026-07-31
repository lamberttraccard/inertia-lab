import { InfiniteScroll, Link, usePage } from '@inertiajs/react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';
import type { ChapterData, Neighbour } from './types';

type PostSummary = {
    id: number;
    title: string;
    excerpt: string;
    published_at: string | null;
    author?: { id: number; name: string };
};

type PaginatedPosts = {
    data: PostSummary[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
};

type InfiniteScrollChapterProps = {
    chapter: ChapterData;
    posts: PaginatedPosts;
    previous: Neighbour | null;
    next: Neighbour | null;
};

// Named InfiniteScrollChapter, not InfiniteScroll: this file imports the real component
// of that name from @inertiajs/react, and a default export cannot shadow it.
export default function InfiniteScrollChapter({
    chapter,
    posts,
    previous,
    next,
}: InfiniteScrollChapterProps) {
    // scrollProps is read directly from usePage(), the same real page-level metadata
    // mergeProps and deferredProps already are in earlier chapters, not passed down as a
    // prop of its own: verified in node_modules/@inertiajs/core/types/types.d.ts.
    const page = usePage();
    const scrollProps = page.scrollProps?.posts;
    const middlePage = Math.max(1, Math.ceil(posts.last_page / 2));

    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <div className="space-y-2">
                    <p className="text-sm">
                        Scroll the feed below toward its bottom edge to load
                        later posts, or toward its top edge to load earlier
                        ones. To exercise backward paging without scrolling all
                        the way up from page one, open the feed already in the
                        middle:
                    </p>
                    <Link
                        href={`/chapters/infinite-scroll?page=${middlePage}`}
                        className="text-sm underline"
                    >
                        Jump to page {middlePage} of {posts.last_page}
                    </Link>
                </div>
            }
            watchFor={
                <p className="mt-2">
                    Every scroll-triggered fetch is a partial reload naming only
                    posts, carrying a{' '}
                    <Term term="Merge intent">merge intent</Term> header the
                    InfiniteScroll component sets to append when it loads the
                    next page and prepend when it loads the previous one.
                    posts.data is a <Term term="Merge prop">merge prop</Term> at
                    that nested path, so each fetch grows the list on the edge
                    you scrolled toward rather than replacing it. Follow the
                    &quot;Jump to page&quot; link above and both edges already
                    have somewhere to go: previousPage and nextPage below are
                    both set from the very first response, because this is a
                    deep link into the middle of the feed, not its start.
                </p>
            }
            whenToUse={
                <p>
                    Reach for a <Term term="Scroll prop">scroll prop</Term> and
                    InfiniteScroll for a feed the reader is meant to keep
                    scrolling through in one direction, or in both, rather than
                    paging through with numbered links. Reach for a plain merge
                    prop and your own load-more button instead when the reader
                    triggers the next page explicitly, the way the comments feed
                    in the previous chapter does.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">
                    One paginator, wrapped by Inertia::scroll()
                </h2>
                <p className="mt-1">
                    posts is an ordinary Eloquent paginator, passed straight to
                    Lab::scroll() without reshaping it: the wrapper key, data by
                    default, already matches the key
                    LengthAwarePaginator::toArray() uses for its row list, so
                    the prop the client receives already looks like{' '}
                    {'{ data: [...], current_page, per_page, total, ... }'}.
                </p>
                {/* className lands on the "as" element itself (InfiniteScroll spreads any
                    extra prop onto it), which is the actual <ul>: a separate wrapping <ul>
                    around this component would put its own previous/next <div> slots inside
                    a list, valid only for <li> children. */}
                <InfiniteScroll
                    data="posts"
                    as="ul"
                    buffer={300}
                    className="mt-3 max-h-96 divide-y divide-neutral-200 overflow-y-auto dark:divide-neutral-800"
                    previous={({ loading, hasPrevious }) => (
                        <p className="py-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
                            {loading
                                ? 'Loading earlier posts…'
                                : hasPrevious
                                  ? ''
                                  : 'Start of the feed.'}
                        </p>
                    )}
                    next={({ loading, hasNext }) => (
                        <p className="py-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
                            {loading
                                ? 'Loading more posts…'
                                : hasNext
                                  ? ''
                                  : 'End of the feed.'}
                        </p>
                    )}
                >
                    {posts.data.map((post) => (
                        <li key={post.id} className="py-2 text-sm">
                            <p className="font-medium">{post.title}</p>
                            <p className="text-neutral-500 dark:text-neutral-400">
                                {post.author?.name ?? 'Unknown'} ·{' '}
                                {post.published_at}
                            </p>
                        </li>
                    ))}
                </InfiniteScroll>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    The metadata driving all of this
                </h2>
                <p className="mt-1">
                    Read from page.scrollProps.posts, the exact shape{' '}
                    <code className="font-mono">ScrollMetadata::toArray()</code>{' '}
                    plus the reset flag PropsResolver adds next to it produce.
                </p>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                    <div>
                        <dt className="font-medium">pageName</dt>
                        <dd className="font-mono">{scrollProps?.pageName}</dd>
                    </div>
                    <div>
                        <dt className="font-medium">previousPage</dt>
                        <dd className="font-mono">
                            {String(scrollProps?.previousPage)}
                        </dd>
                    </div>
                    <div>
                        <dt className="font-medium">nextPage</dt>
                        <dd className="font-mono">
                            {String(scrollProps?.nextPage)}
                        </dd>
                    </div>
                    <div>
                        <dt className="font-medium">currentPage</dt>
                        <dd className="font-mono">
                            {String(scrollProps?.currentPage)}
                        </dd>
                    </div>
                    <div>
                        <dt className="font-medium">reset</dt>
                        <dd className="font-mono">
                            {String(scrollProps?.reset)}
                        </dd>
                    </div>
                </dl>
            </section>
        </ChapterShell>
    );
}
