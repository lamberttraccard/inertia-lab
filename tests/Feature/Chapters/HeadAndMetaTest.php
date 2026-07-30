<?php

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);
});

it('renders the chapter with its teaching metadata and no unexpected props', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get(route('chapters.head-and-meta'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled. The title
    // behaviour this chapter is actually about is client-side, so the registry metadata
    // reaching chapter, previous and next wrapped through Lab::value() is the whole
    // server-testable surface, the same defect class chapters 17 and 18 needed a
    // dedicated fix commit for: a controller that stopped wrapping them would still pass
    // a bare toBeEmpty() check on a nested field, but not this one.
    $page = assertInertiaPage($response, 'chapters/head-and-meta');
    $trace = labTrace($response);

    expect($page['props']['chapter']['question'])->not->toBeEmpty();

    // Verified empirically against this exact route (see the debug trace taken from
    // chapters/first-load-vs-visit for the shared baseline): errors, name, auth,
    // demoUser, unreadNotifications and demoUserOptions are the platform's own shared
    // props, added to every page regardless of this chapter; chapter, previous and next
    // are the standard chapter metadata every chapter passes. This chapter adds nothing
    // of its own: the title behaviour it teaches never touches the server.
    expect(array_keys($page['props']))->toEqualCanonicalizing([
        'errors', 'name', 'auth', 'demoUser', 'unreadNotifications', 'demoUserOptions',
        'chapter', 'previous', 'next', '_lab',
    ])
        ->and(array_keys($trace['props']))->toEqualCanonicalizing([
            'demoUser', 'unreadNotifications', 'demoUserOptions',
            'chapter', 'previous', 'next',
        ]);
});
