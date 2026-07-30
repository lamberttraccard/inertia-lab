type Post = {
    id: number;
    title: string;
    excerpt: string;
};

type RememberingStateDetailProps = {
    post: Post;
};

// Not wrapped in ChapterShell: this is the detail page the remembering-state chapter's
// two filtered lists link to, not a registered chapter of its own.
export default function RememberingStateDetail({
    post,
}: RememberingStateDetailProps) {
    return (
        <div className="mx-auto max-w-2xl space-y-6 p-6">
            <header>
                <h1 className="text-2xl font-semibold">Post detail</h1>
                <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                    Leaving this page through the button below, rather than a
                    link, is what makes the difference the chapter is about
                    observable.
                </p>
            </header>

            <div className="rounded border border-neutral-400 p-3 text-sm dark:border-neutral-600">
                <p className="font-medium">{post.title}</p>
                <p className="mt-1">{post.excerpt}</p>
            </div>

            <button
                type="button"
                onClick={() => window.history.back()}
                className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
            >
                Go back
            </button>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                This calls the browser&apos;s own{' '}
                <code className="font-mono">window.history.back()</code>, the
                same navigation your browser&apos;s own back button performs. A
                remembered value is restored only by this kind of navigation: it
                is read from the history entry the browser is returning to, not
                from a fresh request to the server.
            </p>
        </div>
    );
}
