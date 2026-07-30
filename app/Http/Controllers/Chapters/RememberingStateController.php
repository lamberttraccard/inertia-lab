<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use App\Models\Post;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class RememberingStateController
{
    use ResolvesNeighbours;

    public function show(Request $request, Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('remembering-state') ?? throw new RuntimeException('The remembering-state chapter is not registered.');

        $filter = trim((string) $request->query('filter', ''));

        return Inertia::render('chapters/remembering-state', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('remembering-state'))),
            'next' => $lab->value('next', self::neighbour($registry->next('remembering-state'))),
            // Deep-linking a ?filter= reflects in the server-rendered list, independent of the
            // two client-side inputs below it: those filter the same posts array in the
            // browser, without a request, which is the behaviour this chapter is actually about.
            'filter' => $lab->value('filter', $filter),
            'posts' => $lab->closure('posts', fn () => Post::query()
                ->when($filter !== '', fn ($query) => $query->where('title', 'like', '%'.$filter.'%'))
                ->orderBy('id')
                ->take(10)
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
     * Not a registered chapter of its own: the page a list row links to, so leaving the list
     * and pressing back has somewhere real to leave to and return from.
     */
    public function detail(Lab $lab, Post $post): Response
    {
        return Inertia::render('chapters/remembering-state-detail', [
            'post' => $lab->closure('post', fn () => [
                'id' => $post->id,
                'title' => $post->title,
                'excerpt' => $post->excerpt,
            ]),
        ]);
    }
}
