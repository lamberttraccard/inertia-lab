<?php

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);
});

it('renders the chapter with its teaching metadata', function () {
    $response = $this->get(route('chapters.layouts'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled.
    $page = assertInertiaPage($response, 'chapters/layouts');

    expect($page['props']['chapter']['question'])->not->toBeEmpty();
});

it('renders both panel routes that share the persistent layout, each with its own prop resolved', function () {
    $panelOne = $this->get(route('chapters.layouts.panel-one'));

    $panelOne->assertOk();

    $panelOnePage = assertInertiaPage($panelOne, 'chapters/layouts-panel-one');
    $panelOneTrace = labTrace($panelOne);

    expect($panelOnePage['props']['visitedAt'])->toBeString()->not->toBeEmpty()
        ->and($panelOneTrace['props'])->toHaveKey('visitedAt');

    $panelTwo = $this->get(route('chapters.layouts.panel-two'));

    $panelTwo->assertOk();

    $panelTwoPage = assertInertiaPage($panelTwo, 'chapters/layouts-panel-two');
    $panelTwoTrace = labTrace($panelTwo);

    expect($panelTwoPage['props']['visitedAt'])->toBeString()->not->toBeEmpty()
        ->and($panelTwoTrace['props'])->toHaveKey('visitedAt');
});
