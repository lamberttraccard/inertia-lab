<?php

use Database\Seeders\LabSeeder;

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);

    $this->seed(LabSeeder::class);
});

it('sends tags on the first response and lists it under onceProps', function () {
    $response = $this->get(route('chapters.once-props'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled.
    $page = assertInertiaPage($response, 'chapters/once-props');
    $trace = labTrace($response);

    expect($page['props']['chapter']['question'])->not->toBeEmpty()
        ->and($page['props']['tags'])->toHaveCount(15)
        ->and($page['onceProps']['tags'])->toBe(['prop' => 'tags', 'expiresAt' => null])
        ->and($trace['props'])->toHaveKeys(['tags', 'visitedAt']);
});

it('skips tags with the already-held reason on a bare reload that names no partial props', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Except-Once-Props' => 'tags',
    ])->get(route('chapters.once-props'));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/once-props');
    $trace = labTrace($response);

    expect($page['props'])->not->toHaveKey('tags')
        ->and($page['props'])->toHaveKey('visitedAt')
        // onceProps still names tags on this very response: the client needs to keep
        // tracking what it holds and when it expires even on a request that skips it.
        ->and($page['onceProps']['tags'])->toBe(['prop' => 'tags', 'expiresAt' => null])
        ->and($trace['skipped']['tags']['reason'])->toBe('once prop already held by the client');
});

it('resolves tags again once a partial reload names it explicitly, even with the except-once header present', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Partial-Component' => 'chapters/once-props',
        'X-Inertia-Partial-Data' => 'tags,visitedAt',
        'X-Inertia-Except-Once-Props' => 'tags',
    ])->get(route('chapters.once-props'));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/once-props');
    $trace = labTrace($response);

    expect($page['props']['tags'])->toHaveCount(15)
        ->and($page['onceProps']['tags'])->toBe(['prop' => 'tags', 'expiresAt' => null])
        ->and($trace['props'])->toHaveKey('tags');
});
