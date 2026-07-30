<?php

use Database\Seeders\LabSeeder;

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);

    // Real pagination needs real rows: 2000 comments and 120 posts give both feeds more
    // than one page to work with, which an empty database never would.
    $this->seed(LabSeeder::class);
});

it('renders the chapter with the first page of comments and the post digest resolved on a full load', function () {
    $response = $this->get(route('chapters.merging-props'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled.
    $page = assertInertiaPage($response, 'chapters/merging-props');
    $trace = labTrace($response);

    expect($page['props']['chapter']['question'])->not->toBeEmpty()
        ->and($page['props']['comments'])->toHaveCount(20)
        ->and($page['props']['commentsHasMore'])->toBeTrue()
        ->and($page['props']['commentsPerPage'])->toBe(20)
        ->and($page['props']['postDigest']['items'])->toHaveCount(5)
        ->and($page['props']['digestPerPage'])->toBe(5)
        ->and($page['props']['usingDeepMerge'])->toBeFalse()
        ->and($page['mergeProps'])->toContain('comments')
        ->and($page['mergeProps'])->toContain('postDigest')
        ->and($page)->not->toHaveKey('deepMergeProps')
        ->and($page['matchPropsOn'])->toContain('comments.id')
        ->and($trace['props'])->toHaveKeys(['comments', 'commentsHasMore', 'postDigest']);
});

it('returns a different page of comments on the next request while still marking it mergeable', function () {
    $firstIds = array_column(inertiaPage($this->get(route('chapters.merging-props')))['props']['comments'], 'id');

    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Partial-Component' => 'chapters/merging-props',
        'X-Inertia-Partial-Data' => 'comments,commentsHasMore',
    ])->get(route('chapters.merging-props', ['commentsPage' => 2]));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/merging-props');
    $secondIds = array_column($page['props']['comments'], 'id');

    expect($page['props']['comments'])->toHaveCount(20)
        ->and(array_intersect($firstIds, $secondIds))->toBeEmpty()
        ->and($page['mergeProps'])->toContain('comments');
});

it('drops the merge metadata for comments and returns the first page again when reset names it', function () {
    $first = inertiaPage($this->get(route('chapters.merging-props')))['props']['comments'];

    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Partial-Component' => 'chapters/merging-props',
        'X-Inertia-Partial-Data' => 'comments,commentsHasMore',
        'X-Inertia-Reset' => 'comments',
    ])->get(route('chapters.merging-props', ['commentsPage' => 1]));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/merging-props');

    expect(array_column($page['props']['comments'], 'id'))->toBe(array_column($first, 'id'))
        ->and($page)->not->toHaveKey('mergeProps');
});

it('wraps the post digest with deepMerge instead of merge once the deep flag is set', function () {
    // usingDeepMerge is named here too, matching what loadMoreDigest() actually sends: the
    // chapter's own prose reads this prop back, so a request that forgets to name it would
    // leave that prose reporting a stale answer, which is exactly the bug this test guards.
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Partial-Component' => 'chapters/merging-props',
        'X-Inertia-Partial-Data' => 'postDigest,usingDeepMerge',
    ])->get(route('chapters.merging-props', ['deep' => 1, 'digestPage' => 1]));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/merging-props');

    expect($page['props']['usingDeepMerge'])->toBeTrue()
        ->and($page['deepMergeProps'])->toContain('postDigest')
        ->and($page['mergeProps'] ?? [])->not->toContain('postDigest');
});

it('leaves usingDeepMerge unresolved and absent from props when a reload does not name it', function () {
    // This is the exact defect the fix round caught: without naming usingDeepMerge, the
    // client keeps whatever value it already held for it, and the chapter's prose describing
    // which factory is active would silently go stale after the very first load.
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
        'X-Inertia-Partial-Component' => 'chapters/merging-props',
        'X-Inertia-Partial-Data' => 'postDigest',
    ])->get(route('chapters.merging-props', ['deep' => 1, 'digestPage' => 1]));

    $response->assertOk();

    $page = assertInertiaPage($response, 'chapters/merging-props');
    $trace = labTrace($response);

    expect($page['props'])->not->toHaveKey('usingDeepMerge')
        ->and($page['deepMergeProps'])->toContain('postDigest')
        ->and($trace['skipped']['usingDeepMerge']['reason'])->toBe('not requested by only');
});
