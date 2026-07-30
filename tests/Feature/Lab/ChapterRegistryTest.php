<?php

use App\Lab\ChapterRegistry;

it('exposes chapters in a stable order with unique slugs', function () {
    $chapters = app(ChapterRegistry::class)->all();

    expect($chapters)->not->toBeEmpty();

    $slugs = array_map(fn ($chapter) => $chapter->slug, $chapters);
    expect($slugs)->toBe(array_unique($slugs));

    $orders = array_map(fn ($chapter) => $chapter->order, $chapters);
    $sorted = $orders;
    sort($sorted);
    expect($orders)->toBe($sorted);
});

it('gives every chapter the teaching fields that carry the pedagogy', function () {
    foreach (app(ChapterRegistry::class)->all() as $chapter) {
        expect($chapter->question)->not->toBeEmpty("{$chapter->slug} has no plain-language question")
            ->and($chapter->translationFrom)->not->toBeEmpty("{$chapter->slug} has no translation callout")
            ->and($chapter->translationTo)->not->toBeEmpty("{$chapter->slug} has no translation callout")
            ->and($chapter->docsUrl)->toStartWith('https://inertiajs.com/');
    }
});

it('links chapters into a path', function () {
    $registry = app(ChapterRegistry::class);
    $first = $registry->all()[0];

    expect($registry->previous($first->slug))->toBeNull()
        ->and($registry->find($first->slug)->slug)->toBe($first->slug);
});

it('points every chapter at source files that exist', function () {
    foreach (app(ChapterRegistry::class)->all() as $chapter) {
        expect(file_exists(base_path($chapter->serverFile)))->toBeTrue("missing {$chapter->serverFile}")
            ->and(file_exists(base_path($chapter->clientFile)))->toBeTrue("missing {$chapter->clientFile}");
    }
});

it('assigns every chapter to exactly one part, in the same order all() uses', function () {
    $registry = app(ChapterRegistry::class);

    $slugsInOrder = array_map(fn ($chapter) => $chapter->slug, $registry->all());

    $slugsByPart = array_merge(
        ...array_map(
            fn (array $part) => array_map(fn ($chapter) => $chapter->slug, $part['chapters']),
            $registry->partsWithChapters()
        )
    );

    expect($slugsByPart)->toBe($slugsInOrder);
});
