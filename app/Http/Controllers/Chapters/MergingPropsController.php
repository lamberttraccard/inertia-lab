<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use App\Models\Comment;
use App\Models\Post;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class MergingPropsController
{
    use ResolvesNeighbours;

    private const COMMENTS_PER_PAGE = 20;

    private const DIGEST_PER_PAGE = 5;

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('merging-props') ?? throw new RuntimeException('The merging-props chapter is not registered.');

        $commentsPage = max(1, request()->integer('commentsPage', 1));
        $digestPage = max(1, request()->integer('digestPage', 1));
        $deep = request()->boolean('deep');

        // Shared between the merge and deepMerge branches below so the only difference
        // between the two requests this chapter compares is which Lab factory wraps it.
        $digest = fn () => [
            'items' => Post::query()
                ->latest('published_at')
                ->forPage($digestPage, self::DIGEST_PER_PAGE)
                ->get(['id', 'title', 'published_at']),
            'fetchedAt' => now()->toIso8601String(),
        ];

        return Inertia::render('chapters/merging-props', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('merging-props'))),
            'next' => $lab->value('next', self::neighbour($registry->next('merging-props'))),
            // matchOn('id') is what lets requesting the same commentsPage twice update
            // existing rows in place instead of duplicating them at the tail: verified in
            // vendor/inertiajs/inertia-laravel/src/PropsResolver::collectMergeableMetadata(),
            // which turns this into a matchPropsOn entry the client's mergeOrMatchItems()
            // reads before deciding whether to append blindly or match by key.
            'comments' => $lab->merge('comments', fn () => Comment::query()
                ->with('author:id,name')
                ->latest('id')
                ->forPage($commentsPage, self::COMMENTS_PER_PAGE)
                ->get(['id', 'post_id', 'user_id', 'body', 'created_at']))->matchOn('id'),
            'commentsHasMore' => $lab->closure(
                'commentsHasMore',
                fn () => Comment::count() > $commentsPage * self::COMMENTS_PER_PAGE,
            ),
            // Same shape, two different factories: toggled by a query flag rather than
            // hardcoded, so the reader can request the identical payload both ways and see
            // the client behave differently purely because of which one wrapped it.
            'postDigest' => $deep
                ? $lab->deepMerge('postDigest', $digest)
                : $lab->merge('postDigest', $digest),
            'usingDeepMerge' => $lab->value('usingDeepMerge', $deep),
        ]);
    }
}
