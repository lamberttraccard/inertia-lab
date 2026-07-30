<?php

use App\Models\Post;
use App\Models\User;

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);
});

it('renders the chapter with the full list, its teaching metadata and no unexpected props', function () {
    $author = User::factory()->create();
    Post::create([
        'user_id' => $author->id,
        'title' => 'Learning Inertia the hard way',
        'slug' => 'learning-inertia-the-hard-way',
        'excerpt' => 'A post about the protocol.',
        'body' => str_repeat('Body content. ', 30),
        'published_at' => now(),
        'views' => 10,
    ]);
    Post::create([
        'user_id' => $author->id,
        'title' => 'A completely unrelated recipe',
        'slug' => 'a-completely-unrelated-recipe',
        'excerpt' => 'A post about soup.',
        'body' => str_repeat('Body content. ', 30),
        'published_at' => now(),
        'views' => 5,
    ]);

    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get(route('chapters.remembering-state'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled.
    $page = assertInertiaPage($response, 'chapters/remembering-state');
    $trace = labTrace($response);

    expect($page['props']['chapter']['question'])->not->toBeEmpty()
        ->and($page['props']['filter'])->toBe('')
        ->and($page['props']['posts'])->toHaveCount(2);

    // Verified empirically against this exact route (see the debug trace taken from
    // chapters/first-load-vs-visit for the shared baseline): errors, name, auth,
    // demoUser, unreadNotifications and demoUserOptions are the platform's own shared
    // props, added to every page regardless of this chapter; chapter, previous and next
    // are the standard chapter metadata every chapter passes; filter and posts are this
    // chapter's own. A controller that stopped wrapping chapter, previous or next in
    // Lab::value() would still pass a bare toBeEmpty() check on a nested field, but not
    // this one, the same defect class chapters 17 and 18 needed a dedicated fix commit
    // for.
    expect(array_keys($page['props']))->toEqualCanonicalizing([
        'errors', 'name', 'auth', 'demoUser', 'unreadNotifications', 'demoUserOptions',
        'chapter', 'previous', 'next', 'filter', 'posts', '_lab',
    ])
        ->and(array_keys($trace['props']))->toEqualCanonicalizing([
            'demoUser', 'unreadNotifications', 'demoUserOptions',
            'chapter', 'previous', 'next', 'filter', 'posts',
        ]);
});

it('filters the list server side when a filter query parameter is present', function () {
    $author = User::factory()->create();
    Post::create([
        'user_id' => $author->id,
        'title' => 'Learning Inertia the hard way',
        'slug' => 'learning-inertia-the-hard-way',
        'excerpt' => 'A post about the protocol.',
        'body' => str_repeat('Body content. ', 30),
        'published_at' => now(),
        'views' => 10,
    ]);
    Post::create([
        'user_id' => $author->id,
        'title' => 'A completely unrelated recipe',
        'slug' => 'a-completely-unrelated-recipe',
        'excerpt' => 'A post about soup.',
        'body' => str_repeat('Body content. ', 30),
        'published_at' => now(),
        'views' => 5,
    ]);

    $response = $this->get(route('chapters.remembering-state', ['filter' => 'Inertia']));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/remembering-state');

    expect($page['props']['filter'])->toBe('Inertia')
        ->and($page['props']['posts'])->toHaveCount(1)
        ->and($page['props']['posts'][0]['title'])->toBe('Learning Inertia the hard way');
});

it('renders the detail route normally, with its own post prop resolved and nothing else', function () {
    $author = User::factory()->create();
    $post = Post::create([
        'user_id' => $author->id,
        'title' => 'Learning Inertia the hard way',
        'slug' => 'learning-inertia-the-hard-way',
        'excerpt' => 'A post about the protocol.',
        'body' => str_repeat('Body content. ', 30),
        'published_at' => now(),
        'views' => 10,
    ]);

    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get(route('chapters.remembering-state.detail', $post));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/remembering-state-detail');
    $trace = labTrace($response);

    expect($page['props']['post'])->toBe([
        'id' => $post->id,
        'title' => $post->title,
        'excerpt' => $post->excerpt,
    ]);

    // Not a registered chapter (see the docblock on RememberingStateController::detail):
    // it renders outside ChapterShell, so chapter, previous and next never reach it, the
    // same as the two panel routes in the layouts chapter. post is its only own prop.
    expect(array_keys($page['props']))->toEqualCanonicalizing([
        'errors', 'name', 'auth', 'demoUser', 'unreadNotifications', 'demoUserOptions',
        'post', '_lab',
    ])
        ->and(array_keys($trace['props']))->toEqualCanonicalizing([
            'demoUser', 'unreadNotifications', 'demoUserOptions', 'post',
        ]);
});
