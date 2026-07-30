import { Link } from '@inertiajs/react';

type ErrorHandlingPageProps = {
    status: number;
    message: string;
    requestPath: string;
};

// Not wrapped in ChapterShell, and not a registered chapter of its own: this is the page
// AppServiceProvider::configureInertiaExceptionHandling() names in Inertia::render() when a
// request under chapters/error-handling/* throws. Reaching it at all is the chapter's own
// lesson, so it renders like any other Inertia page rather than a special-cased screen.
export default function ErrorHandlingPage({
    status,
    message,
    requestPath,
}: ErrorHandlingPageProps) {
    return (
        <div className="mx-auto max-w-2xl space-y-6 p-6">
            <header>
                <h1 className="text-2xl font-semibold">
                    {status} on {requestPath}
                </h1>
                <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                    {message === ''
                        ? '(the exception carried no message)'
                        : message}
                </p>
            </header>

            <p>
                This screen is a normal Inertia page, not the client&apos;s
                error dialog: the response that produced it carries the
                X-Inertia header, because AppServiceProvider registered
                Inertia::handleExceptionsUsing() to render it that way for every
                request under chapters/error-handling/*.
            </p>

            <Link
                href="/chapters/error-handling"
                className="inline-block rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
            >
                Back to the chapter
            </Link>
        </div>
    );
}
