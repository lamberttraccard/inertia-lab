<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Http\Middleware\HandleInertiaRequests;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use App\Models\Notification;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class PollingController
{
    use ResolvesNeighbours;

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('polling') ?? throw new RuntimeException('The polling chapter is not registered.');

        // No prop of its own for the number itself: unreadNotifications is already a
        // shared closure from HandleInertiaRequests::share(), the same one the shared-data
        // chapter introduces, so polling this page for it needs nothing declared here.
        return Inertia::render('chapters/polling', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('polling'))),
            'next' => $lab->value('next', self::neighbour($registry->next('polling'))),
        ]);
    }

    /**
     * Stands in for whatever would really change the count elsewhere: another reader
     * commenting, a background job finishing. The poll is what notices it happened; this
     * action only supplies the event for it to notice.
     */
    public function simulate(): RedirectResponse
    {
        Notification::create([
            'user_id' => HandleInertiaRequests::currentDemoUser()->id,
            'type' => 'comment',
            'data' => ['message' => 'Simulated for the polling chapter.'],
            'read_at' => null,
        ]);

        return back();
    }
}
