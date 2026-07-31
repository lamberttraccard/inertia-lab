import { useForm } from '@inertiajs/react';
import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';
import type { ChapterData, Neighbour } from './types';

type CoverFormData = {
    cover: File | null;
};

type FileUploadsProps = {
    chapter: ChapterData;
    coverPath: string | null;
    coverUrl: string | null;
    previous: Neighbour | null;
    next: Neighbour | null;
};

export default function FileUploads({
    chapter,
    coverPath,
    coverUrl,
    previous,
    next,
}: FileUploadsProps) {
    const form = useForm<CoverFormData>({ cover: null });
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;
        form.setData('cover', file);
        setPreviewUrl(file ? URL.createObjectURL(file) : null);
    }

    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        // No FormData built here, no multipart headers set here: cover is a File, and
        // that alone is what makes the visit send as multipart/form-data.
        form.post('/chapters/file-uploads', { preserveScroll: true });
    }

    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <p>
                    Choose an image below and upload it. A larger image makes
                    the progress bar easier to watch on a fast local connection;
                    a small one may finish before it visibly moves.
                </p>
            }
            watchFor={
                <>
                    <p className="mt-2">
                        The data this form submits is a single field, cover,
                        holding a File. Nothing here builds a FormData object or
                        sets a Content-Type: putting a File anywhere in the data
                        is what makes the visit send as{' '}
                        <Term term="Multipart request">
                            multipart/form-data
                        </Term>{' '}
                        instead of the JSON body every other chapter&apos;s
                        visits use.
                    </p>
                    <p className="mt-2">
                        While the upload is in flight, form.progress is not
                        null, and its percentage field is what the bar below
                        reads; both go back to null and false once the upload
                        finishes and the redirect this chapter&apos;s controller
                        sends lands back here.
                    </p>
                </>
            }
            whenToUse={
                <p>
                    Reach for this whenever a form has a file field at all.
                    Nothing about a file changes how the form is declared or
                    submitted; only progress becomes worth reading, since a file
                    upload is the one visit slow enough to make it visible.
                </p>
            }
        >
            <section aria-labelledby="current-cover">
                <h2 id="current-cover" className="text-lg font-semibold">
                    Current cover
                </h2>
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt="Current cover for the file-uploads demo post"
                        className="mt-2 h-40 w-full max-w-sm rounded object-cover"
                    />
                ) : (
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                        No cover uploaded yet.
                    </p>
                )}
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                    coverPath: {coverPath ?? 'null'}
                </p>
            </section>

            <section aria-labelledby="upload">
                <h2 id="upload" className="text-lg font-semibold">
                    Upload a new cover
                </h2>
                <form onSubmit={handleSubmit} className="mt-3 space-y-3">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block text-sm"
                    />
                    {form.errors.cover ? (
                        <p className="text-sm text-red-600 dark:text-red-400">
                            {form.errors.cover}
                        </p>
                    ) : null}
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt="Selected cover preview"
                            className="h-40 w-full max-w-sm rounded object-cover"
                        />
                    ) : null}
                    <button
                        type="submit"
                        disabled={form.processing || form.data.cover === null}
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-neutral-600"
                    >
                        Upload cover
                    </button>
                    {form.progress ? (
                        <div className="w-full max-w-sm">
                            <div className="h-2 w-full rounded bg-neutral-200 dark:bg-neutral-800">
                                <div
                                    className="h-2 rounded bg-neutral-600 dark:bg-neutral-400"
                                    style={{
                                        width: `${form.progress.percentage ?? 0}%`,
                                    }}
                                />
                            </div>
                            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                                {form.progress.percentage ?? 0}%
                            </p>
                        </div>
                    ) : null}
                </form>
            </section>
        </ChapterShell>
    );
}
