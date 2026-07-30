import { Head, Link } from '@inertiajs/react';

type Row = {
    artefact: string;
    inertiaEquivalent: string;
    disappears: boolean;
    chapter: string;
};

export default function WhereDidItGo({ rows }: { rows: Row[] }) {
    return (
        <>
            <Head title="Where did it go?" />
            <div className="mx-auto max-w-4xl space-y-6 p-6">
                <header>
                    <h1 className="text-2xl font-semibold">
                        Where did the API go?
                    </h1>
                    <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                        One row per artefact an API-first developer expects to
                        write. Each row says what plays that role in an Inertia
                        application, or why the role stops existing, and links
                        to the chapter that demonstrates it. This page is meant
                        to stand on its own, without the rest of the lab open
                        next to it.
                    </p>
                    <Link href="/lab" className="text-sm underline">
                        Back to chapters
                    </Link>
                </header>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-neutral-300 dark:border-neutral-700">
                                <th className="py-2 pr-4">Artefact</th>
                                <th className="py-2 pr-4">
                                    In this Inertia application
                                </th>
                                <th className="py-2 pr-4">Role</th>
                                <th className="py-2">Chapter</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={row.artefact}
                                    className="border-b border-neutral-200 align-top dark:border-neutral-800"
                                >
                                    <td className="py-2 pr-4 font-medium">
                                        {row.artefact}
                                    </td>
                                    <td className="py-2 pr-4">
                                        {row.inertiaEquivalent}
                                    </td>
                                    <td className="py-2 pr-4">
                                        {row.disappears
                                            ? 'No longer exists'
                                            : 'Played by something else'}
                                    </td>
                                    <td className="py-2">
                                        <Link
                                            href={`/chapters/${row.chapter}`}
                                            className="underline"
                                        >
                                            {row.chapter}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
