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
            new Chapter(
                slug: 'links-and-visits',
                title: 'Links, visits, and the options that shape them',
                question: 'What is the difference between a link and a manual visit, and what can you ask of either?',
                concept: 'Link is a visit with a nicer syntax; every visit takes the same option set.',
                routeName: 'chapters.links-and-visits',
                serverFile: 'app/Http/Controllers/Chapters/LinksAndVisitsController.php',
                clientFile: 'resources/js/pages/chapters/links-and-visits.tsx',
                translationFrom: 'A client router intercepts the click and you fetch in an effect.',
                translationTo: 'A link is an HTTP request whose response replaces the page.',
                docsUrl: 'https://inertiajs.com/docs/v3/the-basics/links',
                wave: 1,
                order: 4,
            ),
            new Chapter(
                slug: 'events',
                title: 'The events a visit fires',
                question: 'What happens, in order, between the click and the new screen?',
                concept: 'Every visit emits a fixed sequence of client events, some of which can cancel it.',
                routeName: 'chapters.events',
                serverFile: 'app/Http/Controllers/Chapters/EventsController.php',
                clientFile: 'resources/js/pages/chapters/events.tsx',
                translationFrom: 'Promise callbacks around your fetch.',
                translationTo: 'A lifecycle you can subscribe to globally or per visit.',
                docsUrl: 'https://inertiajs.com/docs/v3/advanced/events',
                wave: 1,
                order: 5,
            ),
            new Chapter(
                slug: 'asset-versioning',
                title: 'When the server has moved on',
                question: 'What happens to an open tab after you deploy?',
                concept: 'The client sends the asset version it booted with; a mismatch makes the server answer 409 and the client hard reload.',
                routeName: 'chapters.asset-versioning',
                serverFile: 'app/Http/Controllers/Chapters/AssetVersioningController.php',
                clientFile: 'resources/js/pages/chapters/asset-versioning.tsx',
                translationFrom: 'A version banner you build yourself, or nothing at all.',
                translationTo: 'A header on every visit and a 409 the client already knows how to handle.',
                docsUrl: 'https://inertiajs.com/docs/v3/advanced/asset-versioning',
                wave: 1,
                order: 6,
            ),
            new Chapter(
                slug: 'props-and-types',
                title: 'What can be a prop',
                question: 'What exactly can you put in the array you hand to Inertia::render()?',
                concept: 'Values, closures, backed enums, Eloquent models and objects that describe themselves are all valid props, and a nested structure can be addressed one leaf at a time by dot notation.',
                routeName: 'chapters.props-and-types',
                serverFile: 'app/Http/Controllers/Chapters/PropsAndTypesController.php',
                clientFile: 'resources/js/pages/chapters/props-and-types.tsx',
                translationFrom: 'A serializer or resource class that shapes the JSON before the client ever sees it.',
                translationTo: 'The array you return from the controller, plus objects that know how to present themselves.',
                docsUrl: 'https://inertiajs.com/docs/v3/the-basics/responses',
                wave: 1,
                order: 7,
            ),
            new Chapter(
                slug: 'shared-data',
                title: 'Props every page gets',
                question: 'How does the header know who is signed in on every single page?',
                concept: 'Inertia::share() adds props to every response; a closure shared this way is still only evaluated when a response actually needs it.',
                routeName: 'chapters.shared-data',
                serverFile: 'app/Http/Controllers/Chapters/SharedDataController.php',
                clientFile: 'resources/js/pages/chapters/shared-data.tsx',
                translationFrom: 'A global store hydrated once at boot, then kept in sync by hand.',
                translationTo: 'Props the server attaches to every response, recomputed on every request by default, or sent once and skipped afterward for a prop marked that way.',
                docsUrl: 'https://inertiajs.com/docs/v3/data-props/shared-data',
                wave: 1,
                order: 8,
            ),
            new Chapter(
                slug: 'partial-reloads',
                title: 'Asking for less',
                question: 'Sorting a table should not refetch the whole page. How do you ask for one prop?',
                concept: 'The only, except and reset visit options send header lists the server uses to skip work it would otherwise do again.',
                routeName: 'chapters.partial-reloads',
                serverFile: 'app/Http/Controllers/Chapters/PartialReloadsController.php',
                clientFile: 'resources/js/pages/chapters/partial-reloads.tsx',
                translationFrom: 'A second endpoint that returns just the rows a table needs.',
                translationTo: 'The same endpoint, told through a header which props you still need.',
                docsUrl: 'https://inertiajs.com/docs/v3/data-props/partial-reloads',
                wave: 1,
                order: 9,
            ),
            new Chapter(
                slug: 'optional-props',
                title: 'Props that are never sent unless asked for',
                question: 'How do you attach expensive data to a page without paying for it on load?',
                concept: 'Inertia::optional() is skipped on every request that does not name it explicitly, even a full page load.',
                routeName: 'chapters.optional-props',
                serverFile: 'app/Http/Controllers/Chapters/OptionalPropsController.php',
                clientFile: 'resources/js/pages/chapters/optional-props.tsx',
                translationFrom: 'A separate endpoint you call only when the panel that needs it actually opens.',
                translationTo: 'A prop on this same page that the server only computes once a partial reload asks for it by name.',
                docsUrl: 'https://inertiajs.com/docs/v3/data-props/partial-reloads',
                wave: 1,
                order: 10,
            ),
            new Chapter(
                slug: 'deferred-props',
                title: 'Render now, fetch the rest',
                question: 'How does the page appear instantly when one of its panels takes a second to compute?',
                concept: 'Inertia::defer() sends the page immediately and lets the client fetch the deferred groups afterwards, on its own.',
                routeName: 'chapters.deferred-props',
                serverFile: 'app/Http/Controllers/Chapters/DeferredPropsController.php',
                clientFile: 'resources/js/pages/chapters/deferred-props.tsx',
                translationFrom: 'Render a spinner, fire a second request from an effect, and handle its loading and error states by hand.',
                translationTo: 'Declare the prop deferred and wrap the panel in the Deferred component; the client requests it after the page has already rendered.',
                docsUrl: 'https://inertiajs.com/docs/v3/data-props/deferred-props',
                wave: 1,
                order: 11,
            ),
            new Chapter(
                slug: 'always-props',
                title: 'Props that ignore your instructions',
                question: 'You asked for one prop. Why did three arrive?',
                concept: 'Inertia::always() survives partial reload filtering; errors, shared by the framework itself, behaves the same way.',
                routeName: 'chapters.always-props',
                serverFile: 'app/Http/Controllers/Chapters/AlwaysPropsController.php',
                clientFile: 'resources/js/pages/chapters/always-props.tsx',
                translationFrom: 'A response envelope you always merge into your client-side store, whether this request needed it or not.',
                translationTo: 'Props the server marks as non-negotiable, included in every response regardless of what only or except named.',
                docsUrl: 'https://inertiajs.com/docs/v3/data-props/partial-reloads',
                wave: 1,
                order: 12,
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
