<?php

use Inertia\ComponentNotFoundException;

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);
});

it('renders the chapter with the component name and pages root as live props', function () {
    $response = $this->get(route('chapters.render-and-components'));

    $response->assertOk();

    $page = inertiaPage($response);
    $trace = labTrace($response);

    expect($page['component'])->toBe('chapters/render-and-components')
        ->and($page['props']['chapter']['question'])->not->toBeEmpty()
        ->and($page['props']['resolvedComponent'])->toBe('chapters/render-and-components')
        ->and($page['props']['pagesRoot'])->toBe('resources/js/pages')
        ->and($trace['props'])->toHaveKeys(['resolvedComponent', 'pagesRoot']);
});

it('throws the real ComponentNotFoundException once ensure_pages_exist is forced on', function () {
    // This app's own config/inertia.php overrides the package's 'pages' array without
    // repeating ensure_pages_exist, so the merged config leaves it at the package default of
    // false and Inertia::render() never calls findComponentOrFail() by default. The broken
    // action forces the flag on for its own request, which is what actually makes the check
    // run; withoutExceptionHandling() lets the real exception surface here instead of being
    // converted into a response, so this is the exception observed, not one assumed by name.
    $this->withoutExceptionHandling();

    expect(fn () => $this->get(route('chapters.render-and-components.broken')))
        ->toThrow(ComponentNotFoundException::class);
});

it('surfaces that failure as the server error a real visitor would see', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get(route('chapters.render-and-components.broken'));

    // Observed rather than assumed: the exception is thrown synchronously inside
    // Inertia::render(), before Inertia\Middleware::handle() resumes past $next($request), so
    // it skips that middleware's own post-processing and is caught by Laravel's ordinary
    // exception handling instead, which renders the framework's standard error response.
    $response->assertStatus(500);
});
