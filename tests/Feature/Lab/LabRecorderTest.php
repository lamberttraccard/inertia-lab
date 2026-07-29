<?php

use App\Lab\Lab;
use App\Lab\Trace\LabRecorder;
use App\Lab\Trace\SkipReason;
use App\Lab\Trace\TraceCollector;
use Illuminate\Support\Facades\Route;
use Inertia\DevTools\RequestRecorder;
use Inertia\Inertia;

beforeEach(function () {
    config()->set('inertia.devtools.enabled', true);

    Route::middleware('web')->get('/trace-fixture', function (Lab $lab) {
        return Inertia::render('welcome', [
            'title' => $lab->value('title', 'Hello'),
            'body' => $lab->closure('body', fn () => 'resolved'),
            'stats' => $lab->defer('stats', fn () => ['views' => 1], 'dashboard'),
            'extra' => $lab->optional('extra', fn () => 'never on first load'),
        ]);
    });
});

it('binds the lab recorder in place of the package one', function () {
    expect(app(RequestRecorder::class))->toBeInstanceOf(LabRecorder::class);
});

it('separates resolved props from skipped ones with a reason', function () {
    $this->get('/trace-fixture');

    $payload = app(TraceCollector::class)->payload(request());

    expect($payload['enabled'])->toBeTrue()
        ->and(array_keys($payload['props']))->toContain('title', 'body')
        ->and($payload['skipped']['stats']['reason'])->toBe(SkipReason::Deferred->value)
        ->and($payload['skipped']['extra']['reason'])->toBe(SkipReason::Optional->value);
});

it('attributes a partial reload skip to the only filter, not the declared type', function () {
    $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Partial-Component' => 'welcome',
        'X-Inertia-Partial-Data' => 'title',
    ])->get('/trace-fixture');

    $payload = app(TraceCollector::class)->payload(request());

    expect(array_keys($payload['props']))->toBe(['title'])
        ->and($payload['skipped']['body']['reason'])->toBe(SkipReason::NotRequested->value)
        ->and($payload['skipped']['stats']['reason'])->toBe(SkipReason::NotRequested->value)
        ->and($payload['skipped']['extra']['reason'])->toBe(SkipReason::NotRequested->value);
});

it('reports that recording is off rather than returning an empty trace', function () {
    config()->set('inertia.devtools.enabled', false);

    $this->get('/trace-fixture');

    $payload = app(TraceCollector::class)->payload(request());

    expect($payload['enabled'])->toBeFalse()
        ->and($payload['reason'])->toContain('inertia.devtools.enabled');
});
