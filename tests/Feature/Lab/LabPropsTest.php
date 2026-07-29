<?php

use App\Lab\Lab;
use App\Lab\Trace\TraceCollector;
use Inertia\AlwaysProp;
use Inertia\DeferProp;
use Inertia\MergeProp;
use Inertia\OnceProp;
use Inertia\OptionalProp;

it('returns genuine inertia prop objects', function () {
    $lab = app(Lab::class);

    expect($lab->optional('a', fn () => 1))->toBeInstanceOf(OptionalProp::class)
        ->and($lab->defer('b', fn () => 1))->toBeInstanceOf(DeferProp::class)
        ->and($lab->always('c', 1))->toBeInstanceOf(AlwaysProp::class)
        ->and($lab->merge('d', [1]))->toBeInstanceOf(MergeProp::class)
        ->and($lab->once('e', fn () => 1))->toBeInstanceOf(OnceProp::class);
});

it('keeps the value the raw prop would have produced', function () {
    expect((app(Lab::class)->optional('a', fn () => 'value'))())->toBe('value')
        ->and((app(Lab::class)->defer('b', fn () => 'deferred'))())->toBe('deferred');
});

it('preserves the deferred group', function () {
    $prop = app(Lab::class)->defer('stats', fn () => 1, 'dashboard');

    expect($prop->group())->toBe('dashboard');
});

it('records every declared prop with its type', function () {
    $lab = app(Lab::class);
    $lab->value('title', 'Hello');
    $lab->defer('stats', fn () => 1, 'dashboard');

    $declared = app(TraceCollector::class)->declared();

    expect($declared)->toHaveKeys(['title', 'stats'])
        ->and($declared['title']['type'])->toBe('value')
        ->and($declared['stats']['type'])->toBe('defer')
        ->and($declared['stats']['meta']['group'])->toBe('dashboard');
});

it('times a prop only when it is actually resolved', function () {
    $lab = app(Lab::class);
    $prop = $lab->optional('slow', function () {
        usleep(20_000);

        return 1;
    });

    expect(app(TraceCollector::class)->declared()['slow']['ms'])->toBeNull();

    $prop();

    expect(app(TraceCollector::class)->declared()['slow']['ms'])->toBeGreaterThan(15);
});

it('does not invoke callable-shaped strings the way real Inertia would not', function () {
    $prop = app(Lab::class)->always('formatter', 'strtoupper');

    expect($prop())->toBe('strtoupper');
});

it('still times a genuine closure passed to always', function () {
    $prop = app(Lab::class)->always('slow', function () {
        usleep(20_000);

        return 'value';
    });

    expect($prop())->toBe('value')
        ->and(app(TraceCollector::class)->declared()['slow']['ms'])->toBeGreaterThan(15);
});
