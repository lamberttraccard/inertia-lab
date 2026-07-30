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
    ])->get(route('chapters.http-requests'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled. The concept this
    // chapter teaches is entirely client-side (see the ping test below for the one thing
    // that is server-testable), so the registry metadata reaching chapter, previous and
    // next wrapped through Lab::value() is the whole point of this assertion: a
    // controller that stopped wrapping them would still pass a bare toBeEmpty() check on
    // a nested field, but not this one, the same defect class chapters 17 and 18 needed
    // a dedicated fix commit for.
    $page = assertInertiaPage($response, 'chapters/http-requests');
    $trace = labTrace($response);

    expect($page['props']['chapter']['question'])->not->toBeEmpty();

    // Verified empirically against this exact route (see the debug trace taken from
    // chapters/first-load-vs-visit for the shared baseline): errors, name, auth,
    // demoUser, unreadNotifications and demoUserOptions are the platform's own shared
    // props, added to every page regardless of this chapter; chapter, previous and next
    // are the standard chapter metadata every chapter passes. This chapter adds nothing
    // of its own: useHttp talks to the ping endpoint below, never to this route again.
    expect(array_keys($page['props']))->toEqualCanonicalizing([
        'errors', 'name', 'auth', 'demoUser', 'unreadNotifications', 'demoUserOptions',
        'chapter', 'previous', 'next', '_lab',
    ])
        ->and(array_keys($trace['props']))->toEqualCanonicalizing([
            'demoUser', 'unreadNotifications', 'demoUserOptions',
            'chapter', 'previous', 'next',
        ]);
});

it('answers the demo endpoint with plain JSON and no X-Inertia header', function () {
    $response = $this->get(route('chapters.http-requests.ping'));

    $response->assertOk();
    $response->assertHeaderMissing('X-Inertia');

    expect($response->headers->get('Content-Type'))->toContain('application/json')
        ->and($response->json('message'))->not->toBeEmpty()
        ->and($response->json('servedAt'))->not->toBeEmpty();
});
