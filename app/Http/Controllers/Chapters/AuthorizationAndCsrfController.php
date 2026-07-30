<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Http\Middleware\HandleInertiaRequests;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use App\Models\Post;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class AuthorizationAndCsrfController
{
    use ResolvesNeighbours;

    private const DEMO_SLUG = 'lab-demo-authorization-post';

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('authorization-and-csrf') ?? throw new RuntimeException('The authorization-and-csrf chapter is not registered.');

        $post = self::demoPost();
        $demoUser = HandleInertiaRequests::currentDemoUser();

        return Inertia::render('chapters/authorization-and-csrf', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('authorization-and-csrf'))),
            'next' => $lab->value('next', self::neighbour($registry->next('authorization-and-csrf'))),
            'post' => $lab->value('post', [
                'id' => $post->id,
                'title' => $post->title,
                'authorName' => $post->author->name,
            ]),
            // Computed with Gate::forUser() against the session-picked demo user, not the
            // request's own (always-null) authenticated user: PostPolicy is a real policy,
            // resolved by Laravel's own naming convention (verified against
            // Illuminate\Auth\Access\Gate::guessPolicyName()), but this application has no
            // real login guard for it to check against automatically.
            'can' => $lab->value('can', [
                'update' => Gate::forUser($demoUser)->allows('update', $post),
                'delete' => Gate::forUser($demoUser)->allows('delete', $post),
            ]),
        ]);
    }

    /**
     * Gate::forUser()->authorize() throws AuthorizationException on denial, which
     * Illuminate\Foundation\Exceptions\Handler::prepareException() maps to a 403
     * AccessDeniedHttpException: the same policy this page reads to disable the button
     * also rejects the request if it reaches this action regardless.
     */
    public function rename(Request $request, Post $post): RedirectResponse
    {
        Gate::forUser(HandleInertiaRequests::currentDemoUser())->authorize('update', $post);

        $validated = $request->validate(['title' => ['required', 'string', 'max:120']]);

        $post->update(['title' => $validated['title']]);

        return back();
    }

    public function destroy(Post $post): RedirectResponse
    {
        Gate::forUser(HandleInertiaRequests::currentDemoUser())->authorize('delete', $post);

        $post->delete();

        // Recreated immediately rather than left gone: a reader who really is authorized
        // to delete this row would otherwise take the demo away from every future visitor.
        self::demoPost();

        return back();
    }

    private static function demoPost(): Post
    {
        return Post::query()->firstOrCreate(
            ['slug' => self::DEMO_SLUG],
            [
                // The same row HandleInertiaRequests::currentDemoUser() falls back to
                // before any session switch, so the default demo user is this post's
                // author until the reader switches to someone else.
                'user_id' => User::query()->orderBy('id')->firstOrFail()->id,
                'title' => 'A post owned by the first demo user',
                'excerpt' => 'Switch the demo user below to see the buttons change.',
                'body' => str_repeat('Demo body content for the authorization chapter. ', 5),
                'published_at' => now(),
            ]
        );
    }
}
