<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use Inertia\DevTools\DevTools;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class DevtoolsAndTestingController
{
    use ResolvesNeighbours;

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('devtools-and-testing') ?? throw new RuntimeException('The devtools-and-testing chapter is not registered.');

        return Inertia::render('chapters/devtools-and-testing', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('devtools-and-testing'))),
            'next' => $lab->value('next', self::neighbour($registry->next('devtools-and-testing'))),
            // Read live rather than assumed: reflects whatever this exact request actually
            // resolved, the same call the wire strip's own "trace is off" message reads.
            'devtoolsEnabled' => $lab->value('devtoolsEnabled', DevTools::enabled()),
        ]);
    }
}
