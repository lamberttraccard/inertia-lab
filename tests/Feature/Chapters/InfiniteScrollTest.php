<?php

use Database\Seeders\LabSeeder;

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);

    // 120 posts at 12 per page gives exactly 10 pages, so a deep link into the middle
    // has real neighbours on both sides to page toward.
    $this->seed(LabSeeder::class);
});

it('renders the feed with scroll metadata for the first page on a full load', function () {
    $response = $this->get(route('chapters.infinite-scroll'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled.
    $page = assertInertiaPage($response, 'chapters/infinite-scroll');
    $trace = labTrace($response);

    expect($page['props']['posts']['data'])->toHaveCount(12)
        ->and($page['props']['posts']['current_page'])->toBe(1)
        ->and($page['scrollProps']['posts'])->toBe([
            'pageName' => 'page',
            'previousPage' => null,
            'nextPage' => 2,
            'currentPage' => 1,
            'reset' => false,
        ])
        ->and($trace['props'])->toHaveKey('posts');
});

it('resolves scroll metadata for both neighbours when a deep link opens a middle page', function () {
    $response = $this->get(route('chapters.infinite-scroll', ['page' => 5]));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/infinite-scroll');

    expect($page['scrollProps']['posts'])->toBe([
        'pageName' => 'page',
        'previousPage' => 4,
        'nextPage' => 6,
        'currentPage' => 5,
        'reset' => false,
    ]);
});

it('appends the next page and lists it under mergeProps when the merge intent is append', function () {
    $firstIds = array_column(inertiaPage($this->get(route('chapters.infinite-scroll')))['props']['posts']['data'], 'id');

    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Partial-Component' => 'chapters/infinite-scroll',
        'X-Inertia-Partial-Data' => 'posts',
        'X-Inertia-Infinite-Scroll-Merge-Intent' => 'append',
    ])->get(route('chapters.infinite-scroll', ['page' => 2]));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/infinite-scroll');
    $secondIds = array_column($page['props']['posts']['data'], 'id');

    expect($page['props']['posts']['current_page'])->toBe(2)
        ->and(array_intersect($firstIds, $secondIds))->toBeEmpty()
        ->and($page['mergeProps'])->toContain('posts.data')
        ->and($page['prependProps'] ?? [])->not->toContain('posts.data');
});

it('lists the previous page under prependProps when the merge intent is prepend', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Partial-Component' => 'chapters/infinite-scroll',
        'X-Inertia-Partial-Data' => 'posts',
        'X-Inertia-Infinite-Scroll-Merge-Intent' => 'prepend',
    ])->get(route('chapters.infinite-scroll', ['page' => 4]));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/infinite-scroll');

    expect($page['props']['posts']['current_page'])->toBe(4)
        ->and($page['prependProps'])->toContain('posts.data')
        ->and($page['mergeProps'] ?? [])->not->toContain('posts.data');
});
