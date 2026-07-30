<?php

namespace App\Http\Controllers\Chapters;

use App\Lab\Chapter;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class RedirectsController
{
    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('redirects') ?? throw new RuntimeException('The redirects chapter is not registered.');

        return Inertia::render('chapters/redirects', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('redirects'))),
            'next' => $lab->value('next', self::neighbour($registry->next('redirects'))),
            'lastAction' => $lab->value('lastAction', session('lab.last_action', 'none')),
        ]);
    }

    public function post(): RedirectResponse
    {
        session()->flash('lab.last_action', 'post');

        return back();
    }

    public function delete(): RedirectResponse
    {
        session()->flash('lab.last_action', 'delete');

        return back();
    }

    /**
     * A visit to a URL outside this app. Inertia\ResponseFactory::location() branches on
     * whether the request carries the X-Inertia header: a genuine visit gets a bare 409 with
     * X-Inertia-Location, which the client reads as an instruction to set window.location
     * itself; anything else (a plain browser navigation) gets an ordinary redirect away, so
     * there is no flash to read back on return, because there is no return.
     */
    public function location(): SymfonyResponse
    {
        return Inertia::location('https://inertiajs.com/docs/v3/the-basics/redirects');
    }

    /** @return array{slug: string, title: string}|null */
    private static function neighbour(?Chapter $chapter): ?array
    {
        return $chapter === null ? null : ['slug' => $chapter->slug, 'title' => $chapter->title];
    }
}
