import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

// Shared by this component and the glossary page, so a chapter linking a term and the
// glossary anchoring its definition can never drift onto two different ids for the same
// word: there is exactly one place that turns "Deferred prop" into "deferred-prop".
export function glossaryAnchor(term: string): string {
    return term
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

type TermProps = {
    /** The glossary entry's term text exactly as LabController::TERMS spells it, e.g. "Deferred prop". */
    term: string;
    children: ReactNode;
};

// Every chapter's first use of a glossary word renders through this, per the spec's rule
// that vocabulary links to its definition on first use rather than leaving the glossary an
// orphan page. children carries whatever inflection reads naturally in the sentence
// ("deferred props"), term is always the glossary's own spelling, so the two pages agree on
// where the link lands regardless of how the chapter's prose phrases it.
export function Term({ term, children }: TermProps) {
    return (
        <Link
            href={`/lab/glossary#${glossaryAnchor(term)}`}
            className="underline decoration-dotted underline-offset-4"
        >
            {children}
        </Link>
    );
}
