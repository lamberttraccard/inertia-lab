<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use App\Models\Comment;
use App\Models\Like;
use App\Models\Post;
use App\Models\Tag;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class PartialReloadsController
{
    use ResolvesNeighbours;

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('partial-reloads') ?? throw new RuntimeException('The partial-reloads chapter is not registered.');

        return Inertia::render('chapters/partial-reloads', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('partial-reloads'))),
            'next' => $lab->value('next', self::neighbour($registry->next('partial-reloads'))),
            'posts' => $lab->closure('posts', fn () => Post::query()
                ->latest('published_at')
                ->take(10)
                ->get(['id', 'user_id', 'title', 'excerpt', 'published_at'])),
            'tags' => $lab->closure('tags', fn () => Tag::query()->orderBy('name')->pluck('name')->all()),
            // Deliberately an ordinary closure, not deferred or optional: those are skipped
            // on every full load regardless of only/except, which would blur the one thing
            // this chapter demonstrates. Slow mode, the platform-wide slider, adds real
            // latency here, so a partial reload that skips this saves time, not only bytes.
            'stats' => $lab->closure('stats', fn () => [
                'posts' => Post::count(),
                'comments' => Comment::count(),
                'likes' => Like::count(),
            ]),
        ]);
    }
}
