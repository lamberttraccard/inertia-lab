<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function something()
{
    // ..
}

/**
 * The asset version Inertia's own middleware would compute right now. A built
 * public/build/manifest.json changes this from '', so simulated Inertia requests
 * must send the real value instead of a hardcoded '' or they trip the built-in
 * version-mismatch redirect (409) as soon as the frontend has been built once.
 */
function currentInertiaVersion(): string
{
    return (string) app(HandleInertiaRequests::class)->version(Request::create('/'));
}

/**
 * The decoded page object of an Inertia response, read the same way a browser reads it
 * rather than through assertInertia(). assertInertia() reads TestResponse::viewData('page'),
 * which needs Response::original to still hold the view Inertia rendered. With the official
 * DevTools recorder enabled, Inertia\Middleware::handle() calls respondedWith() for this
 * response after InjectLabTrace has already run and restored $response->original, and that
 * call injects its own devtools id tag through a second setContent(), clobbering original
 * back to a plain string. A JSON response fails assertInertia() for a different reason:
 * Inertia\Response::toResponse() returns a bare JsonResponse and never touches a view at all.
 * So both cases are read from the response body itself: the script tag for a full document
 * load, the JSON body directly for an Inertia visit.
 */
function inertiaPage(TestResponse $response): array
{
    if ($response->headers->get('Content-Type') === 'application/json') {
        return $response->json();
    }

    $content = (string) $response->getContent();
    $marker = '<script data-page="app" type="application/json">';

    if (! str_contains($content, $marker)) {
        throw new RuntimeException(
            "No {$marker} tag found in the response. This was not a full Inertia HTML document."
        );
    }

    $json = Str::betweenFirst($content, $marker, '</script>');

    return json_decode($json, true, 512, JSON_THROW_ON_ERROR);
}

/**
 * The lab's own prop resolution trace for an Inertia response: which props resolved, which
 * were skipped and why. Read from props._lab on a JSON response, or from the lab-trace
 * script tag InjectLabTrace appends to a full document load, whichever the response carries.
 */
function labTrace(TestResponse $response): array
{
    $page = inertiaPage($response);

    if (isset($page['props']['_lab'])) {
        return $page['props']['_lab'];
    }

    $content = (string) $response->getContent();
    $marker = '<script id="lab-trace" type="application/json">';

    if (! str_contains($content, $marker)) {
        throw new RuntimeException(
            "No lab trace found on this response: neither props._lab nor a {$marker} tag. ".
            'InjectLabTrace did not run, or the response carried no page at all.'
        );
    }

    $json = Str::betweenFirst($content, $marker, '</script>');

    return json_decode($json, true, 512, JSON_THROW_ON_ERROR);
}
