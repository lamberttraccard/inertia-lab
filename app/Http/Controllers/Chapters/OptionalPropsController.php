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

class OptionalPropsController
{
    use ResolvesNeighbours;

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('optional-props') ?? throw new RuntimeException('The optional-props chapter is not registered.');

        return Inertia::render('chapters/optional-props', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('optional-props'))),
            'next' => $lab->value('next', self::neighbour($registry->next('optional-props'))),
            'cheap' => $lab->value('cheap', Tag::query()->count()),
            // A bare closure, not Lab::optional(): still resolves on every full load exactly
            // like a value prop, because nothing about being a closure defers or skips
            // anything. Computed the same way as expensive below, so the Lab factory
            // wrapping it is the only variable that changes between the two.
            'eagerStats' => $lab->closure('eagerStats', fn () => [
                'posts' => Post::count(),
                'comments' => Comment::count(),
                'likes' => Like::count(),
            ]),
            'expensive' => $lab->optional('expensive', fn () => [
                'posts' => Post::count(),
                'comments' => Comment::count(),
                'likes' => Like::count(),
            ]),
        ]);
    }
}
