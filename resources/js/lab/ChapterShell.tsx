import { Head, Link } from '@inertiajs/react';
import { useEffect } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';
import { ChapterHeader } from './ChapterHeader';
import { Inspector } from './Inspector';
import type { WireEntry } from './types';
import { markChapterVisited } from './visited';

type ChapterMeta = {
    slug: string;
    title: string;
    question: string;
    concept: string;
    translationFrom: string;
    translationTo: string;
    docsUrl: string;
    serverFile: string;
    clientFile: string;
    partLabel: string;
    order: number;
};

// The section order below is fixed and lives only here, so no chapter can drift from the
// format: a header for orientation, the question, the thing to try, the chapter's own
// content, what to watch, the translation callout, when to reach for this, a link to the
// official docs. Everything that is evidence rather than lesson (the wire, the lifecycle,
// the trace, the round-trip diagram, the source) lives in the inspector instead, read
// once and consulted as needed rather than stacked into the same scroll as the prose.
export function ChapterShell({
    chapter,
    tryThis,
    watchFor,
    whenToUse,
    previous,
    next,
    children,
    onWireEntry,
}: PropsWithChildren<{
    chapter: ChapterMeta;
    tryThis: ReactNode;
    watchFor: ReactNode;
    whenToUse: ReactNode;
    previous: { slug: string; title: string } | null;
    next: { slug: string; title: string } | null;
    // Lets a chapter keep its own history of entries (partial-reloads compares payload
    // sizes across several requests) without installing a second capture on top of the
    // inspector's own: every entry the inspector records is forwarded here too, if given.
    onWireEntry?: (entry: WireEntry) => void;
}>) {
    useEffect(() => {
        markChapterVisited(chapter.slug);
    }, [chapter.slug]);

    return (
        <div className="mx-auto max-w-[90rem] p-6">
            <Head title={chapter.title} />

            <ChapterHeader chapter={chapter} previous={previous} next={next} />

            <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start lg:gap-12">
                <article className="max-w-3xl space-y-8">
                    <header>
                        <h1 className="text-2xl font-semibold">
                            {chapter.title}
                        </h1>
                        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                            {chapter.question}
                        </p>
                    </header>

                    <section aria-labelledby="try">
                        <h2 id="try" className="text-lg font-semibold">
                            Try this
                        </h2>
                        {tryThis}
                    </section>

                    {children}

                    <section aria-labelledby="watch">
                        <h2 id="watch" className="text-lg font-semibold">
                            What to watch
                        </h2>
                        {watchFor}
                    </section>

                    <section aria-labelledby="translate">
                        <h2 id="translate" className="text-lg font-semibold">
                            Coming from an API-first application
                        </h2>
                        <p>You would have written: {chapter.translationFrom}</p>
                        <p>Here: {chapter.translationTo}</p>
                        <p className="mt-2 text-sm">
                            <Link
                                href="/lab/where-did-it-go"
                                className="underline"
                            >
                                See every artefact this translates, on one page
                            </Link>
                        </p>
                    </section>

                    <section aria-labelledby="when">
                        <h2 id="when" className="text-lg font-semibold">
                            When to reach for this
                        </h2>
                        {whenToUse}
                    </section>

                    <p className="text-sm">
                        <a
                            href={chapter.docsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="underline"
                        >
                            Official documentation
                        </a>
                    </p>
                </article>

                <Inspector
                    slug={chapter.slug}
                    serverFile={chapter.serverFile}
                    clientFile={chapter.clientFile}
                    onEntry={onWireEntry}
                />
            </div>
        </div>
    );
}
