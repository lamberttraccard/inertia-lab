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
    ])->get(route('chapters.layouts'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled. This route is the
    // one registered chapter of the three this file exercises, so it is the one that
    // must carry chapter, previous and next wrapped through Lab::value(): a controller
    // that stopped wrapping them would still pass a bare toBeEmpty() check on a nested
    // field, but not this one, the same defect class chapters 17 and 18 needed a
    // dedicated fix commit for.
    $page = assertInertiaPage($response, 'chapters/layouts');
    $trace = labTrace($response);

    expect($page['props']['chapter']['question'])->not->toBeEmpty();

    // Verified empirically against this exact route (see the debug trace taken from
    // chapters/first-load-vs-visit for the shared baseline): errors, name, auth,
    // demoUser, unreadNotifications and demoUserOptions are the platform's own shared
    // props, added to every page regardless of this chapter; chapter, previous and next
    // are the standard chapter metadata every chapter passes. This chapter adds nothing
    // of its own: the two panels below carry the props this concept actually needs.
    expect(array_keys($page['props']))->toEqualCanonicalizing([
        'errors', 'name', 'auth', 'totalChapters', 'demoUser', 'unreadNotifications', 'demoUserOptions',
        'chapter', 'previous', 'next', '_lab',
    ])
        ->and(array_keys($trace['props']))->toEqualCanonicalizing([
            'demoUser', 'unreadNotifications', 'demoUserOptions',
            'chapter', 'previous', 'next',
        ]);
});

it('renders both panel routes that share the persistent layout, each with its own prop resolved and nothing else', function () {
    $panelOne = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get(route('chapters.layouts.panel-one'));

    $panelOne->assertOk();

    $panelOnePage = assertInertiaPage($panelOne, 'chapters/layouts-panel-one');
    $panelOneTrace = labTrace($panelOne);

    expect($panelOnePage['props']['visitedAt'])->toBeString()->not->toBeEmpty();

    // Neither panel is a registered chapter (see the containment note in
    // LayoutsController): they render outside ChapterShell, so unlike the chapter route
    // above, chapter, previous and next never reach either one. visitedAt is this
    // panel's only own prop, and it is wrapped through Lab::value() like every other.
    expect(array_keys($panelOnePage['props']))->toEqualCanonicalizing([
        'errors', 'name', 'auth', 'totalChapters', 'demoUser', 'unreadNotifications', 'demoUserOptions',
        'visitedAt', '_lab',
    ])
        ->and(array_keys($panelOneTrace['props']))->toEqualCanonicalizing([
            'demoUser', 'unreadNotifications', 'demoUserOptions', 'visitedAt',
        ]);

    $panelTwo = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get(route('chapters.layouts.panel-two'));

    $panelTwo->assertOk();

    $panelTwoPage = assertInertiaPage($panelTwo, 'chapters/layouts-panel-two');
    $panelTwoTrace = labTrace($panelTwo);

    expect($panelTwoPage['props']['visitedAt'])->toBeString()->not->toBeEmpty();

    expect(array_keys($panelTwoPage['props']))->toEqualCanonicalizing([
        'errors', 'name', 'auth', 'totalChapters', 'demoUser', 'unreadNotifications', 'demoUserOptions',
        'visitedAt', '_lab',
    ])
        ->and(array_keys($panelTwoTrace['props']))->toEqualCanonicalizing([
            'demoUser', 'unreadNotifications', 'demoUserOptions', 'visitedAt',
        ]);
});
