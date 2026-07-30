import { Fragment, useEffect, useState } from 'react';
import type { CodeLang } from './highlighter';
import { highlightCode } from './highlighter';

type CodeBlockProps = {
    code: string;
    lang: CodeLang;
    // Only the source view's whole-file panels turn this on: several chapters refer to
    // specific lines in prose, and the short illustrative snippets never need it.
    showLineNumbers?: boolean;
    className?: string;
};

// The one component every code block in this application renders through, whether it
// is a whole file from the source view or a short snippet inline in a chapter: one
// highlighting path, one failure path, so the two never drift apart.
type Highlighted = { code: string; lang: CodeLang; html: string };

export function CodeBlock({
    code,
    lang,
    showLineNumbers = false,
    className = '',
}: CodeBlockProps) {
    // Keyed by the code/lang it was produced from, rather than reset to null up front,
    // so a result that arrives for a since-changed prop is simply never read below
    // instead of needing a second, synchronous setState to invalidate it.
    const [highlighted, setHighlighted] = useState<Highlighted | null>(null);

    useEffect(() => {
        let cancelled = false;

        highlightCode(code, lang)
            .then((html) => {
                if (!cancelled) {
                    setHighlighted({ code, lang, html });
                }
            })
            .catch(() => {
                // Left as plain code below on purpose: a highlighter failure is not
                // an error a reader needs told, since the code is already legible.
            });

        return () => {
            cancelled = true;
        };
    }, [code, lang]);

    const html =
        highlighted && highlighted.code === code && highlighted.lang === lang
            ? highlighted.html
            : null;

    const wrapperClassName = [
        'lab-code rounded bg-neutral-100 p-3 text-xs dark:bg-neutral-900',
        showLineNumbers ? 'lab-code-numbered' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    if (html !== null) {
        return (
            <div
                className={wrapperClassName}
                // Shiki escaped every character of `code` above while tokenizing it;
                // this string never carries anything beyond that HTML rendering of it.
                dangerouslySetInnerHTML={{ __html: html }}
            />
        );
    }

    // The fallback, used before highlighting resolves and if it never does: the same
    // line-per-span shape Shiki itself renders, so line numbers work identically in
    // both states and swapping one for the other moves no pixel except the colour.
    return (
        <div className={wrapperClassName}>
            <pre tabIndex={0}>
                <code>
                    {code.split('\n').map((line, index) => (
                        <Fragment key={index}>
                            {index > 0 ? '\n' : null}
                            <span className="line">{line}</span>
                        </Fragment>
                    ))}
                </code>
            </pre>
        </div>
    );
}
