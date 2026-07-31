import { ChapterShell } from '@/lab/ChapterShell';
import { CodeBlock } from '@/lab/CodeBlock';
import type { ChapterData, Neighbour } from './types';

const CONTROLLER_PROPS = `->render('chapters/error-handling-page', [
    'status' => $exceptionResponse->statusCode(),
    'message' => $exceptionResponse->exception->getMessage(),
    'requestPath' => '/'.$exceptionResponse->request->path(),
])`;

const COMPONENT_TYPE = `type ErrorHandlingPageProps = {
    status: number;
    message: string;
    requestPath: string;
};`;

const WAYFINDER_EXAMPLE = `export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})`;

type BuildInfo =
    | { available: false }
    | {
          available: true;
          file: string;
          isDynamicEntry: boolean;
          bytes: number | null;
          importsCount: number;
      };

type TypescriptAndSplittingProps = {
    chapter: ChapterData;
    buildInfo: BuildInfo;
    previous: Neighbour | null;
    next: Neighbour | null;
};

export default function TypescriptAndSplitting({
    chapter,
    buildInfo,
    previous,
    next,
}: TypescriptAndSplittingProps) {
    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <p>
                    There is nothing to click on this page: types and code
                    splitting are decided when the application is built, not
                    while it runs. Read on for what this exact page&apos;s own
                    build produced.
                </p>
            }
            watchFor={
                <p className="mt-2">
                    No inspector trick either. The one thing to watch is below,
                    in the build info section: it is read from the real Vite
                    manifest for this exact page on this exact build, not a
                    description of what code splitting usually does.
                </p>
            }
            whenToUse={
                <p>
                    Write the props type by hand for every page, the way every
                    chapter in this application does; it is the contract a
                    reviewer and an editor both rely on, even though nothing
                    enforces it against the controller. Reach for Wayfinder for
                    the request side of the boundary: a route or controller
                    action that changes its parameters without every caller
                    being updated is a broken build, not a silent one, because
                    Wayfinder&apos;s generated functions are regenerated from
                    the same routes and fail to compile where they no longer
                    match.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">
                    The same boundary, written twice
                </h2>
                <p className="mt-1">
                    Chapter 29&apos;s error page is small enough to show in
                    full. Its controller passes exactly these three props:
                </p>
                <CodeBlock
                    code={CONTROLLER_PROPS}
                    lang="php"
                    className="mt-1 overflow-x-auto"
                />
                <p className="mt-2">
                    Its component declares exactly this type for them,
                    resources/js/pages/chapters/error-handling-page.tsx:
                </p>
                <CodeBlock
                    code={COMPONENT_TYPE}
                    lang="typescript"
                    className="mt-1 overflow-x-auto"
                />
                <p className="mt-2">
                    Nobody generated the second block from the first, or the
                    first from the second. A person wrote both, by hand,
                    trusting that the names and the shapes line up.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    What actually checks this: nothing
                </h2>
                <p className="mt-1">
                    This repository runs five gates: pint and phpstan on the PHP
                    side, eslint, prettier and tsc on the TypeScript side. None
                    of them reads across that boundary. phpstan checks that
                    ErrorHandlingController&apos;s own code is internally
                    consistent; tsc checks that error-handling-page.tsx is
                    internally consistent. Neither tool is given the other
                    language&apos;s file, so neither can compare the props array
                    here to the type there. If the controller renamed
                    requestPath to path tomorrow, tsc would not fail: the
                    component&apos;s requestPath field would simply always be
                    undefined at runtime, and every place the component reads it
                    would silently render the string &quot;undefined&quot;
                    instead. Only a test that reads the actual response, the way
                    every chapter test in this application does through
                    assertInertiaPage(), would catch that, and only if it
                    happened to assert that specific key.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    Where Wayfinder fits, and where it does not
                </h2>
                <p className="mt-1">
                    laravel/wayfinder and @laravel/vite-plugin-wayfinder are
                    both installed in this application (see vite.config.ts), and
                    the plugin regenerates resources/js/actions and
                    resources/js/routes on every build. For
                    ErrorHandlingController::show(), the generated function
                    looks like this:
                </p>
                <CodeBlock
                    code={WAYFINDER_EXAMPLE}
                    lang="typescript"
                    className="mt-1 overflow-x-auto"
                />
                <p className="mt-2">
                    That types the request side of a visit: the URL and the
                    method, kept correct because it is regenerated from the same
                    routes on every build, so a renamed route parameter fails
                    the TypeScript build rather than failing silently at
                    runtime. It does not type what the controller sends back.
                    Nothing in resources/js/actions describes
                    ErrorHandlingPageProps or any other page&apos;s props shape;
                    that remains exactly the hand-written, unchecked boundary
                    described above. No chapter in this application currently
                    imports from resources/js/actions or resources/js/routes:
                    every visit call in this codebase names its URL as a plain
                    string instead, which is a choice this lab made for its own
                    routes, not a limit of what Wayfinder can do.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    Code splitting, already happening
                </h2>
                <p className="mt-1">
                    resources/js/app.tsx calls createInertiaApp() with neither a
                    pages nor a resolve option. Verified in
                    node_modules/@inertiajs/vite/dist/index.js: the Vite plugin
                    detects a createInertiaApp() call with neither property and
                    injects a default resolver built around
                    import.meta.glob('./pages/**/*.tsx'), with eager left at its
                    own default of false. An import.meta.glob call built that
                    way hands Vite one dynamic import per matched file, and a
                    dynamic import is what makes a separate chunk; nothing about
                    this application&apos;s own Vite config adds that behaviour
                    on top; it is the plugin&apos;s default with no
                    configuration at all.
                </p>
                <p className="mt-2">
                    This exact page is proof rather than an example: read from
                    the real manifest for this build,{' '}
                    {buildInfo.available ? (
                        <>
                            it compiles to{' '}
                            <code className="font-mono">{buildInfo.file}</code>,{' '}
                            {buildInfo.bytes ?? 'an unknown number of'} bytes, a
                            dynamic entry ({String(buildInfo.isDynamicEntry)})
                            importing {buildInfo.importsCount} other chunk
                            {buildInfo.importsCount === 1 ? '' : 's'}. Nothing
                            on this page shipped inside app.tsx&apos;s own
                            bundle; it was fetched only once this exact URL was
                            visited.
                        </>
                    ) : (
                        <>
                            no build manifest was found. Run npm run build and
                            reload this page to see its own real numbers here
                            instead of this message.
                        </>
                    )}
                </p>
            </section>
        </ChapterShell>
    );
}
