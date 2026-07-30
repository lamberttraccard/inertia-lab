<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class PrefetchingController
{
    use ResolvesNeighbours;

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('prefetching') ?? throw new RuntimeException('The prefetching chapter is not registered.');

        return Inertia::render('chapters/prefetching', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('prefetching'))),
            'next' => $lab->value('next', self::neighbour($registry->next('prefetching'))),
        ]);
    }

    /**
     * Not a registered chapter of its own: the destination every prefetched link in this
     * chapter points at, so hovering, mounting or clicking one has somewhere real to go.
     * reachedAt is deliberately slow through Lab::closure(), the same as any other chapter
     * prop, because a slow destination is what makes prefetching it ahead of the click
     * turn into a click that feels instant instead of one that is instant regardless.
     */
    public function destination(Lab $lab): Response
    {
        return Inertia::render('chapters/prefetching-destination', [
            'reachedAt' => $lab->closure('reachedAt', fn () => now()->toIso8601String()),
        ]);
    }
}
