<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class HistoryEncryptionController
{
    use ResolvesNeighbours;

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('history-encryption') ?? throw new RuntimeException('The history-encryption chapter is not registered.');

        // Called on every render of this route, not only once: encryptHistory is a
        // per-response instance property on Inertia\Response (see
        // vendor/inertiajs/inertia-laravel/src/Response.php), so it has to be set again
        // on the very response that also carries clearHistory after the button below.
        Inertia::encryptHistory();

        return Inertia::render('chapters/history-encryption', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('history-encryption'))),
            'next' => $lab->value('next', self::neighbour($registry->next('history-encryption'))),
            'renderedAt' => $lab->closure('renderedAt', fn () => now()->toIso8601String()),
        ]);
    }

    /**
     * Sets a session flag ResponseFactory::clearHistory() stores under
     * SessionKey::CLEAR_HISTORY; Inertia\Response::__construct() pulls it back out (and
     * clears it again) the moment the next Inertia::render() anywhere builds a response,
     * which is why redirecting straight back to show() is enough to demonstrate it.
     */
    public function clear(): RedirectResponse
    {
        Inertia::clearHistory();

        return redirect()->route('chapters.history-encryption');
    }
}
