<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class AssetVersioningController
{
    use ResolvesNeighbours;

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('asset-versioning') ?? throw new RuntimeException('The asset-versioning chapter is not registered.');

        return Inertia::render('chapters/asset-versioning', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('asset-versioning'))),
            'next' => $lab->value('next', self::neighbour($registry->next('asset-versioning'))),
            'serverVersion' => $lab->value('serverVersion', Inertia::getVersion()),
        ]);
    }

    /**
     * Deliberately not an Inertia visit, and deliberately not routed through router.post()
     * from the client: page.get().version, the value the client echoes back as
     * X-Inertia-Version on every later request, is overwritten by every successfully
     * processed Inertia response, including a POST's. A response built through
     * Inertia::render() here would resynchronise this very tab immediately, so the
     * mismatch this chapter exists to show would never occur. Stored as a fake version
     * HandleInertiaRequests::version() now checks before falling back to the real build
     * hash. The next genuine visit, still carrying the version this tab booted with, is
     * what actually meets the new one and provokes the 409.
     */
    public function bump(): JsonResponse
    {
        session(['lab.asset_version_override' => 'lab-demo-'.Str::random(8)]);

        return response()->json(['version' => Inertia::getVersion()]);
    }

    /** The reader's way back: without this, bump() would leave every later visit in this
     * application answering with a version it invented, for as long as the session lasts. */
    public function reset(): JsonResponse
    {
        session()->forget('lab.asset_version_override');

        return response()->json(['version' => Inertia::getVersion()]);
    }
}
