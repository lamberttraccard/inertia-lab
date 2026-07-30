<?php

use App\Models\Post;
use App\Models\User;

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);
});

it('renders the chapter with the full list and its teaching metadata', function () {
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

    $response = $this->get(route('chapters.remembering-state'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled.
    $page = assertInertiaPage($response, 'chapters/remembering-state');
    $trace = labTrace($response);

    expect($page['props']['chapter']['question'])->not->toBeEmpty()
        ->and($page['props']['filter'])->toBe('')
        ->and($page['props']['posts'])->toHaveCount(2)
        ->and($trace['props'])->toHaveKeys(['posts', 'filter']);
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

it('renders the detail route normally, with its own post prop resolved', function () {
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

    $response = $this->get(route('chapters.remembering-state.detail', $post));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/remembering-state-detail');
    $trace = labTrace($response);

    expect($page['props']['post'])->toBe([
        'id' => $post->id,
        'title' => $post->title,
        'excerpt' => $post->excerpt,
    ])->and($trace['props'])->toHaveKey('post');
});
