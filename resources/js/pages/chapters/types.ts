// Shared by every chapter page component, so twenty-six chapters never carry twenty-six
// copies of the same two declarations. Shape mirrors App\Lab\Chapter::toArray() and the
// neighbour() helper shared across app/Http/Controllers/Chapters/*.
export type ChapterData = {
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
    part: string;
    partLabel: string;
    order: number;
};

export type Neighbour = { slug: string; title: string };

// Shared by every page that reads the demo user switcher's own props (shared on every
// response by HandleInertiaRequests::share()/shareOnce(), chapters/shared-data.tsx and
// chapters/authorization-and-csrf.tsx alike), so the two chapters cannot drift onto two
// different shapes for the same three props.
export type DemoUser = { id: number; name: string; email: string };

export type DemoUserOption = { id: number; name: string };
