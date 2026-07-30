<?php

namespace App\Http\Controllers\Chapters;

use App\Lab\Chapter;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class LinksAndVisitsController
{
    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('links-and-visits') ?? throw new RuntimeException('The links-and-visits chapter is not registered.');

        return Inertia::render('chapters/links-and-visits', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('links-and-visits'))),
            'next' => $lab->value('next', self::neighbour($registry->next('links-and-visits'))),
            'items' => $lab->value('items', [
                'Read the docs',
                'Trigger a partial reload',
                'Watch the wire strip',
            ]),
            'serverTime' => $lab->closure('serverTime', fn () => now()->toIso8601String()),
        ]);
    }

    /** @return array{slug: string, title: string}|null */
    private static function neighbour(?Chapter $chapter): ?array
    {
        return $chapter === null ? null : ['slug' => $chapter->slug, 'title' => $chapter->title];
    }
}
