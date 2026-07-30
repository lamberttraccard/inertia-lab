<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class FirstLoadVsVisitController
{
    use ResolvesNeighbours;

    public function __invoke(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('first-load-vs-visit') ?? throw new RuntimeException('The first-load-vs-visit chapter is not registered.');

        return Inertia::render('chapters/first-load-vs-visit', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('first-load-vs-visit'))),
            'next' => $lab->value('next', self::neighbour($registry->next('first-load-vs-visit'))),
            'sample' => $lab->value('sample', [
                'ingredients' => ['flour', 'water', 'salt'],
                'note' => 'The same array on every visit; only the envelope around it changes.',
            ]),
            'renderedAt' => $lab->closure('renderedAt', fn () => now()->toIso8601String()),
        ]);
    }
}
