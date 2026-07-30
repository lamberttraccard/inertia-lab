<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class HttpRequestsController
{
    use ResolvesNeighbours;

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('http-requests') ?? throw new RuntimeException('The http-requests chapter is not registered.');

        return Inertia::render('chapters/http-requests', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('http-requests'))),
            'next' => $lab->value('next', self::neighbour($registry->next('http-requests'))),
        ]);
    }

    /**
     * An ordinary JSON endpoint, not an Inertia response at all: useHttp on the client
     * points at this, and its request never carries an X-Inertia header (verified in
     * node_modules/@inertiajs/react/dist/index.js's useHttp submit(), which only sets
     * Accept and, for a body, Content-Type), so nothing here needs to look like a page.
     */
    public function ping(): JsonResponse
    {
        return response()->json([
            'message' => 'This came back from a plain HTTP request, not a visit.',
            'servedAt' => now()->toIso8601String(),
        ]);
    }
}
