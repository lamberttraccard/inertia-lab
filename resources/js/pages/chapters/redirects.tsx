import { router } from '@inertiajs/react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';
import type { ChapterData, Neighbour } from './types';

type RedirectsProps = {
    chapter: ChapterData;
    lastAction: string;
    previous: Neighbour | null;
    next: Neighbour | null;
};

export default function Redirects({
    chapter,
    lastAction,
    previous,
    next,
}: RedirectsProps) {
    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.post('/chapters/redirects/post')}
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        router.post, then redirect back
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            router.delete('/chapters/redirects/delete')
                        }
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        router.delete, then redirect back
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            router.get('/chapters/redirects/location')
                        }
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        Visit a route calling Inertia::location()
                    </button>
                </div>
            }
            watchFor={
                <p className="mt-2">
                    The first two buttons land back on this same page: watch
                    lastAction below change once the follow-up GET renders. The
                    wire strip&apos;s own entry for that click shows 200, not
                    302 or 303: XMLHttpRequest follows a same-origin redirect on
                    its own, so what reaches this app&apos;s capture is the
                    final response, not the redirect itself. Your browser&apos;s
                    own network tab does show the intermediate hop, or read this
                    chapter&apos;s test file, which asserts the real number
                    directly against the unfollowed response. The third button
                    leaves this application entirely, for the URL of
                    Inertia&apos;s own redirect documentation; if you want to
                    see its 409 response and the X-Inertia-Location header
                    rather than just the address bar changing, open your
                    browser&apos;s network tab before clicking it, since this
                    app&apos;s own wire strip cannot survive the navigation
                    away.
                </p>
            }
            whenToUse={
                <p>
                    Reach for a redirect after every mutation that succeeds. The
                    forced 303 is not something to configure: it exists so that
                    a page reload, or the user pressing back and forward,
                    replays as a GET instead of resubmitting the DELETE.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">
                    What actually came back
                </h2>
                <p className="mt-1">
                    Observed against this installed version, not assumed:
                    router.post above gets an ordinary 302, the same status
                    Laravel&apos;s <code className="font-mono">back()</code>{' '}
                    always uses. router.delete gets 303. Two independent places
                    in inertiajs/inertia-laravel agree on the rewrite:{' '}
                    <code className="font-mono">
                        Inertia\Middleware::handle()
                    </code>{' '}
                    (the base class this app&apos;s own Inertia middleware
                    extends) and{' '}
                    <code className="font-mono">
                        Inertia\Middleware\EnsureGetOnRedirect
                    </code>{' '}
                    (pushed onto every request by the package&apos;s own service
                    provider). Both rewrite a 302 to 303 only when the request
                    method was PUT, PATCH or DELETE and the request carried the
                    X-Inertia header. POST is deliberately left out of that list
                    in both places: browsers and XHR clients already turn a 302
                    after POST into a GET on their own, so nothing needs
                    forcing. Both numbers describe what the server actually
                    sent, confirmed by this chapter&apos;s own test against the
                    unfollowed response; the wire strip below cannot show them
                    directly, for the reason explained under What to watch.
                </p>
                <h2 className="mt-4 text-lg font-semibold">
                    A location, not a page
                </h2>
                <p className="mt-1">
                    <code className="font-mono">Inertia::location()</code> is
                    for a redirect Inertia cannot render as a page, because it
                    goes somewhere this application does not control. For a
                    genuine <Term term="Visit">visit</Term> it answers 409 with
                    an empty body and an X-Inertia-Location header carrying the
                    target; the client reads that as an instruction to set
                    window.location itself, a full browser navigation rather
                    than a visit. Outside of a visit, the exact same call is an
                    ordinary redirect response.
                </p>
                <p className="mt-4">
                    Last action recorded by this page:{' '}
                    <strong>{lastAction}</strong>.
                </p>
            </section>
        </ChapterShell>
    );
}
