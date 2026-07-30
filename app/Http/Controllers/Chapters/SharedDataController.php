<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class SharedDataController
{
    use ResolvesNeighbours;

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('shared-data') ?? throw new RuntimeException('The shared-data chapter is not registered.');

        // No prop of its own beyond the standard chapter metadata: the interesting props
        // on this page are demoUser, unreadNotifications and demoUserOptions, all added by
        // HandleInertiaRequests rather than here, because they belong to every page.
        return Inertia::render('chapters/shared-data', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('shared-data'))),
            'next' => $lab->value('next', self::neighbour($registry->next('shared-data'))),
        ]);
    }

    /**
     * A real Inertia visit, not a bypassed fetch: the redirect this returns is followed by
     * a GET, and that GET's response carries the shared props recomputed for the new demo
     * user, which is the entire lesson. Silently ignoring an unknown id, rather than
     * failing, keeps a stale or tampered-with form from changing who the session reads as.
     */
    public function switchUser(Request $request): RedirectResponse
    {
        $id = $request->integer('user_id');

        if (User::query()->whereKey($id)->exists()) {
            session(['lab.demo_user_id' => $id]);
        }

        return back();
    }
}
