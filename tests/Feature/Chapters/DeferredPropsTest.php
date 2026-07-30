<?php

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);
});

it('sends the page immediately with summary resolved and every deferred or optional prop skipped on a full load', function () {
    $response = $this->get(route('chapters.deferred-props'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled.
    $page = assertInertiaPage($response, 'chapters/deferred-props');
    $trace = labTrace($response);

    expect($page['props'])->toHaveKey('summary')
        ->and($page['props'])->not->toHaveKeys([
            'postStats', 'commentStats', 'tagCloud', 'riskyInsight', 'belowTheFold',
        ])
        ->and($page['deferredProps']['stats'])->toBe(['postStats', 'commentStats'])
        ->and($page['deferredProps']['sidebar'])->toBe(['tagCloud'])
        ->and($page['deferredProps']['insights'])->toBe(['riskyInsight'])
        ->and($trace['skipped']['postStats']['reason'])->toBe('deferred to a follow-up request')
        ->and($trace['skipped']['commentStats']['reason'])->toBe('deferred to a follow-up request')
        ->and($trace['skipped']['tagCloud']['reason'])->toBe('deferred to a follow-up request')
        ->and($trace['skipped']['riskyInsight']['reason'])->toBe('deferred to a follow-up request')
        ->and($trace['skipped']['belowTheFold']['reason'])->toBe('optional and not requested');
});

it('resolves both props in the stats group from a single follow-up request naming them together', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Partial-Component' => 'chapters/deferred-props',
        'X-Inertia-Partial-Data' => 'postStats,commentStats',
    ])->get(route('chapters.deferred-props'));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/deferred-props');
    $trace = labTrace($response);

    expect($page['props'])->toHaveKeys(['postStats', 'commentStats'])
        ->and($page['props']['postStats'])->toHaveKeys(['total', 'published'])
        ->and($page['props']['commentStats'])->toHaveKey('total')
        ->and($page['props'])->not->toHaveKey('tagCloud')
        ->and($trace['props'])->toHaveKeys(['postStats', 'commentStats'])
        ->and($trace['skipped']['tagCloud']['reason'])->toBe('not requested by only');
});

it('resolves tagCloud from its own group in a request that does not carry the stats group', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Partial-Component' => 'chapters/deferred-props',
        'X-Inertia-Partial-Data' => 'tagCloud',
    ])->get(route('chapters.deferred-props'));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/deferred-props');
    $trace = labTrace($response);

    expect($page['props'])->toHaveKey('tagCloud')
        ->and($page['props']['tagCloud'])->toBeArray()
        ->and($page['props'])->not->toHaveKeys(['postStats', 'commentStats'])
        ->and($trace['skipped']['postStats']['reason'])->toBe('not requested by only')
        ->and($trace['skipped']['commentStats']['reason'])->toBe('not requested by only');
});

it('reports the deferred reason on the first load and only the rescued reason once the insights group is actually requested', function () {
    $first = $this->get(route('chapters.deferred-props'));
    $firstTrace = labTrace($first);

    expect($firstTrace['skipped']['riskyInsight']['reason'])->toBe('deferred to a follow-up request');

    $followUp = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Partial-Component' => 'chapters/deferred-props',
        'X-Inertia-Partial-Data' => 'riskyInsight',
    ])->get(route('chapters.deferred-props'));

    $followUp->assertOk();

    $page = assertInertiaPage($followUp, 'chapters/deferred-props');
    $trace = labTrace($followUp);

    expect($page['props'])->not->toHaveKey('riskyInsight')
        ->and($page['rescuedProps'])->toBe(['riskyInsight'])
        ->and($trace['skipped']['riskyInsight']['reason'])->toBe('resolution threw and was rescued');
});

it('resolves the optional belowTheFold prop only when a partial reload names it', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Partial-Component' => 'chapters/deferred-props',
        'X-Inertia-Partial-Data' => 'belowTheFold',
    ])->get(route('chapters.deferred-props'));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/deferred-props');
    $trace = labTrace($response);

    expect($page['props'])->toHaveKey('belowTheFold')
        ->and($trace['props'])->toHaveKey('belowTheFold');
});
