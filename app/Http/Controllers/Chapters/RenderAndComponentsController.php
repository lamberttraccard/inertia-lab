<?php

namespace App\Http\Controllers\Chapters;

use App\Lab\Chapter;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class RenderAndComponentsController
{
    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('render-and-components') ?? throw new RuntimeException('The render-and-components chapter is not registered.');

        return Inertia::render('chapters/render-and-components', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('render-and-components'))),
            'next' => $lab->value('next', self::neighbour($registry->next('render-and-components'))),
            'resolvedComponent' => $lab->value('resolvedComponent', 'chapters/render-and-components'),
            'pagesRoot' => $lab->value('pagesRoot', 'resources/js/pages'),
        ]);
    }

    /**
     * This app's own config/inertia.php declares its own 'pages' array with only 'paths' and
     * 'extensions', so Laravel's shallow config merge drops the package's 'ensure_pages_exist'
     * default entirely rather than keeping it: config('inertia.pages.ensure_pages_exist')
     * reads null here, and ResponseFactory::render() treats that as false. Forcing it on for
     * this one request is what makes findComponentOrFail() actually run, so the reader sees
     * the framework's real check instead of a description of it.
     */
    public function broken(): Response
    {
        config(['inertia.pages.ensure_pages_exist' => true]);

        return Inertia::render('chapters/this-page-does-not-exist', []);
    }

    /** @return array{slug: string, title: string}|null */
    private static function neighbour(?Chapter $chapter): ?array
    {
        return $chapter === null ? null : ['slug' => $chapter->slug, 'title' => $chapter->title];
    }
}
