<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Http\Middleware\HandleInertiaRequests;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use App\Models\Like;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class OptimisticUpdatesController
{
    use ResolvesNeighbours;

    // Fixed so every click toggles the same row instead of creating a new demo post each
    // time, the same reasoning FormsController::DEMO_SLUG already established.
    private const DEMO_SLUG = 'lab-demo-optimistic-post';

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('optimistic-updates') ?? throw new RuntimeException('The optimistic-updates chapter is not registered.');

        return Inertia::render('chapters/optimistic-updates', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('optimistic-updates'))),
            'next' => $lab->value('next', self::neighbour($registry->next('optimistic-updates'))),
            'reliable' => $lab->closure('reliable', fn () => self::reliableState()),
            // Never persisted anywhere: the endpoint this card posts to refuses before
            // touching anything, so there is nothing real to read back here either. A
            // fixed starting count is enough for the rollback this card demonstrates.
            'unreliable' => $lab->value('unreliable', [
                'label' => 'A post that never accepts a like',
                'likes' => 12,
                'likedByMe' => false,
            ]),
        ]);
    }

    /** Toggles a real like for the fixed demo post; always succeeds. */
    public function like(): RedirectResponse
    {
        $userId = HandleInertiaRequests::currentDemoUser()->id;
        $post = self::demoPost($userId);

        $existing = Like::query()
            ->where('post_id', $post->id)
            ->where('user_id', $userId)
            ->first();

        if ($existing !== null) {
            $existing->delete();
        } else {
            Like::create(['post_id' => $post->id, 'user_id' => $userId]);
        }

        return back();
    }

    /**
     * Always refuses, before touching anything. abort() here bypasses
     * Inertia::render() entirely, the same mechanism chapters/events already verified for
     * its own deliberate 422: the response carries no X-Inertia header, so the client
     * treats it as httpException rather than a validation failure. That distinction does
     * not change the rollback itself: Request.send()'s own .finally() in
     * node_modules/@inertiajs/core/dist/index.js calls finish() regardless of which of
     * the two this was, and applyOptimisticUpdate()'s rollback runs from onFinish.
     */
    public function likeUnreliable(): never
    {
        abort(422, 'This endpoint always refuses the like, deliberately, so the rollback stays visible.');
    }

    /** @return array{label: string, likes: int, likedByMe: bool} */
    private static function reliableState(): array
    {
        $post = Post::query()->where('slug', self::DEMO_SLUG)->first();

        if ($post === null) {
            return ['label' => 'A post you can really like', 'likes' => 0, 'likedByMe' => false];
        }

        $userId = HandleInertiaRequests::currentDemoUser()->id;

        return [
            'label' => $post->title,
            'likes' => $post->likes()->count(),
            'likedByMe' => $post->likes()->where('user_id', $userId)->exists(),
        ];
    }

    private static function demoPost(int $userId): Post
    {
        return Post::query()->firstOrCreate(
            ['slug' => self::DEMO_SLUG],
            [
                'user_id' => $userId,
                'title' => 'A post you can really like',
                'excerpt' => 'Demo post for the optimistic-updates chapter.',
                'body' => str_repeat('Demo content for the optimistic-updates chapter. ', 10),
                'published_at' => now(),
            ],
        );
    }
}
