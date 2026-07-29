<?php

use App\Lab\Lab;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

beforeEach(function () {
    config()->set('inertia.devtools.enabled', true);

    Route::middleware('web')->get('/trace-fixture', fn (Lab $lab) => Inertia::render('welcome', [
        'title' => $lab->value('title', 'Hello'),
    ]));
});

it('injects the trace into the initial html document', function () {
    $response = $this->get('/trace-fixture');

    $response->assertOk();
    expect($response->getContent())->toContain('<script id="lab-trace" type="application/json">');
});

it('injects the trace into an inertia json response', function () {
    $response = $this->withHeaders(['X-Inertia' => 'true', 'X-Inertia-Version' => currentInertiaVersion()])->get('/trace-fixture');

    $response->assertOk();
    expect($response->json('props._lab.enabled'))->toBeTrue()
        ->and($response->json('props._lab.props'))->toHaveKey('title');
});

it('leaves non inertia responses untouched', function () {
    Route::middleware('web')->get('/plain', fn () => response('plain body'));

    expect($this->get('/plain')->getContent())->toBe('plain body');
});
