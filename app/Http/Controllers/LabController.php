<?php

namespace App\Http\Controllers;

use App\Lab\Chapter;
use App\Lab\ChapterRegistry;
use App\Lab\SourceReader;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
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
            'definition' => "A signal carried in the page object that tells the client to append or combine a prop's new value with what it already holds, instead of replacing it outright.",
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
            'artefact' => 'API resource or serializer',
            'inertiaEquivalent' => 'The props array built directly in the controller, or a class implementing ProvidesInertiaProperties. Shaping the response and rendering the page happen in the same step.',
            'disappears' => false,
            'chapter' => 'mental-model',
        ],
        [
            'artefact' => 'Client-side router',
            'inertiaEquivalent' => "Inertia's own client-side router, which swaps the page component and its props on every visit without a full reload.",
            'disappears' => false,
            'chapter' => 'mental-model',
        ],
        [
            'artefact' => 'fetch or axios call',
            'inertiaEquivalent' => 'No client-side data call. The prop is already resolved by the time the component receives it, the way a function receives an argument.',
            'disappears' => true,
            'chapter' => 'mental-model',
        ],
        [
            'artefact' => 'Loading state',
            'inertiaEquivalent' => "None for a first render: the data is already there. For a deferred prop, the fallback slot of Inertia's Deferred component plays the same role for the one request that still needs it.",
            'disappears' => false,
            'chapter' => 'mental-model',
        ],
        [
            'artefact' => 'Error state',
            'inertiaEquivalent' => 'The same page component. Inertia treats an error response as a normal render: validation errors arrive as ordinary props, and a server error shows the framework error page.',
            'disappears' => false,
            'chapter' => 'mental-model',
        ],
        [
            'artefact' => 'Client cache',
            'inertiaEquivalent' => 'None in the chapters built so far: every visit asks the server again. Inertia does support a prefetch cache; a later chapter demonstrates it once it exists.',
            'disappears' => true,
            'chapter' => 'mental-model',
        ],
        [
            'artefact' => 'Cache invalidation',
            'inertiaEquivalent' => "Not needed the way a client cache needs it: a mutation's response is the server's redirect to the fresh page, so the next page already carries current data.",
            'disappears' => true,
            'chapter' => 'mental-model',
        ],
        [
            'artefact' => 'Optimistic UI',
            'inertiaEquivalent' => 'Inertia applies a local change before the server confirms it and rolls it back automatically on failure. A later chapter demonstrates the controls once it exists.',
            'disappears' => false,
            'chapter' => 'mental-model',
        ],
        [
            'artefact' => 'API contract and versioning',
            'inertiaEquivalent' => "The TypeScript type of the page's props, written or generated alongside the controller. There is no separate contract document to keep in sync, because the props array is the contract.",
            'disappears' => false,
            'chapter' => 'mental-model',
        ],
        [
            'artefact' => 'CORS',
            'inertiaEquivalent' => 'Not applicable: the page and its data are served from the same origin, in the same response. There is no cross-origin request to configure.',
            'disappears' => true,
            'chapter' => 'mental-model',
        ],
        [
            'artefact' => 'Token authentication',
            'inertiaEquivalent' => 'The session cookie the browser already sends with every request. An Inertia visit is a same-origin request, not a call to a separate API, so there is no bearer token to attach.',
            'disappears' => true,
            'chapter' => 'mental-model',
        ],
        [
            'artefact' => 'Pagination metadata',
            'inertiaEquivalent' => 'Ordinary props: a page of records plus whatever shape the controller chooses for the total, the cursor or the next link. Inertia does not standardize a paginator shape.',
            'disappears' => false,
            'chapter' => 'mental-model',
        ],
    ];

    public function home(ChapterRegistry $registry): Response
    {
        return Inertia::render('lab/home', [
            'chapters' => array_map(fn (Chapter $chapter) => $chapter->toArray(), $registry->all()),
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

    public function whereDidItGo(): Response
    {
        return Inertia::render('lab/where-did-it-go', ['rows' => self::ROWS]);
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
}
