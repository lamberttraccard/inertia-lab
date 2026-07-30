<?php

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);
});

it('renders the chapter with its teaching metadata and both prop kinds resolved', function () {
    $response = $this->get(route('chapters.first-load-vs-visit'));

    $response->assertOk();

    $page = inertiaPage($response);
    $trace = labTrace($response);

    expect($page['component'])->toBe('chapters/first-load-vs-visit')
        ->and($page['props']['chapter']['question'])->not->toBeEmpty()
        ->and($page['props']['chapter']['translationFrom'])->not->toBeEmpty()
        ->and($page['props']['sample'])->toBeArray()
        ->and($page['props']['renderedAt'])->toBeString()
        ->and($trace['props'])->toHaveKeys(['sample', 'renderedAt']);
});

it('returns a full html document with no X-Inertia header on a plain document load', function () {
    $response = $this->get(route('chapters.first-load-vs-visit'));

    $response->assertOk();
    $content = (string) $response->getContent();

    expect($response->headers->get('Content-Type'))->toContain('text/html')
        ->and($content)->toContain('<script data-page')
        ->and($content)->toContain('type="application/json"')
        ->and($response->headers->has('X-Inertia'))->toBeFalse();
});

it('returns the page object as json with the real top level key set for a genuine visit', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get(route('chapters.first-load-vs-visit'));

    $response->assertOk();
    expect($response->headers->get('X-Inertia'))->toBe('true');

    $page = inertiaPage($response);
    $keys = array_keys($page);
    sort($keys);

    // Verified empirically for this exact controller (no defer, merge or once props): the
    // shared props HandleInertiaRequests::share() attaches (errors, name, auth) always
    // populate the sharedProps metadata key via PropsResolver::buildMetadata(), so the real
    // top level carries one key beyond the four named in the Inertia documentation.
    expect($keys)->toBe(['component', 'props', 'sharedProps', 'url', 'version']);
});

it('changes the rendered timestamp between two visits but keeps the sample identical', function () {
    $first = inertiaPage($this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get(route('chapters.first-load-vs-visit')));

    $this->travel(1)->seconds();

    $second = inertiaPage($this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get(route('chapters.first-load-vs-visit')));

    expect($second['props']['renderedAt'])->not->toBe($first['props']['renderedAt'])
        ->and($second['props']['sample'])->toBe($first['props']['sample']);
});
