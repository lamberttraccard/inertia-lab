import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';
import type { ChapterData, Neighbour } from './types';

type PrecognitionFormData = {
    title: string;
    slug: string;
};

type PrecognitionProps = {
    chapter: ChapterData;
    previous: Neighbour | null;
    next: Neighbour | null;
};

export default function Precognition({
    chapter,
    previous,
    next,
}: PrecognitionProps) {
    // Calling useForm with a method and a url, rather than bare data, is what enables
    // Precognition on the form it returns (verified in node_modules/@inertiajs/react/
    // dist/index.js: useFormState calls form.withPrecognition(...) itself whenever a
    // precognition endpoint was parsed from the arguments), so validate, valid, invalid
    // and validating below are already present without a separate withPrecognition call.
    const form = useForm<PrecognitionFormData>(
        'post',
        '/chapters/precognition',
        {
            title: '',
            slug: '',
        },
    );

    // Captured at submit time rather than read from form.data at render time: form.data
    // keeps changing as the reader edits the slug field afterward, and form.wasSuccessful
    // stays true until the next submission, so reading form.data live here would have the
    // confirmation below silently start describing a row that was never actually created.
    const [created, setCreated] = useState<PrecognitionFormData | null>(null);

    function handleSlugChange(event: ChangeEvent<HTMLInputElement>) {
        form.setData('slug', event.target.value);
        form.validate('slug');
    }

    function handleSubmit(event: FormEvent) {
        event.preventDefault();

        const submitted = { title: form.data.title, slug: form.data.slug };

        form.post('/chapters/precognition', {
            preserveScroll: true,
            onSuccess: () => setCreated(submitted),
        });
    }

    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <p>
                    Type a slug below. Type one that already exists (try
                    already-taken-slug after visiting a chapter that seeds one,
                    or submit the form twice with the same value) to see the
                    check fail, then change it to something free and submit for
                    real.
                </p>
            }
            watchFor={
                <p className="mt-2">
                    Every change to the slug field calls
                    form.validate(&apos;slug&apos;), which sends the exact same
                    title and slug this form would submit for real, to the exact
                    same route, but carrying a{' '}
                    <Term term="Precognition">Precognition</Term> header that
                    tells the server to run its validation and stop there. That
                    request is not a visit at all: it is built by the
                    laravel-precognition package&apos;s own client (a dependency
                    of @inertiajs/react itself, already installed, confirmed in
                    node_modules/@inertiajs/react/package.json), which sends it
                    through the browser&apos;s fetch function rather than the
                    XMLHttpRequest every Inertia visit in this app uses. Because
                    it carries no X-Inertia header, this app&apos;s own wire
                    strip below never records it. Open your browser&apos;s
                    network tab to see it directly: an available slug answers
                    204 with a Precognition-Success header and an empty body,
                    and a taken one answers 422 with{' '}
                    <code className="font-mono">
                        {
                            '{"message":"The slug has already been taken.","errors":{"slug":["The slug has already been taken."]}}'
                        }
                    </code>
                    , straight from the validator&apos;s own{' '}
                    <code className="font-mono">MessageBag</code>. A failed real
                    submission never reaches a 422 at all. Chapter 17 already
                    covers why: this form&apos;s real POST is an ordinary
                    Inertia visit, which asks for text/html rather than JSON, so
                    Laravel redirects back instead of returning a body, and the
                    errors prop that redirect eventually delivers holds{' '}
                    <code className="font-mono">
                        {'{"slug":"The slug has already been taken."}'}
                    </code>
                    , one plain string, because Inertia&apos;s own middleware
                    keeps only the first message per field. Same rule, same
                    message, a different shape depending only on which path
                    produced it. Submitting for real, by contrast, is an
                    ordinary Inertia visit, and does show up below.
                </p>
            }
            whenToUse={
                <p>
                    Reach for this wherever a rule that only the database can
                    answer, uniqueness chief among them, needs to be checked
                    before the reader reaches submit. The rule lives in exactly
                    one place, the FormRequest this route already validates the
                    real submission with; nothing about it is restated for the
                    client to run itself.
                </p>
            }
        >
            <section aria-labelledby="create">
                <h2 id="create" className="text-lg font-semibold">
                    Create a demo post
                </h2>
                <form onSubmit={handleSubmit} className="mt-3 space-y-3">
                    <label className="block text-sm">
                        Title
                        <input
                            type="text"
                            value={form.data.title}
                            onChange={(event) =>
                                form.setData('title', event.target.value)
                            }
                            className="mt-1 block w-full rounded border border-neutral-400 px-2 py-1 dark:border-neutral-600 dark:bg-neutral-900"
                        />
                    </label>
                    {form.errors.title ? (
                        <p className="text-sm text-red-600 dark:text-red-400">
                            {form.errors.title}
                        </p>
                    ) : null}
                    <label className="block text-sm">
                        Slug
                        <input
                            type="text"
                            value={form.data.slug}
                            onChange={handleSlugChange}
                            className="mt-1 block w-full rounded border border-neutral-400 px-2 py-1 dark:border-neutral-600 dark:bg-neutral-900"
                        />
                    </label>
                    {form.validating ? (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Checking…
                        </p>
                    ) : form.invalid('slug') ? (
                        <p className="text-sm text-red-600 dark:text-red-400">
                            {form.errors.slug}
                        </p>
                    ) : form.valid('slug') ? (
                        <p className="text-sm text-green-700 dark:text-green-400">
                            This slug is available.
                        </p>
                    ) : null}
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-neutral-600"
                    >
                        Create post
                    </button>
                    {form.wasSuccessful && created ? (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Created &quot;{created.title}&quot; at slug &quot;
                            {created.slug}&quot;.
                        </p>
                    ) : null}
                </form>
            </section>
        </ChapterShell>
    );
}
