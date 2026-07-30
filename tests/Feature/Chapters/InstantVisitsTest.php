<?php

use App\Models\Post;
use Database\Seeders\LabSeeder;

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);

    $this->seed(LabSeeder::class);
});

it('renders the chapter with three real posts to link to', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get(route('chapters.instant-visits'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled.
    $page = assertInertiaPage($response, 'chapters/instant-visits');
    $trace = labTrace($response);

    // Verified empirically against this exact route (see the debug trace taken from
    // chapters/first-load-vs-visit for the shared baseline): errors, name, auth, demoUser,
    // unreadNotifications and demoUserOptions are the platform's own shared props, added to
    // every page regardless of this chapter; chapter, previous and next are the standard
    // chapter metadata every chapter passes.
    expect(array_keys($page['props']))->toEqualCanonicalizing([
        'errors', 'name', 'auth', 'demoUser', 'unreadNotifications', 'demoUserOptions',
        'chapter', 'previous', 'next', 'posts', '_lab',
    ])
        ->and(array_keys($trace['props']))->toEqualCanonicalizing([
            'demoUser', 'unreadNotifications', 'demoUserOptions', 'chapter', 'previous', 'next', 'posts',
        ])
        ->and($page['props']['posts'])->toHaveCount(3)
        ->and($page['props']['posts'][0])->toHaveKeys(['id', 'title']);
});

it('renders the detail route normally, with its own post prop resolved', function () {
    $post = Post::query()->orderBy('id')->firstOrFail();

    $response = $this->get(route('chapters.instant-visits.detail', $post));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/instant-visits-detail');
    $trace = labTrace($response);

    expect($page['props']['post'])->toBe([
        'id' => $post->id,
        'title' => $post->title,
        'excerpt' => $post->excerpt,
        'author' => $post->author->name,
    ])->and($trace['props'])->toHaveKey('post');
});

it('answers 404 for a post id that does not exist', function () {
    $response = $this->get('/chapters/instant-visits/999999');

    $response->assertNotFound();
});
