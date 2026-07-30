import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';
import { RoundTrip } from './RoundTrip';
import { SourceView } from './SourceView';
import type { WireEntry } from './types';
import { WireStrip } from './WireStrip';

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
};

// The section order below is fixed and lives only here, so no chapter can drift from the
// format: the question, the thing to try, the chapter's own content, what to watch, the
// translation callout, the source view, when to reach for this, then the prev/doc/next
// footer and the wire strip.
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
    // sizes across several requests) without installing a second capture on top of
    // WireStrip's: every entry the strip records is forwarded here too, if given.
    onWireEntry?: (entry: WireEntry) => void;
}>) {
    // Lifted here, not inside WireStrip, because RoundTrip needs the same latest entry:
    // this is the one place both the strip and the diagram can share it.
    const [entry, setEntry] = useState<WireEntry | null>(null);

    function recordEntry(latest: WireEntry) {
        setEntry(latest);
        onWireEntry?.(latest);
    }

    return (
        <article className="mx-auto max-w-4xl space-y-8 p-6 pb-[45vh]">
            <Head title={chapter.title} />

            <header>
                <h1 className="text-2xl font-semibold">{chapter.title}</h1>
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
                <RoundTrip entry={entry} />
            </section>

            <section aria-labelledby="translate">
                <h2 id="translate" className="text-lg font-semibold">
                    Coming from an API-first application
                </h2>
                <p>You would have written: {chapter.translationFrom}</p>
                <p>Here: {chapter.translationTo}</p>
                <p className="mt-2 text-sm">
                    <Link href="/lab/where-did-it-go" className="underline">
                        See every artefact this translates, on one page
                    </Link>
                </p>
            </section>

            <SourceView
                slug={chapter.slug}
                serverFile={chapter.serverFile}
                clientFile={chapter.clientFile}
            />

            <section aria-labelledby="when">
                <h2 id="when" className="text-lg font-semibold">
                    When to reach for this
                </h2>
                {whenToUse}
            </section>

            <footer className="flex justify-between gap-4 text-sm">
                {previous ? (
                    <Link href={`/chapters/${previous.slug}`}>
                        Previous: {previous.title}
                    </Link>
                ) : (
                    <span />
                )}
                <a
                    href={chapter.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                >
                    Official documentation
                </a>
                {next ? (
                    <Link href={`/chapters/${next.slug}`}>
                        Next: {next.title}
                    </Link>
                ) : (
                    <span />
                )}
            </footer>

            <WireStrip onEntry={recordEntry} />
        </article>
    );
}
