<?php

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);
});

it('renders the chapter with both prop kinds resolved on a full load', function () {
    $response = $this->get(route('chapters.links-and-visits'));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/links-and-visits');
    $trace = labTrace($response);

    expect($page['props']['chapter']['question'])->not->toBeEmpty()
        ->and($page['props']['items'])->toBeArray()->not->toBeEmpty()
        ->and($page['props']['serverTime'])->toBeString()
        ->and($trace['props'])->toHaveKeys(['items', 'serverTime']);
});

it('resolves only the named prop plus what Inertia always includes when only is sent', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Partial-Component' => 'chapters/links-and-visits',
        'X-Inertia-Partial-Data' => 'items',
    ])->get(route('chapters.links-and-visits'));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/links-and-visits');

    // errors is shared by the base Inertia\Middleware::share() wrapped in Inertia::always(),
    // so it survives an only filter that names neither it nor anything it lives under: this
    // is the "whatever Inertia adds unconditionally" the plan asks this test to observe
    // directly rather than assume. _lab is not Inertia's own metadata at all: InjectLabTrace
    // appends it to props after Inertia has already built the response.
    $keys = array_keys($page['props']);
    sort($keys);

    expect($keys)->toBe(['_lab', 'errors', 'items'])
        ->and($page['props']['items'])->toBeArray();

    $trace = labTrace($response);

    expect($trace['props'])->toHaveKey('items')
        ->and($trace['skipped'])->toHaveKey('serverTime')
        ->and($trace['skipped'])->toHaveKey('chapter');
});

it('omits the named prop but keeps everything else when except is sent', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Partial-Component' => 'chapters/links-and-visits',
        'X-Inertia-Partial-Except' => 'serverTime',
    ])->get(route('chapters.links-and-visits'));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/links-and-visits');

    expect($page['props'])->not->toHaveKey('serverTime')
        ->and($page['props'])->toHaveKeys(['chapter', 'previous', 'next', 'items', 'errors']);

    $trace = labTrace($response);

    expect($trace['skipped'])->toHaveKey('serverTime')
        ->and($trace['skipped']['serverTime']['reason'])->toBe('excluded by except')
        ->and($trace['props'])->toHaveKey('items');
});
