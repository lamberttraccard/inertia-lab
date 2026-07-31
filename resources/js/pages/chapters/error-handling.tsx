import { router } from '@inertiajs/react';
import { ChapterShell } from '@/lab/ChapterShell';
import { CodeBlock } from '@/lab/CodeBlock';
import { Term } from '@/lab/Term';
import type { ChapterData, Neighbour } from './types';

const REGISTRATION = `Inertia::handleExceptionsUsing(function (ExceptionResponse $exceptionResponse) {
    if (! $exceptionResponse->request->is('chapters/error-handling/*')) {
        return null;
    }

    return $exceptionResponse
        ->render('chapters/error-handling-page', [
            'status' => $exceptionResponse->statusCode(),
            'message' => $exceptionResponse->exception->getMessage(),
            'requestPath' => '/'.$exceptionResponse->request->path(),
        ])
        ->usingMiddleware(HandleInertiaRequests::class)
        ->rootView('app')
        ->withSharedData();
});`;

function triggerBadCsrfToken() {
    // A real, working XSRF-TOKEN cookie is normally an encrypted string only the server
    // can produce; overwriting it client-side with plain text is what makes the token
    // wrong on purpose. The client still reads whatever is in the cookie and sends it as
    // X-XSRF-TOKEN (verified in node_modules/@inertiajs/core/dist/index.js), so this is
    // enough to make RequireCsrfTokenMatch's own token decryption fail, the same way it
    // would fail inside PreventRequestForgery::getTokenFromRequest(), which this route
    // does not use (see the "why this route needs its own middleware" section below).
    document.cookie = 'XSRF-TOKEN=deliberately-invalid-token; path=/';
    router.post('/chapters/error-handling/protected');
}

type ErrorHandlingProps = {
    chapter: ChapterData;
    status: string;
    previous: Neighbour | null;
    next: Neighbour | null;
};

export default function ErrorHandling({
    chapter,
    status,
    previous,
    next,
}: ErrorHandlingProps) {
    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                router.post(
                                    '/chapters/error-handling/protected',
                                )
                            }
                            className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                        >
                            Submit normally (valid token)
                        </button>
                        <button
                            type="button"
                            onClick={triggerBadCsrfToken}
                            className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                        >
                            Submit with a wrong CSRF token (419)
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                router.get('/chapters/error-handling/nowhere')
                            }
                            className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                        >
                            Visit a URL with no route (404)
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                router.post('/chapters/error-handling/crash')
                            }
                            className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                        >
                            Trigger a real exception (500)
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                router.get('/chapters/error-handling/plain')
                            }
                            className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                        >
                            Visit a non-Inertia response
                        </button>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                        Last protected-action result: {status}
                    </p>
                </div>
            }
            watchFor={
                <p className="mt-2">
                    The first four buttons each throw inside the request cycle.
                    All four land on a normal page with its own link back to
                    this chapter, because the{' '}
                    <Term term="Exception response">exception response</Term>{' '}
                    registered below renders one for every request under
                    chapters/error-handling/*. The last button is not an
                    exception at all: nothing here throws, so it opens the same
                    dialog chapter 5&apos;s non-Inertia route already showed,
                    dismissed by clicking outside it. Watch the Wire tab: the
                    three thrown responses each carry the X-Inertia header
                    despite their error status, which is what tells the client
                    to render the page instead of that dialog.
                </p>
            }
            whenToUse={
                <p>
                    Register Inertia::handleExceptionsUsing() once, in a service
                    provider&apos;s boot(), for any exception the reader of a
                    deployed application should see as part of the application
                    rather than as a framework error page. Scope the callback to
                    the routes that need it, the way this one checks the request
                    path first: a global, unscoped registration would change how
                    every other exception in the application renders too.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">
                    The registration, in full
                </h2>
                <p className="mt-1">
                    This lives in AppServiceProvider::boot(), not in this
                    chapter&apos;s own controller: it applies to every request
                    matching the path check inside it, not to one route.
                    Verified method by method against{' '}
                    <code className="font-mono">
                        vendor/inertiajs/inertia-laravel/src/ExceptionResponse.php
                    </code>
                    .
                </p>
                <CodeBlock
                    code={REGISTRATION}
                    lang="php"
                    className="mt-2 overflow-x-auto"
                />
                <dl className="mt-3 space-y-2 text-sm">
                    <div>
                        <dt className="font-mono font-medium">render()</dt>
                        <dd>
                            Names the component and props for the page this
                            exception should produce, the same two arguments
                            Inertia::render() takes anywhere else.
                        </dd>
                    </div>
                    <div>
                        <dt className="font-mono font-medium">
                            usingMiddleware()
                        </dt>
                        <dd>
                            Names the Inertia middleware class to read
                            version(), rootView(), share() and shareOnce() from.
                            Left unset, ExceptionResponse looks for one on the
                            matched route first, then falls back to scanning the
                            kernel&apos;s own middleware groups for any class
                            extending Inertia\Middleware, which is only reliable
                            because this application&apos;s
                            HandleInertiaRequests sits directly in the web group
                            (bootstrap/app.php) rather than inside a route
                            group.
                        </dd>
                    </div>
                    <div>
                        <dt className="font-mono font-medium">rootView()</dt>
                        <dd>
                            Names the Blade view to wrap the page in on a full
                            document load. Set here to &quot;app&quot;, the same
                            default HandleInertiaRequests already uses, so this
                            call changes nothing by itself; it exists to show
                            the method is there when a chapter needed a
                            different root view.
                        </dd>
                    </div>
                    <div>
                        <dt className="font-mono font-medium">
                            withSharedData()
                        </dt>
                        <dd>
                            Runs the resolved middleware&apos;s share() and
                            shareOnce(), the same calls HandleInertiaRequests
                            performs on every ordinary request. Without it, the
                            rendered page above would be missing demoUser,
                            unreadNotifications and every other shared prop.
                        </dd>
                    </div>
                    <div>
                        <dt className="font-mono font-medium">statusCode()</dt>
                        <dd>
                            Reads the status Laravel&apos;s own exception
                            handler already chose for this exception (404, 419,
                            500) off the response ExceptionResponse wraps, used
                            above as a prop and to set the final response&apos;s
                            own status code once render() builds it.
                        </dd>
                    </div>
                </dl>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    Why withSharedData() is not optional here
                </h2>
                <p className="mt-1">
                    Confirmed by reading{' '}
                    <code className="font-mono">
                        Illuminate\Routing\Router::findRoute()
                    </code>{' '}
                    and{' '}
                    <code className="font-mono">
                        Inertia\Middleware::handle()
                    </code>
                    , then checked against this exact application by comparing
                    Inertia::getShared() at the moment the exception handler
                    runs: a URL with no matching route never runs any of this
                    application&apos;s own web middleware at all,
                    HandleInertiaRequests included, because Laravel&apos;s
                    router throws before it ever builds that middleware
                    pipeline. Shared data is empty at that point, not merely
                    unrequested. A wrong CSRF token and a plain 500 both fail
                    further into the pipeline, after HandleInertiaRequests has
                    already run: RequireCsrfTokenMatch, the middleware that
                    actually rejects the bad token on this route (see below for
                    why it is not PreventRequestForgery), sits after it in the
                    resolved order, and crash() throws from inside a controller
                    the router had already dispatched to. Shared data already
                    exists by the time either exception reaches this callback,
                    so withSharedData() there only repeats work already done.
                    Calling it every time regardless is what makes all three
                    renders consistent without having to remember which case
                    needed it.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    Why the 419 button needs its own middleware
                </h2>
                <p className="mt-1">
                    A wrong token alone is not actually enough to produce this
                    response on the application&apos;s own default CSRF
                    middleware. PreventRequestForgery::hasValidOrigin() trusts a
                    same-origin browser&apos;s own Sec-Fetch-Site header ahead
                    of the token, and this browser, like every current browser,
                    sends Sec-Fetch-Site: same-origin on every request to this
                    application, confirmed directly rather than assumed. That
                    means the token is never even examined for a plain
                    same-origin click under the default middleware. The route
                    behind this button (/chapters/error-handling/protected)
                    replaces it with
                    app/Http/Middleware/RequireCsrfTokenMatch.php, a standalone
                    reimplementation of just the token check, so the
                    button&apos;s label stays true for the browser actually
                    reading this page.
                </p>
            </section>
        </ChapterShell>
    );
}
