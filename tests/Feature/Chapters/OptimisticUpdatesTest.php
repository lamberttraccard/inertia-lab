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
    $response = $this->get(route('chapters.optimistic-updates'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled.
    $page = assertInertiaPage($response, 'chapters/optimistic-updates');
    $trace = labTrace($response);

    expect($page['props']['reliable'])->toBe(['label' => 'A post you can really like', 'likes' => 0, 'likedByMe' => false])
        ->and($page['props']['unreliable'])->toBe(['label' => 'A post that never accepts a like', 'likes' => 12, 'likedByMe' => false])
        ->and($trace['props'])->toHaveKeys(['reliable', 'unreliable']);
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
