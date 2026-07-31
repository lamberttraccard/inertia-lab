import { Link, usePage } from '@inertiajs/react';

type Post = {
    id: number;
    title: string;
    excerpt: string;
    author: string;
};

type InstantVisitsDetailProps = {
    // Optional on purpose: the instant swap that renders this exact component renders it
    // with post undefined, since post is a page-specific prop and an instant swap seeds
    // its intermediate render from shared props only (verified in performInstantSwap(),
    // node_modules/@inertiajs/core/dist/index.js). A page that assumed post always exists
    // (post.title with no guard) would throw during that intermediate render.
    post?: Post;
};

// Not wrapped in ChapterShell: this is the detail page the instant-visits chapter's
// links point at, not a registered chapter of its own.
export default function InstantVisitsDetail({
    post,
}: InstantVisitsDetailProps) {
    // usePage().props is read directly, not passed down, so the key list shown below is
    // whatever this exact render actually received, not a snapshot taken before the real
    // response arrived.
    const page = usePage();
    const propKeys = Object.keys(page.props).sort();

    return (
        <div className="mx-auto max-w-2xl space-y-6 p-6">
            <header>
                <h1 className="text-2xl font-semibold">Post detail</h1>
                <p className="mt-2 text-neutral-600 dark:text-neutral-300">
                    The page an instant visit&apos;s component option points at.
                </p>
            </header>

            <section>
                <h2 className="text-lg font-semibold">post</h2>
                {post === undefined ? (
                    <p
                        role="status"
                        className="mt-1 rounded border border-dashed border-neutral-400 p-3 text-sm dark:border-neutral-600"
                    >
                        post is undefined right now. If you arrived here
                        instantly, the real response for this post is still in
                        flight; this exact paragraph is what an instant
                        visit&apos;s intermediate render actually looks like,
                        not a description of it.
                    </p>
                ) : (
                    <div className="mt-1 rounded border border-neutral-400 p-3 text-sm dark:border-neutral-600">
                        <p className="font-medium">{post.title}</p>
                        <p className="mt-1">{post.excerpt}</p>
                        <p className="mt-1 text-neutral-600 dark:text-neutral-300">
                            By {post.author}
                        </p>
                    </div>
                )}
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    Every top-level prop key on this exact render
                </h2>
                <p className="mt-1 font-mono text-sm">
                    [{propKeys.join(', ')}]
                </p>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                    During the instant window this list holds only whichever
                    keys the previous page&apos;s own sharedProps metadata
                    named, the props HandleInertiaRequests::share() and
                    shareOnce() contribute on every response, read directly from
                    performInstantSwap() in
                    node_modules/@inertiajs/core/dist/index.js; post is
                    page-specific, so it joins this list only once the real
                    response has actually arrived.
                </p>
            </section>

            <Link
                href="/chapters/instant-visits"
                className="inline-block rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
            >
                Back to the chapter
            </Link>
        </div>
    );
}
