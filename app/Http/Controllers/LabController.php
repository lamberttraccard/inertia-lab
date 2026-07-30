<?php

namespace App\Http\Controllers;

use App\Lab\Chapter;
use App\Lab\ChapterRegistry;
use App\Lab\SourceReader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;
use RuntimeException;

class LabController extends Controller
{
    /** @var array<int, array{term: string, definition: string}> */
    private const TERMS = [
        [
            'term' => 'Visit',
            'definition' => "A navigation Inertia performs without a full page reload: the client asks the current URL's route for a new page object and swaps it in. Clicking a Link or calling router.visit() both start a visit.",
        ],
        [
            'term' => 'Page object',
            'definition' => 'The JSON structure the server sends back on every visit: component, props, url and version, plus whichever metadata keys the response actually uses.',
        ],
        [
            'term' => 'Prop',
            'definition' => 'A single named value passed from the controller to the page component, the same way an argument is passed to a function. Every value the component renders arrived this way.',
        ],
        [
            'term' => 'Shared prop',
            'definition' => "A prop present on every page because the application's Inertia middleware adds it to every response, rather than one controller declaring it on its own.",
        ],
        [
            'term' => 'Partial reload',
            'definition' => 'A visit that asks the server to resolve only some of the current page props, using the only or except visit options, instead of the full set.',
        ],
        [
            'term' => 'Deferred prop',
            'definition' => 'A prop the server deliberately skips on the first response and resolves only when a follow-up request asks for it by name.',
        ],
        [
            'term' => 'Optional prop',
            'definition' => 'A prop the server never resolves unless a partial reload names it explicitly. Unlike a deferred prop, nothing asks for it automatically.',
        ],
        [
            'term' => 'Merge intent',
            'definition' => "A header the client sends when InfiniteScroll fetches an adjacent page, X-Inertia-Infinite-Scroll-Merge-Intent, naming append for the next page and prepend for the previous one. Inertia::scroll()'s ScrollProp reads it server-side to decide which direction the resolved data merges into what the client already holds.",
        ],
        [
            'term' => 'Asset version',
            'definition' => "A hash of the current frontend build. When the client's remembered version stops matching the server's, Inertia forces a full page reload instead of a partial one.",
        ],
        [
            'term' => 'Error bag',
            'definition' => "A named bucket for validation errors, used when a page can submit more than one form and needs to keep each form's errors separate.",
        ],
        [
            'term' => 'Always prop',
            'definition' => "A prop wrapped in Inertia::always(), included in every response even when a partial reload's only or except would otherwise have excluded it.",
        ],
        [
            'term' => 'Merge prop',
            'definition' => 'A prop wrapped in Inertia::merge() or Inertia::deepMerge(), whose new value the client combines with what it already holds instead of replacing outright. A plain merge only combines at the root (or at a path named with append or prepend); deepMerge recurses into nested arrays and objects instead of overwriting them wholesale.',
        ],
        [
            'term' => 'Scroll prop',
            'definition' => 'A prop wrapped in Inertia::scroll(), built from a paginator. It carries pagination metadata (a page name, and the previous, next and current page identifiers) that the InfiniteScroll component reads to fetch the adjacent page and merge it into the wrapped data array, in either direction.',
        ],
        [
            'term' => 'Once prop',
            'definition' => 'A prop wrapped in Inertia::once(), sent to the client a single time. The client then names it in an X-Inertia-Except-Once-Props header on later requests, and the server skips resolving it again, unless a partial reload of the same page names that same prop explicitly.',
        ],
        [
            'term' => 'Polling',
            'definition' => 'Reloading chosen props on a fixed interval through usePoll, instead of opening a persistent connection such as a websocket. Polling throttles sharply once the browser tab is hidden, unless keepAlive is set.',
        ],
        [
            'term' => 'Multipart request',
            'definition' => "A request whose body is encoded as multipart/form-data instead of JSON, the encoding a file upload needs. Putting a File anywhere in a visit's data is what makes the visit send this way; nothing else about declaring or submitting the form changes.",
        ],
        [
            'term' => 'Precognition',
            'definition' => "A request carrying a Precognition header, sent to the same route and with the same data a real submission would use. The server validates as usual, then stops before running the action that would actually change anything, so the client can ask the server's own rules whether a value is acceptable without duplicating them.",
        ],
        [
            'term' => 'Prefetch',
            'definition' => "Fetching a link's response before it is clicked, on hover, on mount or on the mouse-down before a click, into a client-side cache. A later visit to the same URL with the same options is served from that cache instead of sending a new request.",
        ],
        [
            'term' => 'Instant visit',
            'definition' => 'A visit whose target component is named up front, on the link or the visit itself. The client renders that component immediately, with whatever shared props the current page already holds and every page-specific prop undefined, then swaps in the real page once its response arrives.',
        ],
        [
            'term' => 'Optimistic update',
            'definition' => "A local change to a page's props applied immediately, before the server confirms it, through router.optimistic() or a form's own equivalent. The client remembers the value each changed prop held beforehand and restores it automatically once the visit finishes without having succeeded.",
        ],
        [
            'term' => 'View transition',
            'definition' => "A browser-native animation between two page states, requested by passing viewTransition to a visit. Inertia hands the swap to the browser's View Transitions API where the current browser supports it, and performs a plain, unanimated swap everywhere else.",
        ],
        [
            'term' => 'Remembered state',
            'definition' => 'Local component state saved into the current history entry by useRemember. A component rebuilt from that same entry, after a full remount rather than a mere reload, reads its initial value back out of it instead of starting over.',
        ],
        [
            'term' => 'Encrypted history',
            'definition' => 'A history entry the client encrypted before storing it, because the route that rendered it called encryptHistory(). clearHistory() deletes the key those entries were encrypted with, so pressing back to one afterward can no longer be decrypted, not merely hidden.',
        ],
        [
            'term' => 'Persistent layout',
            'definition' => "A component assigned to a page's own layout property that the client keeps mounted across a visit to another page assigning that same component, rather than tearing it down and rebuilding it. Only the part of the tree it wraps is replaced.",
        ],
        [
            'term' => 'Head component',
            'definition' => 'The Head component exported by @inertiajs/react, which sets the document title and renders meta tags for the current page without a separate library to install or mount. More than one can be rendered on the same page; whichever one mounted last wins the title.',
        ],
        [
            'term' => 'Exception response',
            'definition' => "The object a callback registered with Inertia::handleExceptionsUsing() receives for a thrown exception: the exception itself, the request, and the framework's own already-rendered response, plus render(), withSharedData(), usingMiddleware() and rootView() to replace that response with a normal Inertia page instead.",
        ],
        [
            'term' => 'Policy',
            'definition' => 'A class Laravel resolves by naming convention (App\\Models\\X to App\\Policies\\XPolicy) that centralizes whether a given user may perform a given action on a given model instance, checked through the Gate facade rather than decoded from a token.',
        ],
    ];

    /** @var array<int, array{artefact: string, inertiaEquivalent: string, disappears: bool, chapter: string}> */
    private const ROWS = [
        [
            'artefact' => 'REST endpoint',
            'inertiaEquivalent' => 'The same route and controller that render the page. There is no separate data endpoint: the controller returns the page and its data together.',
            'disappears' => false,
            'chapter' => 'mental-model',
        ],
        [
            'artefact' => 'A hand-designed JSON response shape',
            'inertiaEquivalent' => 'The page object every visit already carries: component, props, url and version, plus whichever metadata keys that response actually used. There is no envelope to design; it is the same shape on every route.',
            'disappears' => true,
            'chapter' => 'first-load-vs-visit',
        ],
        [
            'artefact' => 'fetch or axios call',
            'inertiaEquivalent' => 'No client-side data call. The prop is already resolved by the time the component receives it, the way a function receives an argument.',
            'disappears' => true,
            'chapter' => 'mental-model',
        ],
        [
            'artefact' => 'CORS configuration',
            'inertiaEquivalent' => 'Not applicable: the page and its data are served from the same origin, in the same response. There is no cross-origin request to configure.',
            'disappears' => true,
            'chapter' => 'mental-model',
        ],
        [
            'artefact' => 'Client-side router matching a URL to a component',
            'inertiaEquivalent' => 'Inertia::render() names a component from the server, and the client resolves that name to a module. There is no client-side route table matching paths to components.',
            'disappears' => false,
            'chapter' => 'render-and-components',
        ],
        [
            'artefact' => 'Client-side redirect handling after a mutation',
            'inertiaEquivalent' => "The server's own redirect, which Inertia follows and renders automatically. A DELETE, PUT or PATCH forces the follow-up request to be a GET, so reloading the page it lands on never repeats the mutation.",
            'disappears' => false,
            'chapter' => 'redirects',
        ],
        [
            'artefact' => 'Visit options passed to a client-side router',
            'inertiaEquivalent' => 'The same option set on every visit or Link: replace, preserveState, preserveScroll, preserveUrl, only, except and more, sent as headers the server reads.',
            'disappears' => false,
            'chapter' => 'links-and-visits',
        ],
        [
            'artefact' => 'Promise callbacks or interceptors around a request',
            'inertiaEquivalent' => 'A fixed sequence of events every visit fires, from before to finish, some of which can cancel the visit if a listener returns false.',
            'disappears' => false,
            'chapter' => 'events',
        ],
        [
            'artefact' => 'A deploy banner or stale-client detection',
            'inertiaEquivalent' => 'A version hash sent with every visit. Once it stops matching what the server now serves, the next visit gets a 409 and the client reloads the page fully on its own, with no banner to build.',
            'disappears' => false,
            'chapter' => 'asset-versioning',
        ],
        [
            'artefact' => 'API resource or serializer',
            'inertiaEquivalent' => 'The props array built directly in the controller, or a class implementing ProvidesInertiaProperty or ProvidesInertiaProperties. Shaping the response and rendering the page happen in the same step.',
            'disappears' => false,
            'chapter' => 'props-and-types',
        ],
        [
            'artefact' => 'Global client store for cross-cutting data',
            'inertiaEquivalent' => 'Inertia::share(), which attaches props to every response from one place. A closure shared this way is only evaluated once a response actually needs it.',
            'disappears' => false,
            'chapter' => 'shared-data',
        ],
        [
            'artefact' => 'A second endpoint for a partial UI update',
            'inertiaEquivalent' => 'The same route and controller, told through a header which props to resolve this time. The only and except visit options skip the server-side work, not just trim the payload afterwards.',
            'disappears' => false,
            'chapter' => 'partial-reloads',
        ],
        [
            'artefact' => 'An endpoint called only once a panel opens',
            'inertiaEquivalent' => 'Inertia::optional(), a prop on the same page that the server never resolves unless a later partial reload names it explicitly.',
            'disappears' => false,
            'chapter' => 'optional-props',
        ],
        [
            'artefact' => 'Loading state for a slow section of the page',
            'inertiaEquivalent' => 'Nothing, for a first render: the data is already there. For a prop wrapped in Inertia::defer(), the fallback slot of the Deferred component covers the one request that still needs it.',
            'disappears' => false,
            'chapter' => 'deferred-props',
        ],
        [
            'artefact' => 'A response envelope merged in on every call regardless of need',
            'inertiaEquivalent' => "Inertia::always(), which survives only and except filtering. The framework's own errors prop, shared on every response, behaves the same way.",
            'disappears' => false,
            'chapter' => 'always-props',
        ],
        [
            'artefact' => 'Manually concatenating and deduplicating a load more list',
            'inertiaEquivalent' => 'Inertia::merge() or Inertia::deepMerge(), which mark a prop so the client combines the new response with what it already holds, matching existing items on a named key instead of duplicating them.',
            'disappears' => false,
            'chapter' => 'merging-props',
        ],
        [
            'artefact' => 'Pagination metadata',
            'inertiaEquivalent' => 'Inertia::scroll(), built from a real paginator, carries the previous, next and current page identifiers the InfiniteScroll component needs to page in either direction.',
            'disappears' => false,
            'chapter' => 'infinite-scroll',
        ],
        [
            'artefact' => 'Caching static reference data client-side',
            'inertiaEquivalent' => 'Inertia::once(), which sends a prop a single time. The client names it in a header on every later request, and the server trusts that header instead of resolving the value again.',
            'disappears' => false,
            'chapter' => 'once-props',
        ],
        [
            'artefact' => 'A websocket or interval poll for a live counter',
            'inertiaEquivalent' => 'usePoll, which reissues the same partial reload on a fixed interval and throttles sharply once the tab is hidden, unless keepAlive is set.',
            'disappears' => false,
            'chapter' => 'polling',
        ],
        [
            'artefact' => 'Client-side form library',
            'inertiaEquivalent' => 'The Form component or useForm, both shipped with the adapter. A failed submission redirects back with errors already attached, read like any other prop.',
            'disappears' => false,
            'chapter' => 'forms',
        ],
        [
            'artefact' => 'Building FormData and an upload progress handler by hand',
            'inertiaEquivalent' => "Putting a File anywhere in the visit's data. The visit becomes multipart automatically, and upload progress arrives as a prop of its own.",
            'disappears' => true,
            'chapter' => 'file-uploads',
        ],
        [
            'artefact' => "Client-side validation duplicated from the server's rules",
            'inertiaEquivalent' => 'A Precognition request: the same route and the same data a real submission would send, tagged with a header that makes the server validate and stop there.',
            'disappears' => true,
            'chapter' => 'precognition',
        ],
        [
            'artefact' => 'Client-side cache for pages already visited',
            'inertiaEquivalent' => 'A cache the router itself owns: a link can prefetch its target on hover, mount or click, kept for a configurable duration and tagged for later.',
            'disappears' => false,
            'chapter' => 'prefetching',
        ],
        [
            'artefact' => 'Cache invalidation after a mutation',
            'inertiaEquivalent' => 'router.flush(), router.flushByCacheTags() and router.flushAll(), which drop one, several or every cached entry the router is holding.',
            'disappears' => false,
            'chapter' => 'prefetching',
        ],
        [
            'artefact' => 'A hand-built optimistic route transition or skeleton screen',
            'inertiaEquivalent' => 'A visit given a component name up front: the client renders that component immediately with the shared props already on hand, then swaps in the real page once it arrives.',
            'disappears' => false,
            'chapter' => 'instant-visits',
        ],
        [
            'artefact' => 'Optimistic UI update with a manual rollback',
            'inertiaEquivalent' => 'router.optimistic() and its form equivalents, which apply the change immediately and restore the previous value automatically if the visit finishes without succeeding.',
            'disappears' => false,
            'chapter' => 'optimistic-updates',
        ],
        [
            'artefact' => 'A page-transition animation library',
            'inertiaEquivalent' => "The viewTransition visit option, which hands the page swap to the browser's own View Transitions API where it exists, and changes nothing where it does not.",
            'disappears' => false,
            'chapter' => 'view-transitions',
        ],
        [
            'artefact' => 'Client-side state persistence across a remount',
            'inertiaEquivalent' => 'useRemember, which puts component state into the current history entry itself, restored automatically once that entry becomes current again.',
            'disappears' => false,
            'chapter' => 'remembering-state',
        ],
        [
            'artefact' => 'Clearing sensitive data from browser history on logout',
            'inertiaEquivalent' => 'encryptHistory(), which encrypts every history entry a route builds this way, and clearHistory(), which drops the key those entries were encrypted with.',
            'disappears' => false,
            'chapter' => 'history-encryption',
        ],
        [
            'artefact' => 'A persistent shell or layout across route changes',
            'inertiaEquivalent' => "A component assigned as a page's layout, kept mounted across a visit to another page assigning that same component, instead of being torn down and rebuilt.",
            'disappears' => false,
            'chapter' => 'layouts',
        ],
        [
            'artefact' => 'A one-off request that should not navigate',
            'inertiaEquivalent' => "useHttp, which shares the router's own conventions for data and errors without producing a visit, touching history, or carrying the X-Inertia header a visit always does.",
            'disappears' => false,
            'chapter' => 'http-requests',
        ],
        [
            'artefact' => 'Head or meta management library',
            'inertiaEquivalent' => 'The Head component shipped with the adapter itself, mounted the same way any other component is, with no separate library to install or configure.',
            'disappears' => false,
            'chapter' => 'head-and-meta',
        ],
        [
            'artefact' => 'Error state',
            'inertiaEquivalent' => 'The same page component. Validation errors arrive as an ordinary prop, and a genuine server exception can render as a normal Inertia page too, through Inertia::handleExceptionsUsing().',
            'disappears' => false,
            'chapter' => 'error-handling',
        ],
        [
            'artefact' => 'Token authentication',
            'inertiaEquivalent' => 'The session cookie the browser already sends with every request. An Inertia visit is a same-origin request, not a call to a separate API, so there is no bearer token to attach.',
            'disappears' => true,
            'chapter' => 'authorization-and-csrf',
        ],
        [
            'artefact' => 'Authorization or permission checks decoded from a token',
            'inertiaEquivalent' => 'Props computed server-side from a real policy on every request, such as a can array. Nothing is decoded on the client, because nothing was encoded for it in the first place.',
            'disappears' => false,
            'chapter' => 'authorization-and-csrf',
        ],
        [
            'artefact' => 'CSRF token handling',
            'inertiaEquivalent' => "Laravel's own CSRF middleware, checking the token the session already carries. A stale or wrong one is rejected with a 419 before the action it targeted ever runs.",
            'disappears' => false,
            'chapter' => 'authorization-and-csrf',
        ],
        [
            'artefact' => 'Devtools for inspecting requests and state',
            'inertiaEquivalent' => 'The official Inertia DevTools browser extension, which records every visit this application makes and pairs each one with the props it resolved.',
            'disappears' => false,
            'chapter' => 'devtools-and-testing',
        ],
        [
            'artefact' => 'Mocking the server in frontend tests',
            'inertiaEquivalent' => 'Nothing to mock: a Pest test drives the real route and reads the same page object a browser would receive, through helpers built on top of AssertableInertia.',
            'disappears' => true,
            'chapter' => 'devtools-and-testing',
        ],
        [
            'artefact' => 'API contract and its versioning',
            'inertiaEquivalent' => "The TypeScript type of the page's props, written next to the component. There is no separate contract document to keep in sync, because the props array the controller returns is the contract.",
            'disappears' => false,
            'chapter' => 'typescript-and-splitting',
        ],
        [
            'artefact' => 'Route-level code splitting',
            'inertiaEquivalent' => "The build's own default behaviour: Vite gives every page component its own chunk, fetched only once a visit actually renders that page.",
            'disappears' => false,
            'chapter' => 'typescript-and-splitting',
        ],
    ];

    public function home(ChapterRegistry $registry): Response
    {
        return Inertia::render('lab/home', [
            'parts' => array_map(
                fn (array $part) => [
                    'key' => $part['key'],
                    'label' => $part['label'],
                    'description' => $part['description'],
                    'chapters' => array_map(fn (Chapter $chapter) => $chapter->toArray(), $part['chapters']),
                ],
                $registry->partsWithChapters()
            ),
            'versions' => [
                'inertiaLaravel' => self::installedPackageVersion('inertiajs/inertia-laravel'),
                'inertiaReact' => self::installedReactVersion(),
                'laravel' => app()->version(),
                'php' => PHP_VERSION,
            ],
        ]);
    }

    private static function installedPackageVersion(string $name): string
    {
        $lock = json_decode((string) file_get_contents(base_path('composer.lock')), true, flags: JSON_THROW_ON_ERROR);

        if (! is_array($lock) || ! is_array($lock['packages'] ?? null)) {
            throw new RuntimeException('composer.lock does not have the expected packages list.');
        }

        $package = collect($lock['packages'])->firstWhere('name', $name);

        if (! is_array($package) || ! is_string($package['version'] ?? null)) {
            throw new RuntimeException("composer.lock has no version recorded for [{$name}].");
        }

        return $package['version'];
    }

    private static function installedReactVersion(): string
    {
        $package = json_decode(
            (string) file_get_contents(base_path('node_modules/@inertiajs/react/package.json')),
            true,
            flags: JSON_THROW_ON_ERROR
        );

        if (! is_array($package) || ! is_string($package['version'] ?? null)) {
            throw new RuntimeException('node_modules/@inertiajs/react/package.json has no version field.');
        }

        return $package['version'];
    }

    public function glossary(): Response
    {
        return Inertia::render('lab/glossary', ['terms' => self::TERMS]);
    }

    public function whereDidItGo(ChapterRegistry $registry): Response
    {
        // A row naming a chapter that does not exist would be a broken link on the one page
        // meant to stand on its own, so this fails loudly instead of rendering it anyway.
        $rows = array_map(function (array $row) use ($registry) {
            $chapter = $registry->find($row['chapter'])
                ?? throw new RuntimeException("The where-did-it-go page links a chapter that does not exist: [{$row['chapter']}].");

            return $row + [
                'chapterTitle' => $chapter->title,
                'chapterOrder' => $chapter->order,
            ];
        }, self::ROWS);

        return Inertia::render('lab/where-did-it-go', ['rows' => $rows]);
    }

    public function source(ChapterRegistry $registry, SourceReader $reader, string $slug): JsonResponse
    {
        $chapter = $registry->find($slug);

        abort_if($chapter === null, 404);

        return response()->json([
            'server' => $reader->read($chapter->serverFile),
            'client' => $reader->read($chapter->clientFile),
        ]);
    }

    /**
     * A single arbitrary platform file rather than a chapter's own server/client pair:
     * chapters/devtools-and-testing points at tests/Pest.php and its own test file, neither
     * of which is any chapter's serverFile or clientFile. SourceReader::read() still refuses
     * anything outside its own allowlist, so this exposes no more than source() already does.
     */
    public function sourceFile(SourceReader $reader, Request $request): JsonResponse
    {
        $path = $request->query('path');

        abort_if(! is_string($path) || $path === '', 404);

        try {
            return response()->json($reader->read($path));
        } catch (InvalidArgumentException) {
            abort(404);
        }
    }
}
