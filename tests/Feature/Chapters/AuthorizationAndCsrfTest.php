<?php

use App\Models\Post;
use App\Models\User;

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);

    // Every test starts from the same clean state: no chapter has switched the demo user
    // yet, whatever earlier tests in the same run may have left behind (same precedent as
    // SharedDataTest).
    session()->forget('lab.demo_user_id');
});

it('renders the chapter with the post, the policy-derived can props and the reused switcher props', function () {
    User::factory()->create();

    $response = $this->get(route('chapters.authorization-and-csrf'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled.
    $page = assertInertiaPage($response, 'chapters/authorization-and-csrf');
    $trace = labTrace($response);

    expect($page['props']['post'])->toHaveKeys(['id', 'title', 'authorName'])
        ->and($page['props']['can'])->toHaveKeys(['update', 'delete'])
        ->and($page['props']['demoUser'])->toHaveKeys(['id', 'name', 'email'])
        ->and($page['props']['demoUserOptions'])->toBeArray()
        ->and($trace['props'])->toHaveKeys(['post', 'can', 'demoUser']);
});

it('grants update and delete to the post that belongs to the default demo user', function () {
    User::factory()->create();

    $page = assertInertiaPage($this->get(route('chapters.authorization-and-csrf')), 'chapters/authorization-and-csrf');

    expect($page['props']['can'])->toBe(['update' => true, 'delete' => true]);
});

it('denies update and delete once a different demo user is switched in', function () {
    $users = User::factory()->count(2)->create();

    $this->post(route('chapters.shared-data.switch-user'), ['user_id' => $users[1]->id])
        ->assertRedirect();

    $page = assertInertiaPage($this->get(route('chapters.authorization-and-csrf')), 'chapters/authorization-and-csrf');

    expect($page['props']['can'])->toBe(['update' => false, 'delete' => false])
        ->and($page['props']['post']['authorName'])->toBe($users[0]->name);
});

it('updates the title when the post author renames it', function () {
    User::factory()->create();

    $before = assertInertiaPage($this->get(route('chapters.authorization-and-csrf')), 'chapters/authorization-and-csrf');
    $postId = $before['props']['post']['id'];

    $this->patch("/chapters/authorization-and-csrf/{$postId}", ['title' => 'A renamed title'])
        ->assertRedirect();

    expect(Post::query()->findOrFail($postId)->title)->toBe('A renamed title');
});

it('rejects a rename from a non-author with 403 and leaves the title unchanged', function () {
    $users = User::factory()->count(2)->create();

    $before = assertInertiaPage($this->get(route('chapters.authorization-and-csrf')), 'chapters/authorization-and-csrf');
    $postId = $before['props']['post']['id'];
    $originalTitle = $before['props']['post']['title'];

    $this->post(route('chapters.shared-data.switch-user'), ['user_id' => $users[1]->id]);

    $this->patch("/chapters/authorization-and-csrf/{$postId}", ['title' => 'Should not stick'])
        ->assertForbidden();

    expect(Post::query()->findOrFail($postId)->title)->toBe($originalTitle);
});

it('rejects a delete from a non-author with 403 and keeps the row', function () {
    $users = User::factory()->count(2)->create();

    $before = assertInertiaPage($this->get(route('chapters.authorization-and-csrf')), 'chapters/authorization-and-csrf');
    $postId = $before['props']['post']['id'];

    $this->post(route('chapters.shared-data.switch-user'), ['user_id' => $users[1]->id]);

    $this->delete("/chapters/authorization-and-csrf/{$postId}")->assertForbidden();

    expect(Post::query()->find($postId))->not->toBeNull();
});

it('deletes and immediately recreates the demo post when its author deletes it', function () {
    User::factory()->create();

    $before = assertInertiaPage($this->get(route('chapters.authorization-and-csrf')), 'chapters/authorization-and-csrf');
    $postId = $before['props']['post']['id'];

    $this->delete("/chapters/authorization-and-csrf/{$postId}")->assertRedirect();

    expect(Post::query()->find($postId))->toBeNull();

    $after = assertInertiaPage($this->get(route('chapters.authorization-and-csrf')), 'chapters/authorization-and-csrf');

    expect($after['props']['post']['id'])->not->toBe($postId)
        ->and($after['props']['can'])->toBe(['update' => true, 'delete' => true]);
});

it('answers a bad CSRF token on the rename route with a 419 and leaves the title unchanged', function () {
    User::factory()->create();

    $before = assertInertiaPage($this->get(route('chapters.authorization-and-csrf')), 'chapters/authorization-and-csrf');
    $postId = $before['props']['post']['id'];
    $originalTitle = $before['props']['post']['title'];

    // PreventRequestForgery::runningUnitTests() short-circuits CSRF verification whenever
    // app()->runningInConsole() && app()->runningUnitTests() both hold, which they do for
    // every test in this suite by default (verified in vendor/laravel/framework/src/
    // Illuminate/Foundation/Http/Middleware/PreventRequestForgery.php, and while writing
    // chapter 29's own test for the same 419). Overriding the 'env' container binding
    // disables that bypass for this one request, so it hits the real token check instead.
    app()->instance('env', 'local');

    $this->patch("/chapters/authorization-and-csrf/{$postId}", ['title' => 'Should not stick either'])
        ->assertStatus(419);

    expect(Post::query()->findOrFail($postId)->title)->toBe($originalTitle);
});
