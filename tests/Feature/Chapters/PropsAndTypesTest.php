<?php

use App\Models\Post;
use App\Models\User;

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);
});

it('renders the chapter with one example of every prop kind the taxonomy names', function () {
    // A real, persisted row here, distinct from the id 0 the fallback in
    // PropsAndTypesController::demoPost() uses: without this, every test in this file would
    // exercise only the empty-table fallback branch, never the real Eloquent row it exists
    // alongside.
    $author = User::factory()->create();
    Post::create([
        'user_id' => $author->id,
        'title' => 'A real seeded post',
        'slug' => 'a-real-seeded-post',
        'excerpt' => 'A real excerpt for the seeded post this test exercises.',
        'body' => str_repeat('Real seeded body content for the word count check. ', 30),
        'cover_path' => 'covers/example.jpg',
        'published_at' => now(),
        'views' => 4242,
    ]);

    $response = $this->get(route('chapters.props-and-types'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled.
    $page = assertInertiaPage($response, 'chapters/props-and-types');
    $trace = labTrace($response);

    expect($page['props']['chapter']['question'])->not->toBeEmpty()
        // A scalar.
        ->and($page['props']['views'])->toBeInt()
        // An array.
        ->and($page['props']['tags'])->toBeArray()->not->toBeEmpty()
        // A closure, resolved eagerly on a full load.
        ->and($page['props']['renderedAt'])->toBeString()
        // A backed enum: serialised to its bare scalar backing value, never an object.
        ->and($page['props']['status'])->toBeIn(['draft', 'published'])
        // An Eloquent model: serialised through Arrayable::toArray(), not a resource class.
        // id not 0 and the title matching what was seeded above confirms this is the real
        // query branch of demoPost(), not its unsaved fallback.
        ->and($page['props']['post'])->toBeArray()
        ->and($page['props']['post'])->toHaveKeys(['id', 'title', 'excerpt', 'views'])
        ->and($page['props']['post']['id'])->not->toBe(0)
        ->and($page['props']['post']['title'])->toBe('A real seeded post')
        // A class implementing ProvidesInertiaProperties: contributes more than one top-level
        // key. hasCoverImage true here, against false in the empty-table test below, covers
        // both branches PostFacts can report.
        ->and($page['props']['excerptLength'])->toBeInt()
        ->and($page['props']['hasCoverImage'])->toBeTrue()
        // A small class implementing ProvidesInertiaProperty: one prop, self-describing output.
        ->and($page['props']['recency'])->toHaveKeys(['label', 'resolvedAsProp'])
        ->and($page['props']['recency']['resolvedAsProp'])->toBe('recency')
        // A nested array reached by dot notation.
        ->and($page['props']['meta'])->toHaveKeys(['wordCount', 'readingMinutes'])
        ->and($page['props']['meta']['wordCount'])->toBeInt()
        ->and($page['props']['meta']['readingMinutes'])->toBeInt();

    expect($trace['props'])->toHaveKeys([
        'views', 'tags', 'renderedAt', 'status', 'post', 'recency',
        'excerptLength', 'hasCoverImage', 'meta.wordCount', 'meta.readingMinutes',
    ]);
});

it('resolves only the nested key named by dot path on a partial reload, and skips the rest', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Partial-Component' => 'chapters/props-and-types',
        'X-Inertia-Partial-Data' => 'meta.readingMinutes',
    ])->get(route('chapters.props-and-types'));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/props-and-types');
    $trace = labTrace($response);

    expect($page['props']['meta']['readingMinutes'])->toBeInt()
        ->and($page['props']['meta'])->not->toHaveKey('wordCount')
        ->and($page['props'])->not->toHaveKey('post')
        ->and($page['props'])->not->toHaveKey('status')
        ->and($page['props'])->not->toHaveKey('excerptLength');

    expect($trace['props'])->toHaveKey('meta.readingMinutes')
        ->and($trace['skipped'])->toHaveKeys([
            'meta.wordCount', 'post', 'status', 'views', 'tags', 'renderedAt',
            'recency', 'excerptLength', 'hasCoverImage',
        ])
        ->and($trace['skipped']['meta.wordCount']['reason'])->toBe('not requested by only');
});

it('falls back to a self-contained example post when the posts table is empty', function () {
    expect(Post::count())->toBe(0);

    $response = $this->get(route('chapters.props-and-types'));

    $response->assertOk();
    $page = assertInertiaPage($response, 'chapters/props-and-types');

    expect($page['props']['post']['title'])->not->toBeEmpty()
        ->and($page['props']['views'])->toBeInt();
});
