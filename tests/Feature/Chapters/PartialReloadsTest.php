<?php

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);
});

it('renders the chapter with posts, tags and stats all resolved on a full load', function () {
    $response = $this->get(route('chapters.partial-reloads'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled.
    $page = assertInertiaPage($response, 'chapters/partial-reloads');
    $trace = labTrace($response);

    expect($page['props']['posts'])->toBeArray()
        ->and($page['props']['tags'])->toBeArray()
        ->and($page['props']['stats'])->toHaveKeys(['posts', 'comments', 'likes'])
        ->and($trace['props'])->toHaveKeys(['posts', 'tags', 'stats']);
});

it('resolves only posts and skips tags and stats with the not-requested reason on an only reload', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Partial-Component' => 'chapters/partial-reloads',
        'X-Inertia-Partial-Data' => 'posts',
    ])->get(route('chapters.partial-reloads'));

    $response->assertOk();
    $page = assertInertiaPage($response, 'chapters/partial-reloads');
    $trace = labTrace($response);

    expect($page['props'])->toHaveKey('posts')
        ->and($page['props'])->not->toHaveKey('tags')
        ->and($page['props'])->not->toHaveKey('stats')
        ->and($trace['props'])->toHaveKey('posts')
        ->and($trace['skipped']['tags']['reason'])->toBe('not requested by only')
        ->and($trace['skipped']['stats']['reason'])->toBe('not requested by only');
});

it('skips only stats with the excluded reason on an except reload, keeping posts and tags', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Partial-Component' => 'chapters/partial-reloads',
        'X-Inertia-Partial-Except' => 'stats',
    ])->get(route('chapters.partial-reloads'));

    $response->assertOk();
    $page = assertInertiaPage($response, 'chapters/partial-reloads');
    $trace = labTrace($response);

    expect($page['props'])->toHaveKeys(['posts', 'tags'])
        ->and($page['props'])->not->toHaveKey('stats')
        ->and($trace['props'])->toHaveKeys(['posts', 'tags'])
        ->and($trace['skipped']['stats']['reason'])->toBe('excluded by except');
});

it('sends a smaller payload for a partial reload asking only for posts than for a full load', function () {
    $full = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get(route('chapters.partial-reloads'));

    $partial = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Partial-Component' => 'chapters/partial-reloads',
        'X-Inertia-Partial-Data' => 'posts',
    ])->get(route('chapters.partial-reloads'));

    $full->assertOk();
    $partial->assertOk();

    $fullBytes = strlen((string) $full->getContent());
    $partialBytes = strlen((string) $partial->getContent());

    expect($partialBytes)->toBeLessThan($fullBytes);
});
