<?php

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);
});

it('renders the chapter with real build metadata for its own page chunk', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get(route('chapters.typescript-and-splitting'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled.
    $page = assertInertiaPage($response, 'chapters/typescript-and-splitting');
    $trace = labTrace($response);

    expect($page['props']['chapter']['question'])->not->toBeEmpty()
        ->and($page['props']['buildInfo']['available'])->toBeTrue()
        // Confirmed by reading node_modules/@inertiajs/vite/dist/index.js: the default
        // resolver this application's app.tsx gets (it declares neither pages nor resolve)
        // calls import.meta.glob with eager left at its own default of false, which is what
        // makes every page component, this one included, its own dynamically-fetched chunk.
        ->and($page['props']['buildInfo']['isDynamicEntry'])->toBeTrue()
        ->and($page['props']['buildInfo']['bytes'])->toBeInt()->toBeGreaterThan(0)
        ->and($page['props']['buildInfo']['importsCount'])->toBeInt()
        ->and($trace['props'])->toHaveKey('buildInfo');

    // Same canonical-key-set rigour as FormsTest: chapter, previous and next are props
    // like any other, wrapped in Lab::value() so they reach _lab too, and this fails the
    // moment either the shared-prop list or this chapter's own props drift without the
    // test noticing.
    expect(array_keys($page['props']))->toEqualCanonicalizing([
        'errors', 'name', 'auth', 'totalChapters', 'demoUser', 'unreadNotifications', 'demoUserOptions',
        'chapter', 'previous', 'next', 'buildInfo', '_lab',
    ])
        ->and(array_keys($trace['props']))->toEqualCanonicalizing([
            'demoUser', 'unreadNotifications', 'demoUserOptions',
            'chapter', 'previous', 'next', 'buildInfo',
        ]);
});
