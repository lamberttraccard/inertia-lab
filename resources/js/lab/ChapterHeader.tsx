import { Link, usePage } from '@inertiajs/react';

const FOCUS_RING =
    'rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-neutral-400 dark:focus-visible:ring-offset-neutral-950';

// A local, minimal shape rather than importing ChapterData from resources/js/pages:
// every other component in resources/js/lab keeps that same one-way dependency (pages
// depend on lab, never the reverse), and this only ever reads two of that type's fields.
type ChapterHeaderProps = {
    chapter: { partLabel: string; order: number };
    previous: { slug: string; title: string } | null;
    next: { slug: string; title: string } | null;
};

/**
 * The navigation and progress the old single-column layout had none of: a way back to
 * the map, where this chapter sits in the curriculum, and the two chapters either side
 * of it. Deliberately not sticky: a sticky top bar would sit on top of the lesson while
 * it scrolls underneath, the same overlap this whole redesign exists to remove from the
 * inspector, just moved to the opposite edge of the viewport.
 */
export function ChapterHeader({ chapter, previous, next }: ChapterHeaderProps) {
    const { props } = usePage();
    const total = props.totalChapters;

    return (
        <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-neutral-200 pb-4 text-sm dark:border-neutral-800">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Link
                    href="/"
                    className={`font-medium underline underline-offset-4 ${FOCUS_RING}`}
                >
                    Chapter map
                </Link>
                <span
                    aria-hidden="true"
                    className="text-neutral-300 dark:text-neutral-700"
                >
                    /
                </span>
                <span className="text-neutral-600 dark:text-neutral-400">
                    {chapter.partLabel}
                </span>
                <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-600 tabular-nums dark:bg-neutral-900 dark:text-neutral-400">
                    Chapter {chapter.order} of {total}
                </span>
            </div>

            <nav
                aria-label="Chapter navigation"
                className="flex items-center gap-x-5 gap-y-1"
            >
                {previous ? (
                    <Link
                        href={`/chapters/${previous.slug}`}
                        className={`underline underline-offset-4 ${FOCUS_RING}`}
                    >
                        <span aria-hidden="true">&larr;</span> Previous:{' '}
                        {previous.title}
                    </Link>
                ) : (
                    <span className="text-neutral-400 dark:text-neutral-600">
                        Start of the lab
                    </span>
                )}
                {next ? (
                    <Link
                        href={`/chapters/${next.slug}`}
                        className={`underline underline-offset-4 ${FOCUS_RING}`}
                    >
                        Next: {next.title}{' '}
                        <span aria-hidden="true">&rarr;</span>
                    </Link>
                ) : (
                    <span className="text-neutral-400 dark:text-neutral-600">
                        End of the lab
                    </span>
                )}
            </nav>
        </header>
    );
}
