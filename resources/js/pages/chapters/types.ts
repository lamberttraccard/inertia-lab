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
    order: number;
};

export type Neighbour = { slug: string; title: string };
