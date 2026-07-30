<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class HeadAndMetaController
{
    use ResolvesNeighbours;

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('head-and-meta') ?? throw new RuntimeException('The head-and-meta chapter is not registered.');

        return Inertia::render('chapters/head-and-meta', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('head-and-meta'))),
            'next' => $lab->value('next', self::neighbour($registry->next('head-and-meta'))),
        ]);
    }
}
