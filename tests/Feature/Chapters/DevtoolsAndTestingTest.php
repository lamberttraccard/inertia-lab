<?php

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);
});

it('renders the chapter with the live devtoolsEnabled prop resolved', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get(route('chapters.devtools-and-testing'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: it is what the next test in this
    // file demonstrates failing on this exact response, which is the reason
    // inertiaPage() and assertInertiaPage() exist in tests/Pest.php in the first place.
    $page = assertInertiaPage($response, 'chapters/devtools-and-testing');
    $trace = labTrace($response);

    expect($page['props']['chapter']['question'])->not->toBeEmpty()
        ->and($page['props']['devtoolsEnabled'])->toBeTrue()
        ->and($trace['props'])->toHaveKey('devtoolsEnabled');

    // Same canonical-key-set rigour as FormsTest: chapter, previous and next are props
    // like any other, wrapped in Lab::value() so they reach _lab too, and this fails the
    // moment either the shared-prop list or this chapter's own props drift without the
    // test noticing.
    expect(array_keys($page['props']))->toEqualCanonicalizing([
        'errors', 'name', 'auth', 'totalChapters', 'demoUser', 'unreadNotifications', 'demoUserOptions',
        'chapter', 'previous', 'next', 'devtoolsEnabled', '_lab',
    ])
        ->and(array_keys($trace['props']))->toEqualCanonicalizing([
            'demoUser', 'unreadNotifications', 'demoUserOptions',
            'chapter', 'previous', 'next', 'devtoolsEnabled',
        ]);
});

it('demonstrates assertInertia() failing on a full document load once devtools has rewritten the response', function () {
    $response = $this->get(route('chapters.devtools-and-testing'));

    $response->assertOk();

    $failure = null;

    try {
        $response->assertInertia(fn ($page) => $page->component('chapters/devtools-and-testing'));
    } catch (Throwable $exception) {
        $failure = $exception;
    }

    // Confirmed empirically, not assumed: AssertableInertia::fromTestResponse() calls
    // assertViewHas('page') first, which fails once Inertia\DevTools\RequestRecorder::
    // injectDevToolsIdTag()'s own setContent() call has overwritten Response::$original
    // back to a plain string, for the reason InjectLabTrace's own docblock in
    // app/Http/Middleware/InjectLabTrace.php explains for its own (self-healing) call to
    // the same method.
    expect($failure)->not->toBeNull();
});

it('confirms assertInertia() would have worked on this same route with devtools off, isolating devtools as the cause', function () {
    config()->set('inertia.devtools.enabled', false);

    $response = $this->get(route('chapters.devtools-and-testing'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('chapters/devtools-and-testing'));
});
