<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use App\Models\Post;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class InfiniteScrollController
{
    use ResolvesNeighbours;

    private const PER_PAGE = 12;

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('infinite-scroll') ?? throw new RuntimeException('The infinite-scroll chapter is not registered.');

        return Inertia::render('chapters/infinite-scroll', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('infinite-scroll'))),
            'next' => $lab->value('next', self::neighbour($registry->next('infinite-scroll'))),
            // paginate() reads the page query parameter on its own (verified in
            // vendor/laravel/framework's AbstractPaginator::resolveCurrentPage(), default
            // page name 'page'), which is what lets a deep link like ?page=5 render the
            // middle of the feed directly rather than always starting at page 1. The
            // default wrapper, 'data', is not a coincidence: it is the exact key
            // LengthAwarePaginator::toArray() already uses for the row list, verified in
            // vendor/laravel/framework's own LengthAwarePaginator::toArray(), so Lab::scroll()
            // only needs to name the paginator, not reshape it.
            'posts' => $lab->scroll('posts', fn () => Post::query()
                ->with('author:id,name')
                ->latest('published_at')
                ->paginate(perPage: self::PER_PAGE)),
        ]);
    }
}
