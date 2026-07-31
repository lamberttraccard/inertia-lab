import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';
import type { ChapterData, Neighbour } from './types';

type HeadAndMetaProps = {
    chapter: ChapterData;
    previous: Neighbour | null;
    next: Neighbour | null;
};

export default function HeadAndMeta({
    chapter,
    previous,
    next,
}: HeadAndMetaProps) {
    const [title, setTitle] = useState(chapter.title);

    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <div className="space-y-3">
                    <label className="block text-sm font-medium">
                        Tab title
                        <input
                            type="text"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            className="mt-1 block w-full rounded border border-neutral-400 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-900"
                        />
                    </label>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                        Watch your browser tab, not this page, while you type: a{' '}
                        <Term term="Head component">Head component</Term>{' '}
                        further down this page is bound to this input.
                    </p>
                </div>
            }
            watchFor={
                <p className="mt-2">
                    Every chapter in this lab already renders a{' '}
                    <code className="font-mono">{'<Head title={...} />'}</code>:
                    ChapterShell does it once, at the top, with the
                    chapter&apos;s own title. This page renders a second one
                    below it, bound to the input above, and that second one is
                    what your tab shows: it mounts deeper in the tree than
                    ChapterShell&apos;s own, and a later title always replaces
                    an earlier one rather than the two competing. There is no
                    request involved in any of this: nothing here is a visit, so
                    the inspector has nothing to record no matter how much you
                    type.
                </p>
            }
            whenToUse={
                <p>
                    Render <code className="font-mono">{'<Head>'}</code>{' '}
                    wherever a page needs a title or meta tags more specific
                    than whatever a layout further up already set, the same way
                    this page overrides the chapter shell&apos;s own title.
                    There is nothing to configure and nothing to install: it
                    ships with the adapter itself.
                </p>
            }
        >
            <Head title={title} />

            <section>
                <h2 className="text-lg font-semibold">
                    Meta tags, not only the title
                </h2>
                <p className="mt-1">
                    <code className="font-mono">{'<Head>'}</code> accepts a
                    <code className="font-mono">title</code> string and
                    arbitrary <code className="font-mono">children</code>,
                    verified in{' '}
                    <code className="font-mono">
                        node_modules/@inertiajs/react/types/Head.d.ts
                    </code>
                    . The{' '}
                    <code className="font-mono">
                        {'<Head title={title} />'}
                    </code>{' '}
                    just above, bound to the input, is the one actually setting
                    your tab title right now. This page also renders one meta
                    tag through a separate{' '}
                    <code className="font-mono">{'<Head>'}</code>:
                </p>
                <Head>
                    <meta
                        name="description"
                        content="A chapter about who sets the document title when Inertia never does a full page load."
                    />
                </Head>
                <p className="mt-1">
                    Open this document&apos;s{' '}
                    <code className="font-mono">{'<head>'}</code> in your
                    browser&apos;s element inspector and the description tag
                    above is there, next to the title this page is currently
                    setting.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">Nothing to wire up</h2>
                <p className="mt-1">
                    Earlier versions of a client-rendered app usually needed a
                    separate head-management library, installed and mounted once
                    near the root, before any component could touch the document
                    title. <code className="font-mono">Head</code> is exported
                    by <code className="font-mono">@inertiajs/react</code>{' '}
                    itself; nothing about resources/js/app.tsx registers it or
                    configures it, because there is nothing to register.
                </p>
            </section>
        </ChapterShell>
    );
}
