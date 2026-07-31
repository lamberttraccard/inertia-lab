import { router } from '@inertiajs/react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';
import type { ChapterData, Neighbour } from './types';

type AlwaysPropsProps = {
    chapter: ChapterData;
    normal: string;
    notice: string;
    status: string;
    previous: Neighbour | null;
    next: Neighbour | null;
};

export default function AlwaysProps({
    chapter,
    normal,
    notice,
    status,
    previous,
    next,
}: AlwaysPropsProps) {
    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            router.post('/chapters/always-props/flash')
                        }
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        Flash a message
                    </button>
                    <button
                        type="button"
                        onClick={() => router.reload({ only: ['normal'] })}
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        router.reload only: [&apos;normal&apos;]
                    </button>
                </div>
            }
            watchFor={
                <>
                    <p className="mt-2">
                        Click &quot;router.reload only:
                        [&apos;normal&apos;]&quot; at any time: you asked for
                        exactly one prop, and normal, notice and errors all
                        arrive anyway. An always prop bypasses the only and
                        except check entirely rather than merely surviving it:
                        the trace agrees, showing only normal as genuinely
                        requested while notice was never filtered at all.
                    </p>
                    <p className="mt-2">
                        status is a real session flash and tells a trickier,
                        honest story. Click &quot;Flash a message&quot; and it
                        updates immediately, but that response is a completely
                        ordinary full load (the server redirects back, and a
                        full load always includes every prop, always() or not),
                        so it does not yet prove anything about always(). Click
                        &quot;router.reload only: [&apos;normal&apos;]&quot;
                        right afterwards and status has already reverted to its
                        default. That is not always() failing: Laravel keeps a
                        flashed value for exactly one request after the one that
                        set it, and the redirect&apos;s own response back to
                        this page already was that one request, gone before you
                        can click anything else. This chapter&apos;s own test
                        proves always() genuinely protects status instead, by
                        sending a partial reload as the literal first request
                        after the flash, ahead of any redirect that would
                        otherwise consume it.
                    </p>
                </>
            }
            whenToUse={
                <p>
                    Reach for always on anything the reader must see regardless
                    of which panel triggered the current request: a global
                    notice, anything in the same category as errors. For a flash
                    message specifically, always only protects it from a partial
                    filter during requests that happen while it is still live in
                    the session; it cannot make a flashed value outlive the one
                    request Laravel already grants it. Overusing always defeats
                    the point of partial reloads, since every always prop runs
                    on every single request, partial or not.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">
                    One request, three passengers
                </h2>
                <p className="mt-1">
                    normal is an ordinary closure, request-scoped:{' '}
                    <span className="font-mono">{normal}</span>. notice is
                    wrapped in <Term term="Always prop">Inertia::always()</Term>
                    : &quot;{notice}&quot;. status reads a real session flash,
                    also wrapped in always: &quot;{status}&quot;.
                </p>
            </section>
        </ChapterShell>
    );
}
