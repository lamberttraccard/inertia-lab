<?php

use App\Models\Post;

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);
});

it('renders the chapter with one example of every prop kind the taxonomy names', function () {
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
        ->and($page['props']['post'])->toBeArray()
        ->and($page['props']['post'])->toHaveKeys(['id', 'title', 'excerpt', 'views'])
        // A small class implementing ProvidesInertiaProperty: one prop, self-describing output.
        ->and($page['props']['recency'])->toHaveKeys(['label', 'resolvedAsProp'])
        ->and($page['props']['recency']['resolvedAsProp'])->toBe('recency')
        // A class implementing ProvidesInertiaProperties: contributes more than one top-level key.
        ->and($page['props']['excerptLength'])->toBeInt()
        ->and($page['props']['hasCoverImage'])->toBeBool()
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
