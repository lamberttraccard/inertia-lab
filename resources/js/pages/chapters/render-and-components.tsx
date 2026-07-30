import { router } from '@inertiajs/react';
import { ChapterShell } from '@/lab/ChapterShell';

type ChapterData = {
    slug: string;
    title: string;
    question: string;
    concept: string;
    routeName: string;
    serverFile: string;
    clientFile: string;
    translationFrom: string;
    translationTo: string;
    docsUrl: string;
    wave: number;
    order: number;
};

type Neighbour = { slug: string; title: string };

type RenderAndComponentsProps = {
    chapter: ChapterData;
    resolvedComponent: string;
    pagesRoot: string;
    previous: Neighbour | null;
    next: Neighbour | null;
};

export default function RenderAndComponents({
    chapter,
    resolvedComponent,
    pagesRoot,
    previous,
    next,
}: RenderAndComponentsProps) {
    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <button
                    type="button"
                    onClick={() =>
                        router.get('/chapters/render-and-components/broken')
                    }
                    className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                >
                    Visit a route that renders a component name that does not
                    exist
                </button>
            }
            watchFor={
                <p className="mt-2">
                    The response has no X-Inertia header at all, because the
                    exception is thrown before Inertia&apos;s middleware resumes
                    past the controller call: nothing about it looks like a page
                    object. The client treats that as a non-Inertia response to
                    a visit and shows it full page, in a dialog element layered
                    over this one. Click outside it to dismiss it. The Lifecycle
                    tab of the wire strip still records the visit: look for
                    httpException.
                </p>
            }
            whenToUse={
                <p>
                    Turning ensure_pages_exist on is worth doing in every
                    environment except production: it turns a typo in a
                    component name into an immediate server error instead of a
                    blank screen the first time a real visitor hits it.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">A name, then a file</h2>
                <p className="mt-1">
                    This page is the string{' '}
                    <code className="font-mono">{resolvedComponent}</code>,
                    handed to{' '}
                    <code className="font-mono">Inertia::render()</code>.
                    Nothing on the server ever opens the client file. The client
                    resolves that same string against{' '}
                    <code className="font-mono">{pagesRoot}</code> instead: this
                    app&apos;s resources/js/app.tsx passes neither{' '}
                    <code className="font-mono">pages</code> nor{' '}
                    <code className="font-mono">resolve</code> to{' '}
                    <code className="font-mono">createInertiaApp()</code>, so
                    the @inertiajs/vite plugin injects a default resolver at
                    build time: an{' '}
                    <code className="font-mono">import.meta.glob</code> over{' '}
                    <code className="font-mono">
                        {pagesRoot}/**/*.{'{tsx,jsx}'}
                    </code>
                    , matched against the component name, throwing a plain{' '}
                    <code className="font-mono">
                        Error(&apos;Page not found: ...&apos;)
                    </code>{' '}
                    in the browser console if nothing matches. The classic
                    explicit helper for writing that resolver by hand,{' '}
                    <code className="font-mono">resolvePageComponent</code>, is
                    not exported by @inertiajs/react in this version; it still
                    exists, but only in{' '}
                    <code className="font-mono">
                        laravel-vite-plugin/inertia-helpers
                    </code>
                    , for projects that want to write the resolver themselves
                    instead of letting the plugin generate it.
                </p>
                <h2 className="mt-4 text-lg font-semibold">
                    Catching it on the server instead
                </h2>
                <p className="mt-1">
                    Inertia can check the component file exists before it ever
                    answers the request: set{' '}
                    <code className="font-mono">
                        inertia.pages.ensure_pages_exist
                    </code>{' '}
                    to true and{' '}
                    <code className="font-mono">Inertia::render()</code> calls{' '}
                    <code className="font-mono">
                        Inertia\ComponentNotFoundException
                    </code>{' '}
                    the moment it is given a name nothing on disk answers to.
                    This lab&apos;s own config/inertia.php declares its own{' '}
                    <code className="font-mono">pages</code> array with only{' '}
                    <code className="font-mono">paths</code> and{' '}
                    <code className="font-mono">extensions</code>, so
                    Laravel&apos;s config merge drops the package&apos;s own
                    default for that flag rather than keeping it: it reads as
                    off here unless a request turns it on for itself, which is
                    exactly what the button above does.
                </p>
            </section>
        </ChapterShell>
    );
}
