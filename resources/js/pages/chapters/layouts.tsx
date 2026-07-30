import { Link } from '@inertiajs/react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';
import type { ChapterData, Neighbour } from './types';

type LayoutsProps = {
    chapter: ChapterData;
    previous: Neighbour | null;
    next: Neighbour | null;
};

const LINK_CLASS =
    'rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600';

export default function Layouts({ chapter, previous, next }: LayoutsProps) {
    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <div className="space-y-3">
                    <p className="text-sm">
                        These two panels are not chapters of their own: they are
                        a self-contained pair of pages built only to show a{' '}
                        <Term term="Persistent layout">persistent layout</Term>{' '}
                        surviving a visit between them. Open one, increment its
                        counter, scroll its list, then follow the link to the
                        other panel and back.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/chapters/layouts/panel-one"
                            className={LINK_CLASS}
                        >
                            Open Panel A
                        </Link>
                        <Link
                            href="/chapters/layouts/panel-two"
                            className={LINK_CLASS}
                        >
                            Open Panel B
                        </Link>
                    </div>
                </div>
            }
            watchFor={
                <p className="mt-2">
                    The counter and the scroll position both live in the shared
                    layout wrapping each panel, not in the panel itself:
                    switching panels keeps both exactly as you left them,
                    because the layout component is never unmounted, only the
                    section below it swaps. The badge line is different: it
                    comes from setLayoutProps, called by a button on each panel,
                    and it goes back to its unset state every time you switch
                    panels, until the panel you land on calls setLayoutProps
                    again itself. This lab&apos;s own wire strip does not appear
                    on either panel: they are deliberately minimal pages, not
                    full chapters, so there is nothing here to render it into.
                </p>
            }
            whenToUse={
                <p>
                    Reach for a persistent layout for chrome that should survive
                    navigation inside one section of an application: a sidebar,
                    a media player, a multi-step form&apos;s progress bar. Reach
                    for setLayoutProps when a page needs to hand that chrome
                    something specific to itself, such as a title or an action
                    list, without threading a prop through every page that
                    shares the layout.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">
                    A plain reference, assigned once
                </h2>
                <p className="mt-1">
                    Each panel component sets its own{' '}
                    <code className="font-mono">.layout</code> static property
                    to the exact same function:{' '}
                    <code className="font-mono">
                        PanelOne.layout = ChapterPairLayout
                    </code>
                    . Reading <code className="font-mono">App()</code> in{' '}
                    <code className="font-mono">
                        node_modules/@inertiajs/react/dist/index.js
                    </code>{' '}
                    shows the client keeping the same React element tree across
                    the visit whenever the resolved layout stays the same
                    component: only the part of the tree the layout wraps gets
                    replaced. The other thirty-two chapters in this lab never
                    set this property at all, so none of them are affected by it
                    existing here, and none of them go through this code path.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    Two ways to assign a layout, and why this one is not the
                    other
                </h2>
                <p className="mt-1">
                    The classic form seen in older Inertia examples,{' '}
                    <code className="font-mono">
                        Page.layout = (page) =&gt; &lt;Layout&gt;{'{'}page{'}'}
                        &lt;/Layout&gt;
                    </code>
                    , also still works in this installed version, but it takes a
                    different path once it reaches{' '}
                    <code className="font-mono">App()</code>: that function gets
                    called once to probe what kind of value it returns, and a
                    wrapper written this way always returns a real element from
                    that probe, so the client uses it directly and never merges
                    setLayoutProps into anything. Assigning the layout component
                    itself, as this chapter does, takes the other path, the one
                    that does merge setLayoutProps in. Both forms keep the
                    layout mounted across a visit equally well; only the plain
                    reference used here also reaches setLayoutProps.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    Not the same kind of scroll as remembering-state
                </h2>
                <p className="mt-1">
                    The scrollable list inside the shared layout keeps its
                    position for a much plainer reason than the{' '}
                    <code className="font-mono">scroll-region</code> attribute
                    or <code className="font-mono">preserveScroll</code>{' '}
                    demonstrated in the remembering-state chapter: the element
                    is never removed from the page between panels, so the
                    browser never has anything to reset. Neither of those two
                    options is involved here at all; they matter for a component
                    that does get rebuilt, which this layout, deliberately,
                    never is.
                </p>
            </section>
        </ChapterShell>
    );
}
