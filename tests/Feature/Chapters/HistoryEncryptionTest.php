<?php

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);
});

it('renders the chapter with encryption on and its teaching metadata', function () {
    $response = $this->get(route('chapters.history-encryption'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled.
    $page = assertInertiaPage($response, 'chapters/history-encryption');
    $trace = labTrace($response);

    // Response::resolveEncryptHistory()/resolveClearHistory() only add their key at all
    // when true (see vendor/inertiajs/inertia-laravel/src/Response.php), so the page
    // object never carries encryptHistory: false or clearHistory: false; the key is
    // simply absent instead.
    expect($page['props']['chapter']['question'])->not->toBeEmpty()
        ->and($page['encryptHistory'])->toBeTrue()
        ->and($page)->not->toHaveKey('clearHistory')
        ->and($trace['props'])->toHaveKey('renderedAt');
});

it('clears history on the very next render, then stays quiet again', function () {
    $clear = $this->post(route('chapters.history-encryption.clear'));

    $clear->assertRedirect(route('chapters.history-encryption'));

    // Response::__construct() pulls the clear-history session flag the moment the next
    // Inertia::render() builds a response, whichever route that happens to be: following
    // the redirect here is what that "next visit" the ResponseFactory docblock describes
    // actually looks like.
    $afterClear = $this->get(route('chapters.history-encryption'));
    $afterClearPage = assertInertiaPage($afterClear, 'chapters/history-encryption');

    expect($afterClearPage['clearHistory'])->toBeTrue()
        ->and($afterClearPage['encryptHistory'])->toBeTrue();

    $again = $this->get(route('chapters.history-encryption'));
    $againPage = assertInertiaPage($again, 'chapters/history-encryption');

    expect($againPage)->not->toHaveKey('clearHistory')
        ->and($againPage['encryptHistory'])->toBeTrue();
});
