<?php

use Inertia\Testing\AssertableInertia;

it('serves an inertia page at the root url', function () {
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->component('welcome'));
});

it('meets the inertia version floors', function () {
    $lock = json_decode(file_get_contents(base_path('composer.lock')), true);
    $adapter = collect($lock['packages'])->firstWhere('name', 'inertiajs/inertia-laravel');

    expect(version_compare(ltrim($adapter['version'], 'v'), '3.2.0', '>='))->toBeTrue();

    $client = json_decode(file_get_contents(base_path('node_modules/@inertiajs/react/package.json')), true);

    expect(version_compare($client['version'], '3.6.0', '>='))->toBeTrue();
});
