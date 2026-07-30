<?php

namespace App\Http\Controllers\Chapters;

use App\Lab\Chapter;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use App\Models\Post;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class MentalModelController
{
    public function __invoke(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('mental-model') ?? throw new RuntimeException('The mental-model chapter is not registered.');

        return Inertia::render('chapters/mental-model', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('mental-model'))),
            'next' => $lab->value('next', self::neighbour($registry->next('mental-model'))),
            'posts' => $lab->closure('posts', fn () => Post::query()
                ->with('author:id,name')
                ->latest('published_at')
                ->take(5)
                ->get(['id', 'user_id', 'title', 'excerpt', 'published_at'])),
            'expensiveStats' => $lab->defer('expensiveStats', fn () => [
                'posts' => Post::count(),
                'views' => Post::sum('views'),
            ]),
        ]);
    }

    /** @return array{slug: string, title: string}|null */
    private static function neighbour(?Chapter $chapter): ?array
    {
        return $chapter === null ? null : ['slug' => $chapter->slug, 'title' => $chapter->title];
    }
}
