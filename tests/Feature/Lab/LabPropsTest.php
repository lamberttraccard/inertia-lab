<?php

use App\Lab\Lab;
use App\Lab\Trace\TraceCollector;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Route;
use Inertia\AlwaysProp;
use Inertia\DeferProp;
use Inertia\Inertia;
use Inertia\MergeProp;
use Inertia\OnceProp;
use Inertia\OptionalProp;
use Inertia\ScrollProp;

it('returns genuine inertia prop objects', function () {
    $lab = app(Lab::class);

    expect($lab->optional('a', fn () => 1))->toBeInstanceOf(OptionalProp::class)
        ->and($lab->defer('b', fn () => 1))->toBeInstanceOf(DeferProp::class)
        ->and($lab->always('c', 1))->toBeInstanceOf(AlwaysProp::class)
        ->and($lab->merge('d', [1]))->toBeInstanceOf(MergeProp::class)
        ->and($lab->once('e', fn () => 1))->toBeInstanceOf(OnceProp::class)
        ->and($lab->deepMerge('f', [1]))->toBeInstanceOf(MergeProp::class)
        ->and($lab->scroll('g', fn () => 1))->toBeInstanceOf(ScrollProp::class);
});

it('marks a deep merge prop as such while a plain merge prop stays shallow', function () {
    $lab = app(Lab::class);

    expect($lab->merge('a', [1])->shouldDeepMerge())->toBeFalse()
        ->and($lab->deepMerge('b', [1])->shouldDeepMerge())->toBeTrue();

    $declared = app(TraceCollector::class)->declared();

    expect($declared['a']['type'])->toBe('merge')
        ->and($declared['b']['type'])->toBe('deepMerge');
});

it('wraps a paginator and exposes the scroll metadata Inertia derives from it', function () {
    // A real paginator, not a stub: ScrollProp::metadata() calls ScrollMetadata::fromPaginator(),
    // which throws InvalidArgumentException for anything that is not one of Laravel's own
    // paginator classes (verified in vendor/inertiajs/inertia-laravel/src/ScrollMetadata.php).
    $paginator = new LengthAwarePaginator(items: [1, 2, 3], total: 30, perPage: 10, currentPage: 2);

    $prop = app(Lab::class)->scroll('posts', fn () => $paginator, 'rows');

    expect($prop())->toBe($paginator)
        ->and($prop->metadata())->toBe([
            'pageName' => 'page',
            'previousPage' => 1,
            'nextPage' => 3,
            'currentPage' => 2,
        ])
        ->and(app(TraceCollector::class)->declared()['posts']['meta'])->toBe(['wrapper' => 'rows']);
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

it('resolves a prop closure through the container the way real Inertia resolves callables', function () {
    Route::middleware('web')->get('/di-fixture', fn (Lab $lab) => Inertia::render('welcome', [
        'agent' => $lab->closure('agent', fn (Request $request) => $request->getRequestUri()),
    ]));

    $response = $this->withHeaders(['X-Inertia' => 'true', 'X-Inertia-Version' => currentInertiaVersion()])->get('/di-fixture');

    $response->assertOk();
    expect($response->json('props.agent'))->toBe('/di-fixture');
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
