<?php

use App\Lab\Lab;
use App\Lab\SlowMode;
use App\Lab\Trace\TraceCollector;

it('defaults to no artificial delay', function () {
    expect(app(SlowMode::class)->delayMs())->toBe(0);
});

it('delays prop resolution and reports the delay separately from real time', function () {
    app(SlowMode::class)->set(50);

    $prop = app(Lab::class)->optional('slow', fn () => 'value');
    $prop();

    $entry = app(TraceCollector::class)->declared()['slow'];

    expect($entry['ms'])->toBeGreaterThan(45)
        ->and($entry['delayMs'])->toBe(50);
});

it('accepts a delay through the toggle route and redirects back', function () {
    $this->from('/')->post('/lab/slow-mode', ['ms' => 200])->assertRedirect('/');

    expect(app(SlowMode::class)->delayMs())->toBe(200);
});
