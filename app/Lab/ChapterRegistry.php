<?php

namespace App\Lab;

class ChapterRegistry
{
    /** @var array<int, Chapter>|null */
    private ?array $chapters = null;

    /** @return array<int, Chapter> */
    public function all(): array
    {
        return $this->chapters ??= [
            new Chapter(
                slug: 'mental-model',
                title: 'Where did the API go?',
                question: 'If the component never calls an endpoint, how does it get its data?',
                concept: 'The server decides what the client receives, and sends it with the page.',
                routeName: 'chapters.mental-model',
                serverFile: 'app/Http/Controllers/Chapters/MentalModelController.php',
                clientFile: 'resources/js/pages/chapters/mental-model.tsx',
                translationFrom: 'A GET /api/posts endpoint, an API resource, a fetch call in useEffect, and a loading state.',
                translationTo: 'A route, a controller, and a props array. The component receives the data already resolved, as arguments.',
                docsUrl: 'https://inertiajs.com/docs/v3/core-concepts/how-it-works',
                wave: 1,
                order: 0,
            ),
            new Chapter(
                slug: 'first-load-vs-visit',
                title: 'What actually travels on the wire',
                question: 'The first time you open a page you get HTML. What do you get the second time?',
                concept: 'The initial request returns a document; every visit after it returns the page object as JSON.',
                routeName: 'chapters.first-load-vs-visit',
                serverFile: 'app/Http/Controllers/Chapters/FirstLoadVsVisitController.php',
                clientFile: 'resources/js/pages/chapters/first-load-vs-visit.tsx',
                translationFrom: 'An HTML shell that boots a client router, then a separate JSON API call for the data.',
                translationTo: 'One response that carries both the page to render and the data to render it with.',
                docsUrl: 'https://inertiajs.com/docs/v3/core-concepts/how-it-works',
                wave: 1,
                order: 1,
            ),
            new Chapter(
                slug: 'render-and-components',
                title: 'From a controller to a component',
                question: 'How does a string in a controller become a React component on screen?',
                concept: 'Inertia::render() names a component; the client resolves that name to a module.',
                routeName: 'chapters.render-and-components',
                serverFile: 'app/Http/Controllers/Chapters/RenderAndComponentsController.php',
                clientFile: 'resources/js/pages/chapters/render-and-components.tsx',
                translationFrom: 'A controller returns JSON and the client router decides what to render.',
                translationTo: 'The controller names the component and passes it data in one step.',
                docsUrl: 'https://inertiajs.com/docs/v3/the-basics/responses',
                wave: 1,
                order: 2,
            ),
            new Chapter(
                slug: 'redirects',
                title: 'Redirects, and why a delete becomes a GET',
                question: 'After a POST or a DELETE, what does the browser end up showing?',
                concept: "Inertia follows the server's redirect and renders the page it lands on; 303 is forced after PUT, PATCH and DELETE so the follow-up is a GET.",
                routeName: 'chapters.redirects',
                serverFile: 'app/Http/Controllers/Chapters/RedirectsController.php',
                clientFile: 'resources/js/pages/chapters/redirects.tsx',
                translationFrom: 'The client decides what to do after a mutation, then refetches.',
                translationTo: 'The server redirects, and the response to that redirect is the next page.',
                docsUrl: 'https://inertiajs.com/docs/v3/the-basics/redirects',
                wave: 1,
                order: 3,
            ),
        ];
    }

    public function find(string $slug): ?Chapter
    {
        return collect($this->all())->firstWhere('slug', $slug);
    }

    public function next(string $slug): ?Chapter
    {
        $index = $this->indexOf($slug);

        return $index === false ? null : ($this->all()[$index + 1] ?? null);
    }

    public function previous(string $slug): ?Chapter
    {
        $index = $this->indexOf($slug);

        return $index === false || $index === 0 ? null : $this->all()[$index - 1];
    }

    private function indexOf(string $slug): int|false
    {
        return array_search($slug, array_map(fn (Chapter $chapter) => $chapter->slug, $this->all()), true);
    }
}
