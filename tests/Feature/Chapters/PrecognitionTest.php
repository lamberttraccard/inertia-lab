<?php

use App\Models\Post;
use App\Models\User;

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);

    // HandleInertiaRequests::currentDemoUser() falls back to an unpersisted placeholder
    // (id 0) when the users table is empty, which posts.user_id's foreign key rejects.
    User::factory()->create();
});

it('renders the chapter with nothing beyond the standard chapter metadata', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get(route('chapters.precognition'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled.
    $page = assertInertiaPage($response, 'chapters/precognition');
    $trace = labTrace($response);

    // Verified empirically against this exact route (see the debug trace taken from
    // chapters/first-load-vs-visit for the shared baseline): errors, name, auth, demoUser,
    // unreadNotifications and demoUserOptions are the platform's own shared props, added
    // to every page regardless of this chapter; chapter, previous and next are the
    // standard chapter metadata every chapter passes. Nothing else is added here, which is
    // the whole point: this chapter has no data prop of its own beyond the form itself.
    expect(array_keys($page['props']))->toEqualCanonicalizing([
        'errors', 'name', 'auth', 'demoUser', 'unreadNotifications', 'demoUserOptions',
        'chapter', 'previous', 'next', '_lab',
    ])
        ->and(array_keys($trace['props']))->toEqualCanonicalizing([
            'demoUser', 'unreadNotifications', 'demoUserOptions', 'chapter', 'previous', 'next',
        ]);
});

it('answers a precognition validate-only request for an available slug with 204 and creates nothing', function () {
    $response = $this->withHeaders([
        'Precognition' => 'true',
        'Precognition-Validate-Only' => 'slug',
        'Accept' => 'application/json',
    ])->post(route('chapters.precognition.store'), [
        'title' => 'A precognition demo post',
        'slug' => 'a-fresh-unique-slug',
    ]);

    // Laravel's own dispatcher swap for a precognitive request (Illuminate\Foundation\
    // Routing\PrecognitionControllerDispatcher, verified in vendor/laravel/framework)
    // resolves the controller method's FormRequest parameter, which is where validation
    // actually runs, then aborts before ever invoking the method body: the real create
    // logic in store() never executes, precognitive or not.
    $response->assertNoContent();

    expect($response->headers->get('Precognition-Success'))->toBe('true')
        ->and($response->headers->get('Precognition'))->toBe('true')
        ->and(Post::query()->count())->toBe(0);
});

it('answers a precognition validate-only request for a taken slug with 422 and creates nothing', function () {
    $author = User::query()->sole();

    Post::create([
        'user_id' => $author->id,
        'title' => 'An existing post',
        'slug' => 'already-taken-slug',
        'excerpt' => 'Existing excerpt.',
        'body' => 'Existing body.',
        'published_at' => now(),
    ]);

    $response = $this->withHeaders([
        'Precognition' => 'true',
        'Precognition-Validate-Only' => 'slug',
        'Accept' => 'application/json',
    ])->post(route('chapters.precognition.store'), [
        'title' => 'A precognition demo post',
        'slug' => 'already-taken-slug',
    ]);

    // The real unique:posts,slug rule on the real column, run against the row created
    // above: this is what proves the check is genuine rather than a hand-rolled stand-in.
    $response->assertStatus(422);

    expect($response->json('errors.slug.0'))->toContain('already been taken')
        ->and(Post::query()->count())->toBe(1);
});

it('creates the demo post on a real submission with no precognition headers and redirects', function () {
    $response = $this->post(route('chapters.precognition.store'), [
        'title' => 'A real precognition demo post',
        'slug' => 'a-real-demo-slug',
    ]);

    $response->assertRedirect(route('chapters.precognition'));

    $post = Post::query()->sole();

    expect($post->title)->toBe('A real precognition demo post')
        ->and($post->slug)->toBe('a-real-demo-slug');
});

it('redirects back with errors and creates nothing on a real submission with a taken slug', function () {
    $author = User::query()->sole();

    Post::create([
        'user_id' => $author->id,
        'title' => 'An existing post',
        'slug' => 'already-taken-slug',
        'excerpt' => 'Existing excerpt.',
        'body' => 'Existing body.',
        'published_at' => now(),
    ]);

    // A real browser submits this from the chapter page itself, so the request carries a
    // Referer the failed-validation redirect can return to, same as chapter 17's forms.
    $response = $this->withHeaders(['referer' => route('chapters.precognition')])
        ->post(route('chapters.precognition.store'), [
            'title' => 'Another demo post',
            'slug' => 'already-taken-slug',
        ]);

    $response->assertRedirect(route('chapters.precognition'));
    expect(Post::query()->count())->toBe(1);
});

it('never keeps more than one demo row no matter how many valid submissions land', function () {
    $this->post(route('chapters.precognition.store'), [
        'title' => 'First demo post',
        'slug' => 'first-demo-slug',
    ]);

    $this->post(route('chapters.precognition.store'), [
        'title' => 'Second demo post',
        'slug' => 'second-demo-slug',
    ]);

    // Reversible, not accumulating: the slug is whatever the reader typed, so this chapter
    // cannot key the demo row on a fixed slug the way chapters 17 and 18 do; a fixed
    // marker in excerpt identifies and replaces it instead, on every real submission.
    expect(Post::query()->count())->toBe(1);

    $post = Post::query()->sole();
    expect($post->slug)->toBe('second-demo-slug');
});
