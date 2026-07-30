<?php

use App\Lab\ChapterRegistry;
use Inertia\Testing\AssertableInertia;

it('lists every chapter on the home page', function () {
    $this->get(route('lab.home'))->assertInertia(
        fn (AssertableInertia $page) => $page
            ->component('lab/home')
            ->has('chapters', count(app(ChapterRegistry::class)->all()))
    );
});

it('links every row of the where-did-it-go page to a chapter that exists', function () {
    $this->get(route('lab.where-did-it-go'))->assertInertia(function (AssertableInertia $page) {
        $slugs = array_map(fn ($chapter) => $chapter->slug, app(ChapterRegistry::class)->all());

        foreach ($page->toArray()['props']['rows'] as $row) {
            expect($slugs)->toContain($row['chapter']);
        }
    });
});

it('serves the glossary', function () {
    $this->get(route('lab.glossary'))->assertInertia(fn (AssertableInertia $page) => $page->component('lab/glossary')->has('terms'));
});

it('reports the versions actually installed rather than hardcoded ones', function () {
    $adapter = collect(json_decode(file_get_contents(base_path('composer.lock')), true)['packages'])
        ->firstWhere('name', 'inertiajs/inertia-laravel')['version'];

    $this->get(route('lab.home'))->assertInertia(
        fn (AssertableInertia $page) => $page->where('versions.inertiaLaravel', $adapter)->has('versions.inertiaReact')
    );
});
