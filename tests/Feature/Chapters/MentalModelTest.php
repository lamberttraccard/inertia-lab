<?php

use Illuminate\Support\Str;

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    // LabRecorderTest and InjectLabTraceTest already do this for the same reason.
    config()->set('inertia.devtools.enabled', true);
});

it('renders the chapter with its teaching metadata and props of three kinds', function () {
    $response = $this->get(route('chapters.mental-model'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: it reads TestResponse::viewData('page'),
    // which requires Response::original to still be the Illuminate\View\View instance
    // Inertia rendered. With devtools enabled, Inertia\Middleware::handle() calls the
    // official recorder's respondedWith() for this exact response, after InjectLabTrace has
    // already run and restored $response->original (InjectLabTrace is appended last in
    // bootstrap/app.php, so it is innermost and its restoration runs first as the response
    // unwinds). respondedWith() injects its own <script data-inertia-devtools-id> tag
    // through a second Response::setContent() call, which clobbers original back to a plain
    // string, exactly what assertViewHas('page') rejects. So both the page object and the
    // lab trace are read from the script tags the response actually contains, the same
    // information a real browser reads.
    $content = $response->getContent();

    $page = json_decode(
        Str::betweenFirst($content, '<script data-page="app" type="application/json">', '</script>'),
        true
    );
    $trace = json_decode(
        Str::betweenFirst($content, '<script id="lab-trace" type="application/json">', '</script>'),
        true
    );

    expect($page['component'])->toBe('chapters/mental-model')
        ->and($page['props']['chapter']['question'])->not->toBeEmpty()
        ->and($page['props']['chapter']['translationFrom'])->not->toBeEmpty()
        ->and($page['props']['posts'])->toBeArray()
        ->and($trace['props'])->toHaveKey('posts')
        ->and($trace['skipped'])->toHaveKey('expensiveStats');
});

it('resolves the deferred prop only when it is asked for', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Partial-Component' => 'chapters/mental-model',
        'X-Inertia-Partial-Data' => 'expensiveStats',
    ])->get(route('chapters.mental-model'));

    // assertInertia() cannot be used here either, for a different reason: for any request
    // carrying an X-Inertia header, Inertia\Response::toResponse() returns a bare
    // JsonResponse and never touches a View at all, so assertViewHas('page') has nothing to
    // find. LabRecorderTest and InjectLabTraceTest already read this exact response shape
    // through $response->json() rather than assertInertia() for the same reason.
    $response->assertOk();

    expect($response->json('props.expensiveStats'))->not->toBeNull()
        ->and($response->json('props._lab.props'))->toHaveKey('expensiveStats');
});
