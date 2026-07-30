<?php

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);
});

it('renders the chapter with its note prop resolved', function () {
    $response = $this->get(route('chapters.events'));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/events');
    $trace = labTrace($response);

    expect($page['props']['chapter']['question'])->not->toBeEmpty()
        ->and($page['props']['note'])->toBeString()->not->toBeEmpty()
        ->and($trace['props'])->toHaveKey('note');
});

it('answers the deliberate 422 with no X-Inertia header, since the abort bypasses Inertia entirely', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->post(route('chapters.events.unprocessable'));

    // Observed rather than assumed: abort() throws before Inertia\Middleware::handle()
    // resumes past $next($request), the same reason chapter 2's broken action produces a
    // response with no X-Inertia header. The client's Response.isInertiaResponse() check
    // reads that header, not the status, so this is what makes the client treat a 422 the
    // same way it treats a plain non-Inertia route: as an httpException, not as validation
    // errors on the errors prop.
    $response->assertStatus(422);
    expect($response->headers->has('X-Inertia'))->toBeFalse();
});

it('answers the deliberate 500 with no X-Inertia header, for the same reason as the 422', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->post(route('chapters.events.server-error'));

    $response->assertStatus(500);
    expect($response->headers->has('X-Inertia'))->toBeFalse();
});

it('answers the non-Inertia route with a plain response and no X-Inertia header', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get(route('chapters.events.non-inertia'));

    $response->assertOk();
    expect($response->headers->has('X-Inertia'))->toBeFalse()
        ->and($response->headers->get('Content-Type'))->toContain('text/plain');
});
