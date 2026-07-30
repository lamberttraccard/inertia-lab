<?php

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);
});

it('resolves the cheap value and the bare closure but skips the optional prop on a full load', function () {
    $response = $this->get(route('chapters.optional-props'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled.
    $page = assertInertiaPage($response, 'chapters/optional-props');
    $trace = labTrace($response);

    expect($page['props'])->toHaveKeys(['cheap', 'eagerStats'])
        ->and($page['props'])->not->toHaveKey('expensive')
        ->and($page['props']['eagerStats'])->toHaveKeys(['posts', 'comments', 'likes'])
        ->and($trace['props'])->toHaveKeys(['cheap', 'eagerStats'])
        ->and($trace['skipped']['expensive']['reason'])->toBe('optional and not requested');
});

it('resolves the optional prop once a partial reload names it, and skips the closure and the value for a different reason', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Partial-Component' => 'chapters/optional-props',
        'X-Inertia-Partial-Data' => 'expensive',
    ])->get(route('chapters.optional-props'));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/optional-props');
    $trace = labTrace($response);

    expect($page['props'])->toHaveKey('expensive')
        ->and($page['props']['expensive'])->toHaveKeys(['posts', 'comments', 'likes'])
        ->and($page['props'])->not->toHaveKey('eagerStats')
        ->and($page['props'])->not->toHaveKey('cheap')
        ->and($trace['props'])->toHaveKey('expensive')
        ->and($trace['skipped']['eagerStats']['reason'])->toBe('not requested by only')
        ->and($trace['skipped']['cheap']['reason'])->toBe('not requested by only');
});
