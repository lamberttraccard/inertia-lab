import { router } from '@inertiajs/react';
import { useState } from 'react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';
import type { ChapterData, Neighbour } from './types';

type AssetVersioningProps = {
    chapter: ChapterData;
    serverVersion: string;
    previous: Neighbour | null;
    next: Neighbour | null;
};

type ChangeStatus = 'idle' | 'pending' | 'error';

// Laravel's own CSRF middleware reads this cookie's value back from the X-XSRF-TOKEN
// header, still encrypted, and decrypts it there: this is the same reading-and-resending
// Inertia's own client does automatically for every visit, spelled out here because bump
// and reset deliberately are not visits (see the comment on the button handler below).
function xsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

export default function AssetVersioning({
    chapter,
    serverVersion,
    previous,
    next,
}: AssetVersioningProps) {
    const [outOfBandVersion, setOutOfBandVersion] = useState<string | null>(
        null,
    );
    const [status, setStatus] = useState<ChangeStatus>('idle');

    // Deliberately a plain fetch, not router.post(): the client treats page.get().version,
    // whatever this same tab last saw, as the version to send on every future visit, and
    // updates it from the version field of every successfully processed Inertia response,
    // POST included. A response built through Inertia::render() here would resynchronise
    // this tab immediately, and the mismatch this chapter exists to demonstrate would
    // never be reproducible from it again.
    async function changeVersion(url: string) {
        setStatus('pending');

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'X-XSRF-TOKEN': xsrfToken() },
            });

            if (!response.ok) {
                throw new Error(`the server responded with ${response.status}`);
            }

            const data = (await response.json()) as { version: string };
            setOutOfBandVersion(data.version);
            setStatus('idle');
        } catch {
            setStatus('error');
        }
    }

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
                                changeVersion('/chapters/asset-versioning/bump')
                            }
                            className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                        >
                            Bump the server&apos;s asset version
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                changeVersion(
                                    '/chapters/asset-versioning/reset',
                                )
                            }
                            className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                        >
                            Restore the real asset version
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                router.get('/chapters/asset-versioning')
                            }
                            className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                        >
                            Visit this page again
                        </button>
                    </div>

                    {status === 'error' && (
                        <p
                            role="status"
                            className="border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
                        >
                            Could not reach the bump or reset endpoint.
                        </p>
                    )}

                    <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                        <div>
                            <dt className="font-medium">
                                serverVersion prop (from the last visit)
                            </dt>
                            <dd className="font-mono break-all">
                                {serverVersion}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-medium">
                                Server&apos;s real version right now (fetched
                                out of band)
                            </dt>
                            <dd className="font-mono break-all">
                                {outOfBandVersion ?? 'not checked yet'}
                            </dd>
                        </div>
                    </dl>
                </div>
            }
            watchFor={
                <p className="mt-2">
                    Bump and reset are plain fetch calls rather than{' '}
                    <code className="font-mono">router.post</code>: any
                    Inertia-processed response updates this tab&apos;s own
                    remembered version immediately, which would resynchronise it
                    before the mismatch below ever had a chance to happen, and
                    for the same reason neither one shows up in the
                    inspector&apos;s Wire tab either. Bump, then click
                    &quot;Visit this page again&quot;: the request still carries
                    the version this tab booted with, the server now answers
                    with a different one, and{' '}
                    <code className="font-mono">
                        Inertia\Middleware::handle()
                    </code>{' '}
                    turns that GET into a 409 with X-Inertia-Location. Watch the
                    address bar, not the inspector: the client&apos;s own
                    response to a 409 is{' '}
                    <code className="font-mono">locationVisit(url)</code>, which
                    checks{' '}
                    <code className="font-mono">
                        isSameUrlWithoutHash(window.location, url)
                    </code>{' '}
                    and either reloads when the URL is unchanged or assigns{' '}
                    <code className="font-mono">window.location.href</code> when
                    it differs. This button always revisits the exact page you
                    are already on, so the unchanged-URL branch is what actually
                    runs here:{' '}
                    <code className="font-mono">window.location.reload()</code>,
                    a full browser navigation away from this Inertia session
                    entirely, so the inspector has nothing left to record and
                    the page you land on is a fresh document load, this time
                    booted with the bumped version. Chapter 3&apos;s{' '}
                    <code className="font-mono">Inertia::location()</code>{' '}
                    control exercises the other branch, since it targets a URL
                    outside this application entirely. Click &quot;Restore the
                    real asset version&quot; when you are done: it clears the
                    override this app stored in your session, and is the only
                    way back to the build&apos;s own version once you have
                    bumped it. Restoring does not resynchronise this tab by
                    itself, though, for the same reason bumping did not: it is a
                    plain fetch too. Click &quot;Visit this page again&quot;
                    once more and you will see one last 409, in the opposite
                    direction this time, before this tab is fully back to
                    normal.
                </p>
            }
            whenToUse={
                <p>
                    This is not a control to add to a real application. The real
                    trigger is an ordinary deploy: a new{' '}
                    <code className="font-mono">
                        public/build/manifest.json
                    </code>{' '}
                    changes what{' '}
                    <code className="font-mono">
                        Illuminate\Foundation\Vite
                    </code>{' '}
                    hashes into the version Inertia sends, with nothing in this
                    application's own code needing to change.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">
                    A header on every <Term term="Visit">visit</Term>
                </h2>
                <p className="mt-1">
                    Every visit carries whatever{' '}
                    <Term term="Asset version">asset version</Term> this tab
                    last saw, as X-Inertia-Version. Inertia\Middleware::
                    handle() compares that header, on a GET only, against{' '}
                    <code className="font-mono">Inertia::getVersion()</code>{' '}
                    computed fresh for this request; a mismatch calls{' '}
                    <code className="font-mono">Inertia::location()</code> with
                    the current URL, which for a genuine visit answers a bare
                    409 with X-Inertia-Location rather than a page, the same 409
                    chapter 3 observed from an explicit call to that method.
                </p>
                <h2 className="mt-4 text-lg font-semibold">
                    Where this app stores the override
                </h2>
                <p className="mt-1">
                    This installed version computes the real version from{' '}
                    <code className="font-mono">
                        public/build/manifest.json
                    </code>
                    &apos;s hash, which nothing short of a real build changes.
                    To make the mismatch reachable on demand,{' '}
                    <code className="font-mono">
                        HandleInertiaRequests::version()
                    </code>{' '}
                    checks a session key first and only falls back to that hash
                    when the key is absent. Bump writes a random value there;
                    reset removes it entirely, and is the visible way back this
                    session cannot do without.
                </p>
            </section>
        </ChapterShell>
    );
}
