import { Head, Link } from '@inertiajs/react';
import { useVisitedChapters } from '@/lab/visited';

type ChapterSummary = {
    slug: string;
    title: string;
    question: string;
    order: number;
};

type PartSummary = {
    key: string;
    label: string;
    description: string;
    chapters: ChapterSummary[];
};

type Versions = {
    inertiaLaravel: string;
    inertiaReact: string;
    laravel: string;
    php: string;
};

export default function Home({
    parts,
    versions,
}: {
    parts: PartSummary[];
    versions: Versions;
}) {
    // Empty until the effect inside useVisitedChapters runs after mount, so the first
    // paint (server-rendered or not) never claims a chapter is visited when the
    // localStorage read that would prove it has not happened yet.
    const visited = useVisitedChapters();

    return (
        <>
            <Head title="Inertia Lab" />
            <div className="mx-auto max-w-3xl space-y-8 p-6">
                <header>
                    <h1 className="text-2xl font-semibold">Inertia Lab</h1>
                    <p className="mt-2 text-neutral-600 dark:text-neutral-300">
                        A Laravel and Inertia application whose only subject is
                        Inertia itself. Each chapter isolates one concept, lets
                        you trigger it, and shows both halves of what happened:
                        the wire on the client side, and the prop resolution on
                        the server side.
                    </p>
                </header>

                <nav
                    aria-label="Reference pages"
                    className="flex gap-4 text-sm"
                >
                    <Link href="/lab/glossary" className="underline">
                        Glossary
                    </Link>
                    <Link href="/lab/where-did-it-go" className="underline">
                        Where did the API go?
                    </Link>
                </nav>

                <section aria-labelledby="chapters">
                    <h2 id="chapters" className="text-lg font-semibold">
                        Chapters
                    </h2>
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                        The parts below run in the order they are listed, and
                        the chapters within a part run in order too: each one
                        builds on what came before it. Chapter 0 is where every
                        reader starts.
                    </p>

                    <div className="mt-4 space-y-6">
                        {parts.map((part) => {
                            const visitedInPart = part.chapters.filter(
                                (chapter) => visited.has(chapter.slug),
                            ).length;

                            return (
                                <div key={part.key}>
                                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                                        <h3 className="font-semibold">
                                            {part.label}
                                        </h3>
                                        <p className="font-mono text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
                                            {visitedInPart} of{' '}
                                            {part.chapters.length} visited
                                        </p>
                                    </div>
                                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                                        {part.description}
                                    </p>
                                    <ol className="mt-2 space-y-3">
                                        {part.chapters.map((chapter) => (
                                            <li
                                                key={chapter.slug}
                                                className="border border-neutral-200 p-3 dark:border-neutral-800"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-x-3">
                                                    <Link
                                                        href={`/chapters/${chapter.slug}`}
                                                        className="font-medium underline"
                                                    >
                                                        {chapter.order}.{' '}
                                                        {chapter.title}
                                                    </Link>
                                                    {visited.has(
                                                        chapter.slug,
                                                    ) && (
                                                        <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400">
                                                            Visited
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                                                    {chapter.question}
                                                </p>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section aria-labelledby="versions">
                    <h2 id="versions" className="text-lg font-semibold">
                        Installed versions
                    </h2>
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                        <div>
                            <dt className="text-neutral-500 dark:text-neutral-400">
                                Laravel
                            </dt>
                            <dd>{versions.laravel}</dd>
                        </div>
                        <div>
                            <dt className="text-neutral-500 dark:text-neutral-400">
                                PHP
                            </dt>
                            <dd>{versions.php}</dd>
                        </div>
                        <div>
                            <dt className="text-neutral-500 dark:text-neutral-400">
                                inertiajs/inertia-laravel
                            </dt>
                            <dd>{versions.inertiaLaravel}</dd>
                        </div>
                        <div>
                            <dt className="text-neutral-500 dark:text-neutral-400">
                                @inertiajs/react
                            </dt>
                            <dd>{versions.inertiaReact}</dd>
                        </div>
                    </dl>
                </section>
            </div>
        </>
    );
}
