<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class AlwaysPropsController
{
    use ResolvesNeighbours;

    private const FLASH_KEY = 'lab.always_props_flash';

    private const FLASH_DEFAULT = 'No flash message sent yet. Use the button below.';

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('always-props') ?? throw new RuntimeException('The always-props chapter is not registered.');

        return Inertia::render('chapters/always-props', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('always-props'))),
            'next' => $lab->value('next', self::neighbour($registry->next('always-props'))),
            'normal' => $lab->closure('normal', fn () => now()->toIso8601String()),
            'notice' => $lab->always('notice', fn () => 'A banner wrapped in Inertia::always(): present on every response to this page.'),
            // A real session flash, the same mechanism Laravel's own validation errors and
            // redirect banners rely on: readable for exactly one request after this one,
            // then gone (verified in vendor/laravel/framework's Session\Store::flash() and
            // ageFlashData()). That is exactly why it needs Inertia::always() as much as
            // errors does: without it, a partial reload naming a prop other than status
            // would drop the message before the reader ever saw it.
            'status' => $lab->always('status', fn () => session(self::FLASH_KEY, self::FLASH_DEFAULT)),
        ]);
    }

    public function flash(): RedirectResponse
    {
        session()->flash(self::FLASH_KEY, 'Flashed at '.now()->toIso8601String().'.');

        return back();
    }
}
