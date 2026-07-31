import { useEffect, useState } from 'react';
import { ChapterShell } from '@/lab/ChapterShell';
import { CodeBlock } from '@/lab/CodeBlock';
import { langForPath } from '@/lab/highlighter';
import { Term } from '@/lab/Term';
import type { ChapterData, Neighbour } from './types';

type DevtoolsAndTestingProps = {
    chapter: ChapterData;
    devtoolsEnabled: boolean;
    previous: Neighbour | null;
    next: Neighbour | null;
};

type SourceFile = { path: string; contents: string; lines: number };

type FileState =
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'loaded'; data: SourceFile };

// A second, standalone fetch of a single arbitrary platform file, deliberately outside
// the chapter shell's own SourceView: that component only ever shows a chapter's own
// server/client pair, and the two files this chapter needs (tests/Pest.php and its own
// test) are neither. Same allowlist, same failure discipline: an unreadable file says so.
function PlatformSourceFile({ path }: { path: string }) {
    const [state, setState] = useState<FileState>({ status: 'loading' });

    useEffect(() => {
        let cancelled = false;

        fetch(`/lab/source-file?path=${encodeURIComponent(path)}`, {
            headers: { Accept: 'application/json' },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(
                        `the server responded with ${response.status}`,
                    );
                }

                return response.json() as Promise<SourceFile>;
            })
            .then((data) => {
                if (!cancelled) {
                    setState({ status: 'loaded', data });
                }
            })
            .catch((error: unknown) => {
                if (!cancelled) {
                    setState({
                        status: 'error',
                        message:
                            error instanceof Error
                                ? error.message
                                : 'unknown error',
                    });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [path]);

    if (state.status === 'loading') {
        return (
            <p
                role="status"
                className="mt-2 text-neutral-500 dark:text-neutral-400"
            >
                Loading {path}.
            </p>
        );
    }

    if (state.status === 'error') {
        return (
            <p
                role="status"
                className="mt-2 border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
            >
                Could not load {path}: {state.message}
            </p>
        );
    }

    return (
        <div className="mt-2">
            <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                {state.data.path} ({state.data.lines} lines)
            </p>
            <CodeBlock
                code={state.data.contents}
                lang={langForPath(state.data.path)}
                className="mt-1 max-h-96 overflow-auto"
            />
        </div>
    );
}

export default function DevtoolsAndTesting({
    chapter,
    devtoolsEnabled,
    previous,
    next,
}: DevtoolsAndTestingProps) {
    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <p>
                    Right now, on this exact page load, devtoolsEnabled is{' '}
                    <strong>{String(devtoolsEnabled)}</strong>. There is no
                    button here that runs this chapter&apos;s test from the
                    page: read &quot;Why not a button&quot; below for why, then
                    read the two files under &quot;The test itself&quot;
                    instead.
                </p>
            }
            watchFor={
                <p className="mt-2">
                    This chapter has no inspector trick to watch: it is about
                    the two tools that replace this lab&apos;s own inspector
                    once you leave it. Everything below is either something to
                    install (the browser extension) or something already running
                    (this suite).
                </p>
            }
            whenToUse={
                <p>
                    Install the DevTools extension for any real Inertia
                    application you work on; this lab&apos;s own inspector
                    exists only because a teaching app cannot ask you to install
                    a browser extension before its first page loads. Reach for
                    inertiaPage()/assertInertiaPage() (or plain assertInertia(),
                    in an application where it works) in every feature test that
                    hits an Inertia route.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">The official DevTools</h2>
                <p className="mt-1">
                    A browser extension, not a package this application imports:
                    install it from the Chrome Web Store, or load an unpacked
                    build from the project&apos;s GitHub releases for another
                    Chromium browser. It needs a client adapter at{' '}
                    <code className="font-mono">^3.6</code> or later and a
                    Laravel adapter at <code className="font-mono">^3.2</code>{' '}
                    or later; this application runs{' '}
                    <code className="font-mono">@inertiajs/react 3.6.1</code>{' '}
                    and{' '}
                    <code className="font-mono">
                        inertiajs/inertia-laravel 3.2.1
                    </code>
                    , both at the floor that requires.
                </p>
                <p className="mt-2">
                    Once installed, it opens as its own panel in your
                    browser&apos;s developer tools, next to Elements and
                    Console, on any page it can record. Recording is controlled
                    by{' '}
                    <code className="font-mono">
                        config('inertia.devtools.enabled')
                    </code>
                    , which reads the{' '}
                    <code className="font-mono">INERTIA_DEVTOOLS_ENABLED</code>{' '}
                    environment variable: unset, as it is in this
                    application&apos;s .env, it defaults to on for the local
                    environment and off everywhere else (verified in{' '}
                    <code className="font-mono">
                        Inertia\DevTools\DevTools::enabled()
                    </code>
                    ). To use it against a deployed, non-local environment, set{' '}
                    <code className="font-mono">
                        INERTIA_DEVTOOLS_ENABLED=true
                    </code>{' '}
                    there and name a gate in{' '}
                    <code className="font-mono">INERTIA_DEVTOOLS_GATE</code>:{' '}
                    <code className="font-mono">
                        Inertia\DevTools\Http\Authorize
                    </code>{' '}
                    admits the local environment unconditionally and checks that
                    gate for the signed-in user everywhere else, so a production
                    install with no gate configured stays closed to everyone.
                </p>
                <h3 className="mt-3 font-medium">Its four tabs</h3>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                    <li>
                        <strong>Props</strong>: every prop the selected request
                        resolved, with a badge for the kind (deferred, optional,
                        merged, once, scroll) and a link to the exact file and
                        line it was shared or rendered from.
                    </li>
                    <li>
                        <strong>HTTP</strong>: the request and response headers
                        and bodies, with the same keys this application&apos;s
                        own{' '}
                        <code className="font-mono">
                            config('inertia.devtools.redact')
                        </code>{' '}
                        lists (passwords, tokens, cookies) replaced before
                        anything is written to disk.
                    </li>
                    <li>
                        <strong>Route</strong>: the matched route&apos;s name,
                        URI and controller action.
                    </li>
                    <li>
                        <strong>Page</strong>: the full page object once Inertia
                        finished handling the response, the same component,
                        props, url and version shape{' '}
                        <Term term="Page object">
                            this lab&apos;s own trace
                        </Term>{' '}
                        reads.
                    </li>
                </ul>
                <p className="mt-2">
                    A timeline down one side lists every request in order,
                    filterable by method, request type or status, so choosing an
                    entry there is what fills the four tabs.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    The inspector is not a smaller DevTools
                </h2>
                <p className="mt-1">
                    Both watch the same requests, and both read data this exact
                    codebase produces: the inspector&apos;s Wire tab and the
                    DevTools&apos; HTTP tab both show request and response
                    headers; the inspector&apos;s Trace tab and the
                    DevTools&apos; Props tab both come from watching the same
                    props resolve. Past that, they exist for different reasons.
                </p>
                <p className="mt-2">
                    The inspector is this lab&apos;s own teaching device: it is
                    bundled with this application specifically so a reader never
                    has to install anything before seeing the first request, and
                    it disappears the moment{' '}
                    <code className="font-mono">
                        App\Http\Middleware\InjectLabTrace
                    </code>{' '}
                    is removed, which nothing about a real Inertia application
                    requires.
                </p>
                <p className="mt-2">
                    The DevTools are the tool a team actually reaches for:
                    installed once per developer, working across every Inertia
                    application on their machine, with a persistent history on
                    disk (
                    <code className="font-mono">storage/inertia-devtools</code>,
                    pruned on a timer) that survives a page reload, which this
                    lab&apos;s own in-memory inspector does not.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    Why not a button that runs the test
                </h2>
                <p className="mt-1">
                    Triggering a nested test run from inside a request this same
                    application is serving would coincide, by construction, with
                    the dev server that served the page the button is on: there
                    is no way to click this button without that server already
                    running.
                </p>
                <p className="mt-2">
                    This project has already had to work around exactly that
                    combination (a concurrent run, or the SSR dev server left
                    running) producing spurious failures when running the real
                    suite from a terminal; putting the same combination behind a
                    button on a live page rather than removing it would be
                    choosing the least reliable way to demonstrate a testing
                    chapter. Showing the test file and the result of actually
                    running it, below, carries the same information without that
                    risk.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    Why assertInertia() does not appear in this suite
                </h2>
                <p className="mt-1">
                    The test below confirms both directions on this exact route:
                    assertInertia() fails once devtools is on, and passes on the
                    same route with devtools off, which is what isolates
                    devtools, not this application&apos;s own middleware, as the
                    cause.
                </p>
                <p className="mt-2">
                    assertInertia() and the official inertiaProps()/
                    inertiaPage() macros all resolve through{' '}
                    <code className="font-mono">
                        AssertableInertia::fromTestResponse()
                    </code>
                    , which calls{' '}
                    <code className="font-mono">assertViewHas('page')</code>{' '}
                    first: that needs{' '}
                    <code className="font-mono">Response::$original</code> to
                    still hold the view Inertia rendered. With the DevTools
                    recorder enabled, as it is by default in this
                    application&apos;s own local environment,{' '}
                    <code className="font-mono">
                        Inertia\Middleware::handle()
                    </code>{' '}
                    calls <code className="font-mono">respondedWith()</code>{' '}
                    after this application&apos;s own middleware has already
                    run, and that call injects the extension&apos;s own id tag
                    through a second{' '}
                    <code className="font-mono">setContent()</code>, which
                    overwrites <code className="font-mono">$original</code> back
                    to a plain string.
                </p>
                <p className="mt-2">
                    This application&apos;s own{' '}
                    <code className="font-mono">InjectLabTrace</code> middleware
                    does the same kind of content swap for its own trace script
                    tag, and survives it only because it deliberately restores{' '}
                    <code className="font-mono">$original</code> right
                    afterward, a step the extension&apos;s recorder has no
                    reason to take.
                </p>
                <p className="mt-2">
                    On a partial reload the same assertion fails for an
                    unrelated, permanent reason: those responses are a bare JSON
                    body that never touches a view at all, with or without
                    devtools.
                </p>
                <p className="mt-2">
                    tests/Pest.php adds inertiaPage(), assertInertiaPage() and
                    labTrace() to read a page object and this lab&apos;s own
                    prop trace directly from the response body instead, and
                    every chapter test in this application, including this one,
                    uses them.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">The test itself</h2>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                    Read from disk on this request, the same way the
                    inspector&apos;s own Source tab reads a chapter&apos;s
                    controller and page.
                </p>
                <p className="mt-2 text-sm">
                    <code className="font-mono">
                        php artisan test
                        tests/Feature/Chapters/DevtoolsAndTestingTest.php
                    </code>{' '}
                    produced this, one particular run (the duration varies, the
                    counts do not):
                </p>
                <CodeBlock
                    code='{"tool":"pest","result":"passed","tests":3,"passed":3,"assertions":23,"duration_ms":223}'
                    lang="json"
                    className="mt-1 overflow-x-auto"
                />
                <PlatformSourceFile path="tests/Feature/Chapters/DevtoolsAndTestingTest.php" />
                <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
                    And the helpers it, and every other chapter test, calls:
                </p>
                <PlatformSourceFile path="tests/Pest.php" />
            </section>
        </ChapterShell>
    );
}
