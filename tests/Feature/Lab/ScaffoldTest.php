<?php

use Inertia\Testing\AssertableInertia;

it('serves an inertia page at the root url', function () {
    // The root url used to serve the starter kit's own 'welcome' page. It now serves the
    // lab's home page directly, so the reader sees the lab immediately rather than the
    // scaffold splash; 'welcome' is kept only as a fixture component for the trace tests
    // that predate the chapter shell.
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->component('lab/home'));
});

it('meets the inertia version floors', function () {
    $lock = json_decode(file_get_contents(base_path('composer.lock')), true);
    $adapter = collect($lock['packages'])->firstWhere('name', 'inertiajs/inertia-laravel');

    expect(version_compare(ltrim($adapter['version'], 'v'), '3.2.0', '>='))->toBeTrue();

    $client = json_decode(file_get_contents(base_path('node_modules/@inertiajs/react/package.json')), true);

    expect(version_compare($client['version'], '3.6.0', '>='))->toBeTrue();
});
