<?php

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);
});

it('renders the chapter with encryption on, its teaching metadata and no unexpected props', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get(route('chapters.history-encryption'));

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

    // Verified empirically against this exact route (see the debug trace taken from
    // chapters/first-load-vs-visit for the shared baseline): errors, name, auth,
    // demoUser, unreadNotifications and demoUserOptions are the platform's own shared
    // props, added to every page regardless of this chapter; chapter, previous and next
    // are the standard chapter metadata every chapter passes, wrapped through
    // Lab::value() like renderedAt, this chapter's own prop. A controller that stopped
    // wrapping chapter, previous or next would still pass a bare toBeEmpty() check on a
    // nested field, but not this one, the same defect class chapters 17 and 18 needed a
    // dedicated fix commit for. encryptHistory and clearHistory are top-level Page
    // fields, not props, so they are asserted separately above rather than listed here.
    expect(array_keys($page['props']))->toEqualCanonicalizing([
        'errors', 'name', 'auth', 'totalChapters', 'demoUser', 'unreadNotifications', 'demoUserOptions',
        'chapter', 'previous', 'next', 'renderedAt', '_lab',
    ])
        ->and(array_keys($trace['props']))->toEqualCanonicalizing([
            'demoUser', 'unreadNotifications', 'demoUserOptions',
            'chapter', 'previous', 'next', 'renderedAt',
        ]);
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
