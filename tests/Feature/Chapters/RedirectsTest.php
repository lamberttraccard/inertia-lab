<?php

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);
});

it('renders the chapter with the last action read from the session', function () {
    $response = $this->get(route('chapters.redirects'));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/redirects');
    $trace = labTrace($response);

    expect($page['props']['chapter']['question'])->not->toBeEmpty()
        ->and($page['props']['lastAction'])->toBe('none')
        ->and($trace['props'])->toHaveKey('lastAction');
});

it('redirects a post back with a plain 302, since post never needs the method forced to get', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'Referer' => route('chapters.redirects'),
    ])->post(route('chapters.redirects.post'));

    // Observed rather than assumed: both Inertia\Middleware::handle() and the globally
    // pushed Inertia\Middleware\EnsureGetOnRedirect rewrite a 302 to 303 only when the
    // request method is PUT, PATCH or DELETE. POST is deliberately excluded from that list
    // in both places, so its redirect keeps Laravel's own default status.
    $response->assertStatus(302)
        ->assertRedirect(route('chapters.redirects'));

    expect(session('lab.last_action'))->toBe('post');
});

it('forces the delete redirect to the status the installed version actually uses', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'Referer' => route('chapters.redirects'),
    ])->delete(route('chapters.redirects.delete'));

    // The exact number here was observed with a throwaway route before writing this
    // assertion, not copied from memory or from the documentation: a DELETE carrying
    // X-Inertia through this stack comes back 303, not the 302 Laravel would send on its
    // own for any other verb.
    $response->assertStatus(303)
        ->assertRedirect(route('chapters.redirects'));

    expect(session('lab.last_action'))->toBe('delete');
});

it('answers Inertia::location() with 409 and the X-Inertia-Location header for a genuine visit', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get(route('chapters.redirects.location'));

    $response->assertStatus(409)
        ->assertHeader(
            'X-Inertia-Location',
            'https://inertiajs.com/docs/v3/the-basics/redirects'
        );
});

it('performs an ordinary external redirect for a plain, non-inertia visit to the same action', function () {
    $response = $this->get(route('chapters.redirects.location'));

    $response->assertRedirect('https://inertiajs.com/docs/v3/the-basics/redirects');
});
