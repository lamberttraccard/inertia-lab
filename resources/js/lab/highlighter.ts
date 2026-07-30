import type { HighlighterCore } from 'shiki/core';

// The five grammars every code block in this application actually needs: the two
// languages the lab is written in, the two the source view can show verbatim, and
// shell for any snippet that shows a command. Every other language Shiki ships stays
// out of the bundle.
export type CodeLang = 'php' | 'tsx' | 'typescript' | 'json' | 'shell';

export const LIGHT_THEME = 'github-light';
export const DARK_THEME = 'github-dark';

let highlighterPromise: Promise<HighlighterCore> | null = null;

async function createHighlighter(): Promise<HighlighterCore> {
    const [{ createHighlighterCore }, { createOnigurumaEngine }] =
        await Promise.all([
            import('shiki/core'),
            import('shiki/engine/oniguruma'),
        ]);

    return createHighlighterCore({
        themes: [
            import('@shikijs/themes/github-light'),
            import('@shikijs/themes/github-dark'),
        ],
        langs: [
            import('@shikijs/langs/php'),
            import('@shikijs/langs/tsx'),
            import('@shikijs/langs/typescript'),
            import('@shikijs/langs/json'),
            import('@shikijs/langs/shell'),
        ],
        engine: createOnigurumaEngine(import('shiki/wasm')),
    });
}

function loadHighlighter(): Promise<HighlighterCore> {
    if (highlighterPromise === null) {
        highlighterPromise = createHighlighter().catch((error: unknown) => {
            // A dropped chunk request or a wasm hiccup on this attempt should not
            // poison every code block for the rest of the page's life: the next
            // mount gets a fresh attempt instead of the same rejected promise.
            highlighterPromise = null;

            throw error;
        });
    }

    return highlighterPromise;
}

// Callers render the plain, already-legible code while this resolves and if it ever
// rejects; there is no loading state to represent here on purpose.
export async function highlightCode(
    code: string,
    lang: CodeLang,
): Promise<string> {
    const highlighter = await loadHighlighter();

    return highlighter.codeToHtml(code, {
        lang,
        themes: { light: LIGHT_THEME, dark: DARK_THEME },
    });
}

// Every real file this application highlights is either a Laravel/PHP source file or
// a TSX page or component; this only needs to tell those two apart.
export function langForPath(path: string): CodeLang {
    return path.endsWith('.tsx') ? 'tsx' : 'php';
}
