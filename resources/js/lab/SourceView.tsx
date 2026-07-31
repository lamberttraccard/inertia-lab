import { useEffect, useState } from 'react';
import { CodeBlock } from './CodeBlock';
import { langForPath } from './highlighter';

type SourceFile = { path: string; contents: string; lines: number };

type SourcePayload = { server: SourceFile; client: SourceFile };

type State =
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'loaded'; data: SourcePayload };

type SourceViewProps = {
    slug: string;
    serverFile: string;
    clientFile: string;
};

// A plain, unheaded fetch, deliberately outside Inertia's visit lifecycle: this reads a
// source file for display, not a page navigation, so it must not appear in the inspector's wire tab
// next to the chapter's own lesson (the capture only records requests carrying an
// X-Inertia header, so a plain fetch never reaches it).
export function SourceView({ slug, serverFile, clientFile }: SourceViewProps) {
    // The initial state already covers the mount case; a chapter page is keyed by its own
    // route, so this component never remounts with a changed slug in place, and the effect
    // never needs to reset back to loading itself.
    const [state, setState] = useState<State>({ status: 'loading' });

    useEffect(() => {
        let cancelled = false;

        fetch(`/lab/source/${slug}`, {
            headers: { Accept: 'application/json' },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(
                        `the server responded with ${response.status}`,
                    );
                }

                return response.json() as Promise<SourcePayload>;
            })
            .then((data) => {
                if (!cancelled) {
                    setState({ status: 'loaded', data });
                }
            })
            .catch((error: unknown) => {
                if (!cancelled) {
                    setState({
                        status: 'error',
                        message:
                            error instanceof Error
                                ? error.message
                                : 'unknown error',
                    });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [slug]);

    return (
        <section>
            <p className="text-neutral-600 dark:text-neutral-300">
                The server file and the client file that produced this page,
                read from disk on this request.
            </p>

            {/* Fail loudly: a source view that cannot read a file says so, rather than
                rendering an empty or silently stuck panel. */}
            {state.status === 'error' && (
                <p
                    role="status"
                    className="mt-2 border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
                >
                    Could not load the source for this chapter: {state.message}
                </p>
            )}

            {state.status === 'loading' && (
                <p
                    role="status"
                    className="mt-2 text-neutral-500 dark:text-neutral-400"
                >
                    Loading {serverFile} and {clientFile}.
                </p>
            )}

            {state.status === 'loaded' && (
                <div className="mt-2 space-y-4">
                    <div>
                        <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                            {state.data.server.path} ({state.data.server.lines}{' '}
                            lines)
                        </p>
                        <CodeBlock
                            code={state.data.server.contents}
                            lang={langForPath(state.data.server.path)}
                            showLineNumbers
                            className="mt-1 max-h-96 overflow-auto"
                        />
                    </div>
                    <div>
                        <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                            {state.data.client.path} ({state.data.client.lines}{' '}
                            lines)
                        </p>
                        <CodeBlock
                            code={state.data.client.contents}
                            lang={langForPath(state.data.client.path)}
                            showLineNumbers
                            className="mt-1 max-h-96 overflow-auto"
                        />
                    </div>
                </div>
            )}
        </section>
    );
}
