<?php

use Database\Seeders\LabSeeder;

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);

    $this->seed(LabSeeder::class);
});

it('renders the chapter with the shared unread count resolved on a full load', function () {
    $response = $this->get(route('chapters.polling'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled.
    $page = assertInertiaPage($response, 'chapters/polling');

    expect($page['props']['chapter']['question'])->not->toBeEmpty()
        ->and($page['props']['unreadNotifications'])->toBeInt();
});

it('resolves only unreadNotifications on a polled partial reload', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Partial-Component' => 'chapters/polling',
        'X-Inertia-Partial-Data' => 'unreadNotifications',
    ])->get(route('chapters.polling'));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/polling');
    $trace = labTrace($response);

    expect($page['props'])->toHaveKey('unreadNotifications')
        ->and($page['props'])->not->toHaveKeys(['chapter', 'previous', 'next'])
        ->and($trace['props'])->toHaveKey('unreadNotifications')
        ->and($trace['skipped']['chapter']['reason'])->toBe('not requested by only');
});

it('increments the unread count that a follow-up poll would pick up after simulating a notification', function () {
    $before = inertiaPage($this->get(route('chapters.polling')))['props']['unreadNotifications'];

    $this->post(route('chapters.polling.simulate'))->assertRedirect();

    $after = inertiaPage($this->get(route('chapters.polling')))['props']['unreadNotifications'];

    expect($after)->toBe($before + 1);
});
