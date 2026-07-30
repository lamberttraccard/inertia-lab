<?php

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);
});

it('renders the chapter with its teaching metadata', function () {
    $response = $this->get(route('chapters.http-requests'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled.
    $page = assertInertiaPage($response, 'chapters/http-requests');

    expect($page['props']['chapter']['question'])->not->toBeEmpty();
});

it('answers the demo endpoint with plain JSON and no X-Inertia header', function () {
    $response = $this->get(route('chapters.http-requests.ping'));

    $response->assertOk();
    $response->assertHeaderMissing('X-Inertia');

    expect($response->headers->get('Content-Type'))->toContain('application/json')
        ->and($response->json('message'))->not->toBeEmpty()
        ->and($response->json('servedAt'))->not->toBeEmpty();
});
