<?php

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);
});

it('renders the chapter with its teaching metadata', function () {
    $response = $this->get(route('chapters.prefetching'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled.
    $page = assertInertiaPage($response, 'chapters/prefetching');

    expect($page['props']['chapter']['question'])->not->toBeEmpty();
});

it('renders the destination page normally, with its own prop resolved', function () {
    $response = $this->get(route('chapters.prefetching.destination'));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/prefetching-destination');
    $trace = labTrace($response);

    expect($page['props']['reachedAt'])->toBeString()->not->toBeEmpty()
        ->and($trace['props'])->toHaveKey('reachedAt');
});

it('answers a request carrying the Purpose: prefetch header the same way as a normal visit', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'Purpose' => 'prefetch',
    ])->get(route('chapters.prefetching.destination'));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/prefetching-destination');

    expect($page['props']['reachedAt'])->toBeString()->not->toBeEmpty();
});
