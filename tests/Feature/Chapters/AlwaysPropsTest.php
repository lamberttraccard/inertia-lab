<?php

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);

    // Every test starts from the same clean state: no earlier test in the same run should
    // be able to leave a flashed message behind for this one to accidentally observe.
    session()->forget('lab.always_props_flash');
});

it('resolves the normal prop, the always prop and the flash-backed prop on a full load', function () {
    $response = $this->get(route('chapters.always-props'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled.
    $page = assertInertiaPage($response, 'chapters/always-props');
    $trace = labTrace($response);

    expect($page['props'])->toHaveKeys(['normal', 'notice', 'status'])
        ->and($page['props']['status'])->toBe('No flash message sent yet. Use the button below.')
        ->and($trace['props'])->toHaveKeys(['normal', 'notice', 'status']);
});

it('keeps the always prop and the flash-backed prop when a partial reload names only the normal prop', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Partial-Component' => 'chapters/always-props',
        'X-Inertia-Partial-Data' => 'normal',
    ])->get(route('chapters.always-props'));

    $response->assertOk();

    // errors is Inertia's own shared prop, wrapped in Inertia::always() by the framework's
    // base middleware, so it survives an only filter that names neither it nor anything it
    // lives under: this is "why did three arrive" observed directly rather than assumed.
    $page = assertInertiaPage($response, 'chapters/always-props');
    $trace = labTrace($response);

    expect($page['props'])->toHaveKeys(['normal', 'notice', 'status', 'errors'])
        ->and($trace['props'])->toHaveKeys(['normal', 'notice', 'status']);
});

it('skips the normal prop with the excluded reason while the always prop survives an except reload', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Partial-Component' => 'chapters/always-props',
        'X-Inertia-Partial-Except' => 'normal',
    ])->get(route('chapters.always-props'));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/always-props');
    $trace = labTrace($response);

    expect($page['props'])->not->toHaveKey('normal')
        ->and($page['props'])->toHaveKeys(['notice', 'status'])
        ->and($trace['skipped']['normal']['reason'])->toBe('excluded by except');
});

it('flashes a message that survives the very next request even when only names a different prop, then ages out on the request after that', function () {
    $this->post(route('chapters.always-props.flash'))->assertRedirect();

    $afterFlash = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Partial-Component' => 'chapters/always-props',
        'X-Inertia-Partial-Data' => 'normal',
    ])->get(route('chapters.always-props'));

    $afterFlash->assertOk();
    $page = assertInertiaPage($afterFlash, 'chapters/always-props');

    expect($page['props']['status'])->toStartWith('Flashed at');

    $again = $this->get(route('chapters.always-props'));

    $again->assertOk();
    $pageAgain = assertInertiaPage($again, 'chapters/always-props');

    expect($pageAgain['props']['status'])->toBe('No flash message sent yet. Use the button below.');
});
