<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class LayoutsController
{
    use ResolvesNeighbours;

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('layouts') ?? throw new RuntimeException('The layouts chapter is not registered.');

        return Inertia::render('chapters/layouts', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('layouts'))),
            'next' => $lab->value('next', self::neighbour($registry->next('layouts'))),
        ]);
    }

    /**
     * Not a registered chapter of its own, and not rendered through ChapterShell: this and
     * panelTwo() are the two routes the layouts chapter points at, kept to their own pair
     * of minimal pages so demonstrating a persistent layout never touches how the other
     * chapters mount. visitedAt is this page's own prop, resolved fresh on every visit,
     * unlike anything the shared layout itself holds.
     */
    public function panelOne(Lab $lab): Response
    {
        return Inertia::render('chapters/layouts-panel-one', [
            'visitedAt' => $lab->closure('visitedAt', fn () => now()->toIso8601String()),
        ]);
    }

    public function panelTwo(Lab $lab): Response
    {
        return Inertia::render('chapters/layouts-panel-two', [
            'visitedAt' => $lab->closure('visitedAt', fn () => now()->toIso8601String()),
        ]);
    }
}
