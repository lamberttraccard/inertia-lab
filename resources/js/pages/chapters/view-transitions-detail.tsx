import { Link } from '@inertiajs/react';
import { supportsViewTransitions } from '@/lab/viewTransitionSupport';

type Post = {
    id: number;
    title: string;
    excerpt: string;
};

type ViewTransitionsDetailProps = {
    post: Post;
};

// Not wrapped in ChapterShell: this is the detail page each card in the grid links to,
// not a registered chapter of its own.
export default function ViewTransitionsDetail({
    post,
}: ViewTransitionsDetailProps) {
    const supported = supportsViewTransitions();

    return (
        <div className="mx-auto max-w-2xl space-y-6 p-6">
            <header>
                {/* Same view-transition-name as this post's card on the index page: the
                    browser matches old and new elements sharing a name and morphs
                    between their two positions and sizes, instead of only cross-fading
                    the page as a whole. */}
                <h1
                    className="text-2xl font-semibold"
                    style={{ viewTransitionName: `post-title-${post.id}` }}
                >
                    {post.title}
                </h1>
            </header>

            <p className="rounded border border-neutral-400 p-4 dark:border-neutral-600">
                {post.excerpt}
            </p>

            <p className="text-sm text-neutral-600 dark:text-neutral-300">
                This browser {supported ? 'supports' : 'does not support'} the
                View Transitions API right now, read live from{' '}
                <code className="font-mono">
                    &apos;startViewTransition&apos; in document
                </code>
                .
            </p>

            <Link
                href="/chapters/view-transitions"
                viewTransition
                className="inline-block rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
            >
                Back to the chapter
            </Link>
        </div>
    );
}
