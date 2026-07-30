<?php

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);
});

it('renders the chapter with its teaching metadata', function () {
    $response = $this->get(route('chapters.head-and-meta'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled. The title
    // behaviour this chapter is actually about is client-side, so this is the whole
    // server-testable surface: the route renders, with its own teaching metadata.
    $page = assertInertiaPage($response, 'chapters/head-and-meta');

    expect($page['props']['chapter']['question'])->not->toBeEmpty();
});
