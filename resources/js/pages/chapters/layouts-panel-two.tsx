import { setLayoutProps } from '@inertiajs/react';
import { ChapterPairLayout } from './layouts-shared-layout';

type LayoutsPanelTwoProps = {
    visitedAt: string;
};

function LayoutsPanelTwo({ visitedAt }: LayoutsPanelTwoProps) {
    return (
        <section className="space-y-2">
            <h1 className="text-xl font-semibold">Panel B</h1>
            <p className="text-sm">
                This page&apos;s own visitedAt prop:{' '}
                <strong>{visitedAt}</strong>. It is resolved fresh on every
                visit to this route, unlike the counter above, which belongs to
                the layout and is untouched by which panel is showing.
            </p>
            <button
                type="button"
                onClick={() =>
                    setLayoutProps({
                        badge: `Set by Panel B at ${new Date().toLocaleTimeString()}`,
                    })
                }
                className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
            >
                Set the layout badge from Panel B
            </button>
        </section>
    );
}

LayoutsPanelTwo.layout = ChapterPairLayout;

export default LayoutsPanelTwo;
