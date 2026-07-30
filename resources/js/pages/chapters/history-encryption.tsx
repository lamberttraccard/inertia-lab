import { router, usePage } from '@inertiajs/react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';
import type { ChapterData, Neighbour } from './types';

type HistoryEncryptionProps = {
    chapter: ChapterData;
    renderedAt: string;
    previous: Neighbour | null;
    next: Neighbour | null;
};

export default function HistoryEncryption({
    chapter,
    renderedAt,
    previous,
    next,
}: HistoryEncryptionProps) {
    // Read directly from the live page object, the same one the wire strip's "Page
    // object" details panel below shows for this exact response: encryptHistory and
    // clearHistory are top-level Page fields, verified in
    // node_modules/@inertiajs/core/types/types.d.ts, not props.
    const page = usePage();

    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <div className="space-y-3">
                    <p className="text-sm">
                        This page was rendered at{' '}
                        <code className="font-mono">{renderedAt}</code>. Reload
                        it a few times (a plain browser reload, not a button)
                        and watch that value change on the full document each
                        time, then press the button below.
                    </p>
                    <button
                        type="button"
                        onClick={() =>
                            router.post('/chapters/history-encryption/clear')
                        }
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        Clear history
                    </button>
                    <p className="text-sm">
                        This page&apos;s own{' '}
                        <code className="font-mono">encryptHistory</code> right
                        now:{' '}
                        <strong>{String(Boolean(page.encryptHistory))}</strong>.{' '}
                        <code className="font-mono">clearHistory</code>:{' '}
                        <strong>{String(Boolean(page.clearHistory))}</strong>.
                    </p>
                </div>
            }
            watchFor={
                <p className="mt-2">
                    Click the button, then open the Page object details in the
                    wire strip below for that request: it carries{' '}
                    <code className="font-mono">clearHistory: true</code>, and
                    the line above updates to match. Every render of this route,
                    including that one, also carries{' '}
                    <code className="font-mono">encryptHistory: true</code>{' '}
                    (verified against{' '}
                    <code className="font-mono">
                        vendor/inertiajs/inertia-laravel/src/Response.php
                    </code>
                    , which only adds either key to the page object at all when
                    it is true, never as an explicit false). Reload the page
                    once after clicking: the line above reads{' '}
                    <code className="font-mono">clearHistory: false</code>{' '}
                    again, because that flag is a one-shot instruction for the
                    single response that carried it, read and discarded on the
                    server the moment it renders.
                </p>
            }
            whenToUse={
                <p>
                    Turn <Term term="Encrypted history">encryptHistory</Term> on
                    for any route that ever shows data scoped to whoever is
                    signed in. Call{' '}
                    <code className="font-mono">clearHistory()</code> from the
                    action that signs someone out, right before it redirects to
                    wherever a signed-out visitor lands.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">
                    What clearing actually breaks
                </h2>
                <p className="mt-1">
                    <code className="font-mono">encryptHistory()</code> makes
                    the client encrypt each history entry it pushes for this
                    route with a key held in{' '}
                    <code className="font-mono">sessionStorage</code>, verified
                    in{' '}
                    <code className="font-mono">
                        node_modules/@inertiajs/core/dist/index.js
                    </code>
                    . <code className="font-mono">clearHistory()</code> does not
                    touch any of those already-written entries directly: it
                    deletes that key. Every entry encrypted under it becomes
                    permanently unreadable from that moment on, which is the
                    actual point: a signed-out visitor pressing back cannot be
                    shown the previous session&apos;s screen, because nothing on
                    this device can decrypt it any more, not even this
                    application.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    What pressing back from here actually does
                </h2>
                <p className="mt-1">
                    Clicking the button above does not leave a stale encrypted
                    copy of this page sitting one step back in your history:
                    since the action redirects back to this exact URL, the
                    client&apos;s own same-URL check (
                    <code className="font-mono">isSameUrlWithoutHash</code> in{' '}
                    <code className="font-mono">
                        node_modules/@inertiajs/core/dist/index.js
                    </code>
                    ) forces a{' '}
                    <code className="font-mono">history.replaceState</code>{' '}
                    rather than a <code className="font-mono">pushState</code>,
                    confirmed live by watching{' '}
                    <code className="font-mono">window.history.length</code>{' '}
                    stay unchanged across the click. Pressing back from here
                    goes to whatever page you were on before you opened this
                    chapter, not to a stale snapshot of it, because that
                    snapshot was overwritten, not appended after.
                </p>
                <p className="mt-1">
                    An entry that genuinely cannot be decrypted, because it sits
                    further back in history than whatever this button just
                    replaced, is still not shown broken or blank. Reading{' '}
                    <code className="font-mono">handlePopstateEvent</code> and
                    the <code className="font-mono">missingHistoryItem</code>{' '}
                    handler it falls back to in the same file shows the
                    installed client catching that failure itself and issuing a
                    fresh visit to whatever URL the browser had already
                    navigated to, in place, rather than leaving the old
                    encrypted snapshot on screen or showing nothing. This
                    page&apos;s own button does not manufacture that exact
                    situation for you to click through; the practical way back
                    from this chapter, clearing included, stays what it is on
                    every chapter regardless: the previous and next links in the
                    footer below, and the address bar, which still answers to
                    this same URL on a plain reload no matter what any history
                    entry did or did not keep.
                </p>
            </section>
        </ChapterShell>
    );
}
