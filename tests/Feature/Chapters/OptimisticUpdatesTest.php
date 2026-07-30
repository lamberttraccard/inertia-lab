<?php

use App\Models\Like;
use App\Models\User;

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);

    // HandleInertiaRequests::currentDemoUser() falls back to an unpersisted placeholder
    // (id 0) when the users table is empty, which posts.user_id's foreign key rejects: a
    // real demo user is exactly what every other write-path chapter test already seeds.
    User::factory()->create();
});

it('renders the chapter with a real reliable card and a fixed unreliable card', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get(route('chapters.optimistic-updates'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled.
    $page = assertInertiaPage($response, 'chapters/optimistic-updates');
    $trace = labTrace($response);

    // Verified empirically against this exact route (see the debug trace taken from
    // chapters/first-load-vs-visit for the shared baseline): errors, name, auth, demoUser,
    // unreadNotifications and demoUserOptions are the platform's own shared props, added to
    // every page regardless of this chapter; chapter, previous and next are the standard
    // chapter metadata every chapter passes.
    expect(array_keys($page['props']))->toEqualCanonicalizing([
        'errors', 'name', 'auth', 'demoUser', 'unreadNotifications', 'demoUserOptions',
        'chapter', 'previous', 'next', 'reliable', 'unreliable', '_lab',
    ])
        ->and(array_keys($trace['props']))->toEqualCanonicalizing([
            'demoUser', 'unreadNotifications', 'demoUserOptions', 'chapter', 'previous', 'next',
            'reliable', 'unreliable',
        ])
        ->and($page['props']['reliable'])->toBe(['label' => 'A post you can really like', 'likes' => 0, 'likedByMe' => false])
        ->and($page['props']['unreliable'])->toBe(['label' => 'A post that never accepts a like', 'likes' => 12, 'likedByMe' => false]);
});

it('persists a like on the reliable endpoint and removes it again on a second toggle', function () {
    expect(Like::query()->count())->toBe(0);

    $this->post(route('chapters.optimistic-updates.like'))->assertRedirect();

    expect(Like::query()->count())->toBe(1);

    $reload = $this->get(route('chapters.optimistic-updates'));
    $page = assertInertiaPage($reload, 'chapters/optimistic-updates');

    expect($page['props']['reliable']['likes'])->toBe(1)
        ->and($page['props']['reliable']['likedByMe'])->toBeTrue();

    $this->post(route('chapters.optimistic-updates.like'))->assertRedirect();

    expect(Like::query()->count())->toBe(0);
});

it('answers 422 on the unreliable endpoint and never persists a like', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->post(route('chapters.optimistic-updates.like-unreliable'));

    $response->assertStatus(422);
    expect($response->headers->has('X-Inertia'))->toBeFalse()
        ->and(Like::query()->count())->toBe(0);
});
