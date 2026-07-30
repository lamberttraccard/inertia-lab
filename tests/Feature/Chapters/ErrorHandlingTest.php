<?php

use Inertia\ExceptionResponse;
use Inertia\Inertia;

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);
});

it('renders the chapter with its status prop resolved and no unexpected props', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get(route('chapters.error-handling'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled.
    $page = assertInertiaPage($response, 'chapters/error-handling');
    $trace = labTrace($response);

    expect($page['props']['chapter']['question'])->not->toBeEmpty()
        ->and($page['props']['status'])->toBeString()->not->toBeEmpty()
        ->and($trace['props'])->toHaveKey('status');

    // Same canonical-key-set rigour as FormsTest: chapter, previous and next are props
    // like any other, wrapped in Lab::value() so they reach _lab too, and this fails the
    // moment either the shared-prop list or this chapter's own props drift without the
    // test noticing.
    expect(array_keys($page['props']))->toEqualCanonicalizing([
        'errors', 'name', 'auth', 'demoUser', 'unreadNotifications', 'demoUserOptions',
        'chapter', 'previous', 'next', 'status', '_lab',
    ])
        ->and(array_keys($trace['props']))->toEqualCanonicalizing([
            'demoUser', 'unreadNotifications', 'demoUserOptions',
            'chapter', 'previous', 'next', 'status',
        ]);
});

it('answers a URL with no matching route with a rendered Inertia page carrying shared data', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get('/chapters/error-handling/nowhere');

    $response->assertStatus(404);

    $page = assertInertiaPage($response, 'chapters/error-handling-page');

    expect($page['props']['status'])->toBe(404)
        ->and($page['props']['requestPath'])->toBe('/chapters/error-handling/nowhere')
        // The trap this chapter teaches, made concrete: without ExceptionResponse::
        // withSharedData(), demoUser would be missing here, because no route matched
        // this request at all and HandleInertiaRequests never ran for it.
        ->and($page['props'])->toHaveKeys(['demoUser', 'unreadNotifications']);
});

it('answers a bad CSRF token with a rendered Inertia page carrying shared data', function () {
    // No _token here: this route runs RequireCsrfTokenMatch instead of the default
    // PreventRequestForgery (see routes/web.php), which has no runningUnitTests()
    // bypass, so this hits the real token check and fails it exactly as a browser
    // request with a corrupted XSRF-TOKEN cookie would.
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->post(route('chapters.error-handling.protected'));

    $response->assertStatus(419);

    $page = assertInertiaPage($response, 'chapters/error-handling-page');

    expect($page['props']['status'])->toBe(419)
        ->and($page['props']['message'])->toBe('CSRF token mismatch.')
        ->and($page['props'])->toHaveKeys(['demoUser', 'unreadNotifications']);
});

it('records a successful protected action and reflects it as the chapter status prop', function () {
    // A GET first, the same as every other test in this file: it starts the session that
    // csrf_token() below reads, the same one the test client's persistent cookie jar then
    // carries into the POST. Without it, csrf_token() reads a session that never gets
    // attached to the request that follows, and this fails the same as a wrong token would.
    $this->get(route('chapters.error-handling'));

    // back() resolves against the Referer header (or the session's previous-url value)
    // when one is present, and falls back to "/" otherwise: a real browser submitting
    // this from the chapter page itself always sends one, which is what this reproduces.
    // This route runs RequireCsrfTokenMatch instead of the default PreventRequestForgery
    // (see routes/web.php), which has no runningUnitTests() bypass, so this request needs
    // a genuinely valid _token, the recovery path's contrast case against the bad-token test.
    $this->withHeaders(['referer' => route('chapters.error-handling')])
        ->post(route('chapters.error-handling.protected'), ['_token' => csrf_token()])
        ->assertRedirect(route('chapters.error-handling'));

    $reload = $this->get(route('chapters.error-handling'));
    $page = assertInertiaPage($reload, 'chapters/error-handling');

    expect($page['props']['status'])->toBe('The action succeeded: this request carried a valid CSRF token.');
});

it('answers a real exception thrown from inside a matched route with a rendered Inertia page carrying shared data', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->post(route('chapters.error-handling.crash'));

    $response->assertStatus(500);

    $page = assertInertiaPage($response, 'chapters/error-handling-page');

    expect($page['props']['status'])->toBe(500)
        ->and($page['props']['message'])->toBe('Deliberate 500 for the error-handling chapter.')
        ->and($page['props'])->toHaveKeys(['demoUser', 'unreadNotifications']);
});

it('answers the non-Inertia route with a plain response and no X-Inertia header', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get(route('chapters.error-handling.plain'));

    $response->assertOk();
    expect($response->headers->has('X-Inertia'))->toBeFalse()
        ->and($response->headers->get('Content-Type'))->toContain('text/plain');
});

it('has no shared data yet when the exception handler runs for an unmatched route, unlike one thrown from inside a matched route', function () {
    $observed = [];

    // Replaces AppServiceProvider's own registration for this test only (respondUsing()
    // keeps just the last callback registered): this is the mechanism the chapter's "why
    // withSharedData() is not optional" section describes, observed directly rather than
    // assumed, the same way it was verified while writing that section.
    Inertia::handleExceptionsUsing(function (ExceptionResponse $exceptionResponse) use (&$observed) {
        $observed[$exceptionResponse->statusCode()] = Inertia::getShared();

        return null;
    });

    $this->get('/chapters/error-handling/nowhere');
    $this->post(route('chapters.error-handling.crash'));

    expect($observed[404])->toBe([])
        ->and($observed[500])->toHaveKey('demoUser');
});
