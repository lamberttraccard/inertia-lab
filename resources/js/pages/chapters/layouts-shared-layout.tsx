import { Link } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactNode } from 'react';

type ChapterPairLayoutProps = {
    children: ReactNode;
    badge?: string;
};

const LINK_CLASS = 'underline';

// Assigned directly as PanelOne.layout / PanelTwo.layout in the two panel pages, as a plain
// function reference, not wrapped in a `(page) => <ChapterPairLayout>{page}</ChapterPairLayout>`
// callback. That distinction matters here: reading App() in
// node_modules/@inertiajs/react/dist/index.js, a `Component.layout` that is itself a
// function gets probed by calling it once with the page's props to decide what kind of
// value it returned. A plain function declaration like this one is not mistaken for that
// probed callback, because isLayoutResolver() (same file) only matches an arrow function of
// arity 0 or 1: a `function` declaration always has a `.prototype`, which disqualifies it.
// Passing this probe is what makes the reduceRight() branch further down actually merge
// setLayoutProps' shared props into what this component receives; the callback-style
// wrapper skips that merge entirely and returns straight from the probe call instead.
export function ChapterPairLayout({ children, badge }: ChapterPairLayoutProps) {
    const [count, setCount] = useState(0);

    return (
        <div className="mx-auto max-w-2xl space-y-4 p-6">
            <nav className="flex flex-wrap items-center gap-4 border-b border-neutral-300 pb-3 text-sm dark:border-neutral-700">
                <Link href="/chapters/layouts/panel-one" className={LINK_CLASS}>
                    Panel A
                </Link>
                <Link href="/chapters/layouts/panel-two" className={LINK_CLASS}>
                    Panel B
                </Link>
                <Link href="/chapters/layouts" className={LINK_CLASS}>
                    Back to the chapter
                </Link>
            </nav>

            <div className="rounded border border-neutral-400 p-3 text-sm dark:border-neutral-600">
                <p>
                    Layout-owned counter: <strong>{count}</strong>
                </p>
                <button
                    type="button"
                    onClick={() => setCount((current) => current + 1)}
                    className="mt-1 rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                >
                    +1 (this button lives in the layout, not the panel)
                </button>
                <p className="mt-2">
                    Layout badge, from setLayoutProps:{' '}
                    <strong>{badge ?? '(none set yet)'}</strong>
                </p>
            </div>

            <div className="h-40 overflow-y-auto rounded border border-neutral-400 p-2 text-sm dark:border-neutral-600">
                <p className="mb-1 text-neutral-500">
                    Scroll me, then switch panels.
                </p>
                <ul className="space-y-1">
                    {Array.from({ length: 40 }, (_, index) => (
                        <li key={index}>Layout row {index + 1}.</li>
                    ))}
                </ul>
            </div>

            <main>{children}</main>
        </div>
    );
}
