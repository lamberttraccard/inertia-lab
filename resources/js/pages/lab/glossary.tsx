import { Head, Link } from '@inertiajs/react';

type Term = { term: string; definition: string };

export default function Glossary({ terms }: { terms: Term[] }) {
    return (
        <>
            <Head title="Glossary" />
            <div className="mx-auto max-w-3xl space-y-6 p-6">
                <header>
                    <h1 className="text-2xl font-semibold">Glossary</h1>
                    <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                        The recurring vocabulary, defined once. Chapters link
                        terms here on first use.
                    </p>
                    <Link href="/" className="text-sm underline">
                        Back to chapters
                    </Link>
                </header>

                <dl className="space-y-4">
                    {terms.map((entry) => (
                        <div key={entry.term}>
                            <dt className="font-semibold">{entry.term}</dt>
                            <dd className="text-neutral-700 dark:text-neutral-300">
                                {entry.definition}
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </>
    );
}
