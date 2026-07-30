<?php

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);

    // Every test in this file starts from the same clean state: no chapter has bumped the
    // version yet, whatever earlier tests in the same run may have left behind.
    session()->forget('lab.asset_version_override');
});

it('renders the chapter with the live server version and no override active', function () {
    $response = $this->get(route('chapters.asset-versioning'));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/asset-versioning');
    $trace = labTrace($response);

    expect($page['props']['chapter']['question'])->not->toBeEmpty()
        ->and($page['props']['serverVersion'])->toBe(currentInertiaVersion())
        ->and($trace['props'])->toHaveKey('serverVersion');
});

it('answers a stale version with 409 and X-Inertia-Location once the override is active', function () {
    $stale = currentInertiaVersion();

    // Setting the override directly, rather than through the bump action, isolates this
    // test from how bump is implemented: this is the one thing HandleInertiaRequests::
    // version() actually reads, and the mismatch this produces is the entire lesson.
    session(['lab.asset_version_override' => 'lab-demo-override']);

    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => $stale,
    ])->get(route('chapters.asset-versioning'));

    $response->assertStatus(409)
        ->assertHeader('X-Inertia-Location', route('chapters.asset-versioning'));
});

it('does not mismatch a request that already carries the overridden version', function () {
    session(['lab.asset_version_override' => 'lab-demo-override']);

    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => 'lab-demo-override',
    ])->get(route('chapters.asset-versioning'));

    $response->assertOk();
    assertInertiaPage($response, 'chapters/asset-versioning');
});

it('bumps the version by storing an override the middleware reads, without going through Inertia', function () {
    expect(session()->has('lab.asset_version_override'))->toBeFalse();

    // No X-Inertia header: this is the plain fetch the page actually issues, not a visit,
    // since a genuine Inertia response here would update this tab's own remembered
    // version immediately and the mismatch below would never be reproducible.
    $response = $this->post(route('chapters.asset-versioning.bump'));

    $response->assertOk();
    expect($response->headers->has('X-Inertia'))->toBeFalse();

    $override = session('lab.asset_version_override');

    expect($override)->toBeString()->not->toBeEmpty()
        ->and($response->json('version'))->toBe($override);
});

it('gives a visible way back: reset clears the override entirely', function () {
    session(['lab.asset_version_override' => 'lab-demo-override']);

    $response = $this->post(route('chapters.asset-versioning.reset'));

    $response->assertOk();
    expect(session()->has('lab.asset_version_override'))->toBeFalse()
        ->and($response->json('version'))->toBe(currentInertiaVersion());
});
