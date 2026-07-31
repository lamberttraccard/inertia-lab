import { useHttp } from '@inertiajs/react';
import { ChapterShell } from '@/lab/ChapterShell';
import { CodeBlock } from '@/lab/CodeBlock';
import { Term } from '@/lab/Term';
import type { ChapterData, Neighbour } from './types';

type HttpRequestsProps = {
    chapter: ChapterData;
    previous: Neighbour | null;
    next: Neighbour | null;
};

export default function HttpRequests({
    chapter,
    previous,
    next,
}: HttpRequestsProps) {
    const http = useHttp({});

    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={() => {
                            http.get('/chapters/http-requests/ping');
                        }}
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        Send a GET with useHttp
                    </button>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                        processing: {String(http.processing)}, wasSuccessful:{' '}
                        {String(http.wasSuccessful)}
                    </p>
                    {http.response ? (
                        <CodeBlock
                            code={JSON.stringify(http.response, null, 2)}
                            lang="json"
                            className="overflow-x-auto"
                        />
                    ) : (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            No response yet.
                        </p>
                    )}
                </div>
            }
            watchFor={
                <p className="mt-2">
                    Click the button, then open the inspector&apos;s Wire tab:
                    it stays exactly as empty as it was before you clicked. That
                    is not the inspector failing to notice the request; the
                    response above is proof the request reached the server and
                    came back. Every capture this lab installs keys off the
                    X-Inertia header, and useHttp&apos;s own request never sets
                    it, verified directly in the submit() function inside{' '}
                    <code className="font-mono">
                        node_modules/@inertiajs/react/dist/index.js
                    </code>
                    , which builds its headers from only Accept and, when the
                    body is JSON, Content-Type. Your browser&apos;s own network
                    tab would show this request; this lab&apos;s inspector is
                    built to show visits, and deliberately will not show this,
                    because it is not one.
                </p>
            }
            whenToUse={
                <p>
                    Reach for <code className="font-mono">useHttp</code> for
                    exactly the case its name describes: calling the server
                    without wanting a new page, a new history entry, or props
                    swapped in. A search-as-you-type suggestion list, a
                    background ping, anything the current page keeps driving
                    after the response arrives, rather than handing control to a
                    new one.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">
                    The same shape as a form, not a{' '}
                    <Term term="Visit">visit</Term>
                </h2>
                <p className="mt-1">
                    <code className="font-mono">useHttp</code> exposes{' '}
                    <code className="font-mono">data</code>,{' '}
                    <code className="font-mono">processing</code>,{' '}
                    <code className="font-mono">errors</code>,{' '}
                    <code className="font-mono">progress</code> and{' '}
                    <code className="font-mono">wasSuccessful</code>, the same
                    fields <code className="font-mono">useForm</code> exposes,
                    plus <code className="font-mono">response</code>, which{' '}
                    <code className="font-mono">useForm</code> has no reason to
                    carry, verified against{' '}
                    <code className="font-mono">
                        node_modules/@inertiajs/react/types/useHttp.d.ts
                    </code>
                    . It even accepts a method and url up front, or a per-call{' '}
                    <code className="font-mono">get</code>,{' '}
                    <code className="font-mono">post</code>,{' '}
                    <code className="font-mono">put</code>,{' '}
                    <code className="font-mono">patch</code> and{' '}
                    <code className="font-mono">delete</code>, the way this page
                    calls <code className="font-mono">http.get()</code> above.
                    Nothing about reading its state or calling it should feel
                    unfamiliar after the forms chapter; what changed is what
                    happens to the page once it resolves, which is nothing at
                    all.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    An ordinary endpoint on the other end
                </h2>
                <p className="mt-1">
                    The button above points at a route whose controller returns
                    a plain{' '}
                    <code className="font-mono">response()-&gt;json()</code>,
                    never <code className="font-mono">Inertia::render()</code>.
                    There is nothing Inertia-specific to verify on the server
                    side of this chapter at all: the interesting behaviour, the
                    header that never gets sent, lives entirely in the client.
                </p>
            </section>
        </ChapterShell>
    );
}
