<?php

namespace App\Http\Controllers\Chapters\Concerns;

use App\Lab\Chapter;

trait ResolvesNeighbours
{
    /** @return array{slug: string, title: string}|null */
    private static function neighbour(?Chapter $chapter): ?array
    {
        return $chapter === null ? null : ['slug' => $chapter->slug, 'title' => $chapter->title];
    }
}
