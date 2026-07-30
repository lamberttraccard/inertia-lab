<?php

use App\Models\Notification;
use App\Models\User;

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);

    // Every test starts from the same clean state: no chapter has switched the demo user
    // yet, whatever earlier tests in the same run may have left behind.
    session()->forget('lab.demo_user_id');
});

it('renders the chapter with the shared props every page gets, not just this one', function () {
    $response = $this->get(route('chapters.shared-data'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled.
    $page = assertInertiaPage($response, 'chapters/shared-data');
    $trace = labTrace($response);

    expect($page['props']['demoUser'])->toHaveKeys(['id', 'name', 'email'])
        ->and($page['props']['unreadNotifications'])->toBeInt()
        ->and($page['props']['demoUserOptions'])->toBeArray()
        ->and($page['sharedProps'])->toContain('demoUser', 'unreadNotifications', 'demoUserOptions')
        ->and($trace['props'])->toHaveKeys(['demoUser', 'unreadNotifications']);
});

it('shares the same demo user and notification count on a route that has nothing to do with this chapter', function () {
    $response = $this->get(route('chapters.mental-model'));

    $response->assertOk();
    $page = assertInertiaPage($response, 'chapters/mental-model');

    expect($page['props'])->toHaveKeys(['demoUser', 'unreadNotifications'])
        ->and($page['sharedProps'])->toContain('demoUser', 'unreadNotifications');
});

it('changes the shared demo user and notification count everywhere once the switcher posts', function () {
    $users = User::factory()->count(2)->create();
    Notification::create(['user_id' => $users[1]->id, 'type' => 'comment', 'data' => [], 'read_at' => null]);

    $before = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get(route('chapters.shared-data'));
    $beforeId = $before->json('props.demoUser.id');

    $this->post(route('chapters.shared-data.switch-user'), ['user_id' => $users[1]->id])
        ->assertRedirect();

    $after = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get(route('chapters.shared-data'));

    expect($after->json('props.demoUser.id'))->toBe($users[1]->id)
        ->and($after->json('props.demoUser.id'))->not->toBe($beforeId)
        ->and($after->json('props.unreadNotifications'))->toBe(1);
});

it('ignores a switch request naming a user id that does not exist', function () {
    $this->post(route('chapters.shared-data.switch-user'), ['user_id' => 999999])
        ->assertRedirect();

    expect(session('lab.demo_user_id'))->toBeNull();
});

it('skips the demo user on a partial reload that only asks for unreadNotifications, since shared props follow the same only filter as any other prop', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Partial-Component' => 'chapters/shared-data',
        'X-Inertia-Partial-Data' => 'unreadNotifications',
    ])->get(route('chapters.shared-data'));

    $response->assertOk();
    $page = assertInertiaPage($response, 'chapters/shared-data');
    $trace = labTrace($response);

    expect($page['props'])->toHaveKey('unreadNotifications')
        ->and($page['props'])->not->toHaveKey('demoUser')
        ->and($trace['props'])->toHaveKey('unreadNotifications')
        ->and($trace['skipped'])->toHaveKey('demoUser');
});
