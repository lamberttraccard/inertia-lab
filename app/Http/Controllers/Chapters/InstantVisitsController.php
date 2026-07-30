<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use App\Models\Post;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class InstantVisitsController
{
    use ResolvesNeighbours;

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('instant-visits') ?? throw new RuntimeException('The instant-visits chapter is not registered.');

        return Inertia::render('chapters/instant-visits', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('instant-visits'))),
            'next' => $lab->value('next', self::neighbour($registry->next('instant-visits'))),
            'posts' => $lab->closure('posts', fn () => Post::query()
                ->orderBy('id')
                ->take(3)
                ->get(['id', 'title'])
                ->map(fn (Post $post) => ['id' => $post->id, 'title' => $post->title])
                ->all()),
        ]);
    }

    /**
     * Not a registered chapter of its own: the detail page an instant visit's own
     * component points at. post is deliberately slow through Lab::closure(), so it is
     * still resolving when the client's own instant swap has already rendered this exact
     * component with post undefined, which is the one thing this whole chapter is about.
     */
    public function detail(Lab $lab, Post $post): Response
    {
        return Inertia::render('chapters/instant-visits-detail', [
            'post' => $lab->closure('post', fn () => [
                'id' => $post->id,
                'title' => $post->title,
                'excerpt' => $post->excerpt,
                'author' => $post->author->name,
            ]),
        ]);
    }
}
