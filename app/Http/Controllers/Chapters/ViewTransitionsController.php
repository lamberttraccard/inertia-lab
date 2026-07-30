<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use App\Models\Post;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class ViewTransitionsController
{
    use ResolvesNeighbours;

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('view-transitions') ?? throw new RuntimeException('The view-transitions chapter is not registered.');

        return Inertia::render('chapters/view-transitions', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('view-transitions'))),
            'next' => $lab->value('next', self::neighbour($registry->next('view-transitions'))),
            'posts' => $lab->closure('posts', fn () => Post::query()
                ->orderBy('id')
                ->take(3)
                ->get(['id', 'title', 'excerpt'])
                ->map(fn (Post $post) => [
                    'id' => $post->id,
                    'title' => $post->title,
                    'excerpt' => $post->excerpt,
                ])
                ->all()),
        ]);
    }

    /**
     * Not a registered chapter of its own: the detail page each card in the grid links to.
     * The shared element carrying view-transition-name lives in both this component and
     * the index's own card for the same post, under the same name, which is what lets the
     * browser morph one into the other instead of only cross-fading the whole document.
     */
    public function detail(Lab $lab, Post $post): Response
    {
        return Inertia::render('chapters/view-transitions-detail', [
            'post' => $lab->value('post', [
                'id' => $post->id,
                'title' => $post->title,
                'excerpt' => $post->excerpt,
            ]),
        ]);
    }
}
