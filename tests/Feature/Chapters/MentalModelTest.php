<?php

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    // LabRecorderTest and InjectLabTraceTest already do this for the same reason.
    config()->set('inertia.devtools.enabled', true);
});

it('renders the chapter with its teaching metadata and props of three kinds', function () {
    $response = $this->get(route('chapters.mental-model'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled. Both the page object
    // and the lab trace are read the same way a browser reads them, from the script tags the
    // response actually contains.
    $page = assertInertiaPage($response, 'chapters/mental-model');
    $trace = labTrace($response);

    expect($page['props']['chapter']['question'])->not->toBeEmpty()
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
    // find. inertiaPage() and labTrace() read this exact response shape through
    // $response->json() rather than assertInertia() for the same reason.
    $response->assertOk();

    // assertInertiaPage() asserts component here too: a partial reload response carries the
    // same component/props/url/version envelope as a full load (verified against
    // Inertia\Response::toResponse(), which builds that envelope identically either way), so
    // a regression serving the wrong component under this partial reload would not pass
    // silently the way it would if only expensiveStats were checked.
    $page = assertInertiaPage($response, 'chapters/mental-model');
    $trace = labTrace($response);

    expect($page['props']['expensiveStats'])->not->toBeNull()
        ->and($trace['props'])->toHaveKey('expensiveStats');
});
