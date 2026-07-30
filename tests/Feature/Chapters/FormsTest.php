<?php

use App\Models\Post;
use App\Models\Tag;
use App\Models\User;

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);

    // HandleInertiaRequests::currentDemoUser() falls back to an unpersisted placeholder
    // (id 0) when the users table is empty, which posts.user_id's foreign key rejects: a
    // real demo user is exactly what every other chapter's seeded data already provides.
    User::factory()->create();

    Tag::create(['name' => 'Laravel', 'slug' => 'laravel']);
    Tag::create(['name' => 'Testing', 'slug' => 'testing']);
});

it('renders the chapter with blank demo post defaults, the real tag options and no unexpected props', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get(route('chapters.forms'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled.
    $page = assertInertiaPage($response, 'chapters/forms');
    $trace = labTrace($response);

    expect($page['props']['post'])->toBe(['title' => '', 'excerpt' => '', 'body' => '', 'tags' => []])
        ->and($page['props']['tagOptions'])->toHaveCount(2);

    // Verified empirically against this exact route (see the debug trace taken from
    // chapters/first-load-vs-visit for the shared baseline): errors, name, auth, demoUser,
    // unreadNotifications and demoUserOptions are the platform's own shared props, added
    // to every page regardless of this chapter; chapter, previous and next are the
    // standard chapter metadata every chapter passes; post and tagOptions are this
    // chapter's own. Nothing else is added here.
    expect(array_keys($page['props']))->toEqualCanonicalizing([
        'errors', 'name', 'auth', 'demoUser', 'unreadNotifications', 'demoUserOptions',
        'chapter', 'previous', 'next', 'post', 'tagOptions', '_lab',
    ])
        ->and(array_keys($trace['props']))->toEqualCanonicalizing([
            'demoUser', 'unreadNotifications', 'demoUserOptions',
            'chapter', 'previous', 'next', 'post', 'tagOptions',
        ]);
});

it('creates no row and reports the validation errors on the next load when the submission is invalid', function () {
    // A real browser submits this form from the chapter page itself, so the request
    // carries a Referer the failed-validation redirect (a bare back(), since it never
    // reaches this controller's own success-path redirect) can return to. A test request
    // without one would instead follow Laravel's own no-referer fallback to "/", which is
    // a fact about that fallback, not about this chapter.
    $response = $this->withHeaders(['referer' => route('chapters.forms')])
        ->post(route('chapters.forms.store'), [
            'title' => '',
            'excerpt' => '',
            'body' => '',
        ]);

    // Laravel's default failed-validation behaviour for a request that does not want
    // JSON: redirect back with the errors flashed to the session. Inertia visits ask for
    // text/html, not JSON (verified in node_modules/@inertiajs/core/dist/index.js), so
    // this request never reaches a JSON 422 body at all, only this redirect.
    $response->assertRedirect(route('chapters.forms'));
    expect(Post::query()->count())->toBe(0);

    // The follow-up GET is what a browser's XHR auto-follow of the redirect above would
    // load: this is where the errors prop this chapter is actually about becomes visible.
    $reload = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get(route('chapters.forms'));

    $reload->assertOk();
    $page = assertInertiaPage($reload, 'chapters/forms');

    expect($page['props']['errors'])->toHaveKeys(['title', 'excerpt', 'body']);
    expect(Post::query()->count())->toBe(0);
});

it('creates the demo post on the first valid submission and keeps editing that same row afterwards', function () {
    $tag = Tag::query()->first();

    $response = $this->post(route('chapters.forms.store'), [
        'title' => 'A demo post title',
        'excerpt' => 'A short excerpt for the demo post.',
        'body' => str_repeat('Demo body content. ', 5),
        'tags' => [$tag->id],
    ]);

    $response->assertRedirect(route('chapters.forms'));
    expect(Post::query()->count())->toBe(1);

    $post = Post::query()->sole();

    expect($post->title)->toBe('A demo post title')
        ->and($post->tags->pluck('id')->all())->toBe([$tag->id]);

    $this->post(route('chapters.forms.store'), [
        'title' => 'An updated demo post title',
        'excerpt' => 'A short excerpt for the demo post.',
        'body' => str_repeat('Demo body content. ', 5),
        'tags' => [],
    ])->assertRedirect(route('chapters.forms'));

    // Same row updated, not a second one: a reader resubmitting this form all afternoon
    // cannot grow the table the other chapters' tests and demos depend on.
    expect(Post::query()->count())->toBe(1);

    $post->refresh();

    expect($post->title)->toBe('An updated demo post title')
        ->and($post->tags)->toBeEmpty();
});
