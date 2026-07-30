<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use App\Models\Tag;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class OncePropsController
{
    use ResolvesNeighbours;

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('once-props') ?? throw new RuntimeException('The once-props chapter is not registered.');

        return Inertia::render('chapters/once-props', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('once-props'))),
            'next' => $lab->value('next', self::neighbour($registry->next('once-props'))),
            // A page-owned once prop, not the shared one: HandleInertiaRequests already
            // shares demoUserOptions through shareOnce() for the user switcher, and this
            // chapter deliberately does not repeat that, it points at it instead.
            'tags' => $lab->once('tags', fn () => Tag::query()->orderBy('name')->pluck('name')->all()),
            'visitedAt' => $lab->closure('visitedAt', fn () => now()->toIso8601String()),
        ]);
    }
}
