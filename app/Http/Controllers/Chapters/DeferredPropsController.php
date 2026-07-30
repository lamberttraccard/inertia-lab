<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use App\Models\Comment;
use App\Models\Post;
use App\Models\Tag;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class DeferredPropsController
{
    use ResolvesNeighbours;

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('deferred-props') ?? throw new RuntimeException('The deferred-props chapter is not registered.');

        return Inertia::render('chapters/deferred-props', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('deferred-props'))),
            'next' => $lab->value('next', self::neighbour($registry->next('deferred-props'))),
            'summary' => $lab->closure('summary', fn () => Post::count()),
            // Two props, one group: the client's own loadDeferredProps() issues one
            // doReload() per group entry (verified in node_modules/@inertiajs/core/dist/
            // index.js), so postStats and commentStats arrive together in a single
            // follow-up request while tagCloud, in a different group, arrives in another.
            'postStats' => $lab->defer('postStats', fn () => [
                'total' => Post::count(),
                'published' => Post::query()->whereNotNull('published_at')->count(),
            ], 'stats'),
            'commentStats' => $lab->defer('commentStats', fn () => [
                'total' => Comment::count(),
            ], 'stats'),
            'tagCloud' => $lab->defer('tagCloud', fn () => Tag::query()->orderBy('name')->pluck('name')->all(), 'sidebar'),
            // rescue: true is the only reason this chapter can show what a failed deferred
            // prop looks like instead of only describing it. Lab::defer() forwards rescue
            // straight to Inertia::defer(), so the callback below always throws, and the
            // trace reports SkipReason::Rescued instead of turning the whole page into a 500.
            'riskyInsight' => $lab->defer('riskyInsight', fn () => throw new RuntimeException(
                'This insight always fails, deliberately, to show what rescue does.'
            ), 'insights', rescue: true),
            // Optional, not deferred: a deferred prop's group is requested automatically the
            // moment the page mounts, regardless of scroll position, which would make
            // WhenVisible's own visibility check redundant. An optional prop is never
            // requested unless something explicitly asks, so scrolling it into view is a
            // genuine trigger rather than a race against a fetch that already started.
            'belowTheFold' => $lab->optional('belowTheFold', fn () => Post::query()
                ->orderByDesc('views')
                ->value('title')),
        ]);
    }
}
