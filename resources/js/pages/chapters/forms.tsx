import { Form, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';
import type { ChapterData, Neighbour } from './types';

type PostFormData = {
    title: string;
    excerpt: string;
    body: string;
    tags: number[];
};

type TagOption = { id: number; name: string };

type FormsProps = {
    chapter: ChapterData;
    post: PostFormData;
    tagOptions: TagOption[];
    previous: Neighbour | null;
    next: Neighbour | null;
};

function TagCheckboxes({
    tagOptions,
    name,
    checked,
    onToggle,
}: {
    tagOptions: TagOption[];
    name: string;
    checked: number[];
    onToggle?: (id: number, isChecked: boolean) => void;
}) {
    return (
        <fieldset className="mt-2 flex flex-wrap gap-3">
            <legend className="text-sm text-neutral-600 dark:text-neutral-400">
                Tags
            </legend>
            {tagOptions.map((tag) => (
                <label key={tag.id} className="flex items-center gap-1 text-sm">
                    <input
                        type="checkbox"
                        name={name}
                        value={tag.id}
                        defaultChecked={
                            onToggle ? undefined : checked.includes(tag.id)
                        }
                        checked={
                            onToggle ? checked.includes(tag.id) : undefined
                        }
                        onChange={
                            onToggle
                                ? (event) =>
                                      onToggle(tag.id, event.target.checked)
                                : undefined
                        }
                    />
                    {tag.name}
                </label>
            ))}
        </fieldset>
    );
}

export default function Forms({
    chapter,
    post,
    tagOptions,
    previous,
    next,
}: FormsProps) {
    const hookForm = useForm<PostFormData>({
        title: post.title,
        excerpt: post.excerpt,
        body: post.body,
        tags: post.tags,
    });

    function submitWithHook(event: FormEvent) {
        event.preventDefault();
        hookForm.post('/chapters/forms', { preserveScroll: true });
    }

    function toggleHookTag(id: number, isChecked: boolean) {
        hookForm.setData(
            'tags',
            isChecked
                ? [...hookForm.data.tags, id]
                : hookForm.data.tags.filter((existing) => existing !== id),
        );
    }

    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <p>
                    Submit either form below with the title left blank, then
                    submit it again filled in. Both post to the same demo row,
                    so either one is enough to see a create and an edit.
                </p>
            }
            watchFor={
                <p className="mt-2">
                    A blank title fails the server&apos;s own required rule.
                    Nothing in this page ever reads a 422 body: the request that
                    fails is an ordinary Inertia visit, and Laravel&apos;s
                    default behaviour for a request that does not ask for JSON
                    (Inertia visits ask for text/html) is to redirect back with
                    the errors flashed to the session. XMLHttpRequest follows
                    that redirect on its own, landing back on this same page,
                    whose errors prop now carries them, shared by Inertia&apos;s
                    own middleware and always included regardless of what a
                    partial reload would otherwise have asked for. Both forms
                    below read that same flat errors object, since both submit
                    the same fields to the same route: nothing here splits them
                    into a named <Term term="Error bag">error bag</Term>, so a
                    failure from either form is visible on both.
                </p>
            }
            whenToUse={
                <p>
                    Reach for the Form component when the fields are plain
                    inputs and a native form submission already does what you
                    need. Reach for useForm when the page needs to read or react
                    to the data between keystrokes, the way the tag checkboxes
                    below do for the second form.
                </p>
            }
        >
            <section aria-labelledby="form-component">
                <h2 id="form-component" className="text-lg font-semibold">
                    Using the Form component
                </h2>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    Plain named inputs; no onChange handlers, no local state.
                </p>
                <Form
                    action="/chapters/forms"
                    method="post"
                    className="mt-3 space-y-3"
                >
                    {({ errors, processing, isDirty, wasSuccessful }) => (
                        <>
                            <label className="block text-sm">
                                Title
                                <input
                                    type="text"
                                    name="title"
                                    defaultValue={post.title}
                                    className="mt-1 block w-full rounded border border-neutral-400 px-2 py-1 dark:border-neutral-600 dark:bg-neutral-900"
                                />
                            </label>
                            {errors.title ? (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {errors.title}
                                </p>
                            ) : null}
                            <label className="block text-sm">
                                Excerpt
                                <input
                                    type="text"
                                    name="excerpt"
                                    defaultValue={post.excerpt}
                                    className="mt-1 block w-full rounded border border-neutral-400 px-2 py-1 dark:border-neutral-600 dark:bg-neutral-900"
                                />
                            </label>
                            {errors.excerpt ? (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {errors.excerpt}
                                </p>
                            ) : null}
                            <label className="block text-sm">
                                Body
                                <textarea
                                    name="body"
                                    defaultValue={post.body}
                                    className="mt-1 block w-full rounded border border-neutral-400 px-2 py-1 dark:border-neutral-600 dark:bg-neutral-900"
                                />
                            </label>
                            {errors.body ? (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {errors.body}
                                </p>
                            ) : null}
                            <TagCheckboxes
                                tagOptions={tagOptions}
                                name="tags[]"
                                checked={post.tags}
                            />
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded border border-neutral-400 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-neutral-600"
                            >
                                Save with Form
                            </button>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                processing: {String(processing)}, isDirty:{' '}
                                {String(isDirty)}, wasSuccessful:{' '}
                                {String(wasSuccessful)}
                            </p>
                        </>
                    )}
                </Form>
            </section>

            <section aria-labelledby="use-form">
                <h2 id="use-form" className="text-lg font-semibold">
                    Using useForm
                </h2>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    Controlled inputs backed by the hook&apos;s own data and
                    setData.
                </p>
                <form onSubmit={submitWithHook} className="mt-3 space-y-3">
                    <label className="block text-sm">
                        Title
                        <input
                            type="text"
                            value={hookForm.data.title}
                            onChange={(event) =>
                                hookForm.setData('title', event.target.value)
                            }
                            className="mt-1 block w-full rounded border border-neutral-400 px-2 py-1 dark:border-neutral-600 dark:bg-neutral-900"
                        />
                    </label>
                    {hookForm.errors.title ? (
                        <p className="text-sm text-red-600 dark:text-red-400">
                            {hookForm.errors.title}
                        </p>
                    ) : null}
                    <label className="block text-sm">
                        Excerpt
                        <input
                            type="text"
                            value={hookForm.data.excerpt}
                            onChange={(event) =>
                                hookForm.setData('excerpt', event.target.value)
                            }
                            className="mt-1 block w-full rounded border border-neutral-400 px-2 py-1 dark:border-neutral-600 dark:bg-neutral-900"
                        />
                    </label>
                    {hookForm.errors.excerpt ? (
                        <p className="text-sm text-red-600 dark:text-red-400">
                            {hookForm.errors.excerpt}
                        </p>
                    ) : null}
                    <label className="block text-sm">
                        Body
                        <textarea
                            value={hookForm.data.body}
                            onChange={(event) =>
                                hookForm.setData('body', event.target.value)
                            }
                            className="mt-1 block w-full rounded border border-neutral-400 px-2 py-1 dark:border-neutral-600 dark:bg-neutral-900"
                        />
                    </label>
                    {hookForm.errors.body ? (
                        <p className="text-sm text-red-600 dark:text-red-400">
                            {hookForm.errors.body}
                        </p>
                    ) : null}
                    <TagCheckboxes
                        tagOptions={tagOptions}
                        name="tags[]"
                        checked={hookForm.data.tags}
                        onToggle={toggleHookTag}
                    />
                    <button
                        type="submit"
                        disabled={hookForm.processing}
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-neutral-600"
                    >
                        Save with useForm
                    </button>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        processing: {String(hookForm.processing)}, isDirty:{' '}
                        {String(hookForm.isDirty)}, wasSuccessful:{' '}
                        {String(hookForm.wasSuccessful)}
                    </p>
                </form>
            </section>
        </ChapterShell>
    );
}
