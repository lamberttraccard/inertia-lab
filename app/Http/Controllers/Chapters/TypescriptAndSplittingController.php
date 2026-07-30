<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class TypescriptAndSplittingController
{
    use ResolvesNeighbours;

    private const SOURCE_PATH = 'resources/js/pages/chapters/typescript-and-splitting.tsx';

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('typescript-and-splitting') ?? throw new RuntimeException('The typescript-and-splitting chapter is not registered.');

        return Inertia::render('chapters/typescript-and-splitting', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('typescript-and-splitting'))),
            'next' => $lab->value('next', self::neighbour($registry->next('typescript-and-splitting'))),
            // Read from the real build manifest rather than described in the abstract, so
            // the page reports what code splitting actually did for its own chunk, on
            // this exact build, instead of a claim the reader has to take on faith.
            'buildInfo' => $lab->value('buildInfo', self::buildInfo()),
        ]);
    }

    /**
     * @return array{available: bool, file?: string, isDynamicEntry?: bool, bytes?: int|null, importsCount?: int}
     */
    private static function buildInfo(): array
    {
        $manifestPath = public_path('build/manifest.json');

        if (! is_file($manifestPath)) {
            return ['available' => false];
        }

        $manifest = json_decode((string) file_get_contents($manifestPath), true, 512, JSON_THROW_ON_ERROR);
        $entry = is_array($manifest) ? ($manifest[self::SOURCE_PATH] ?? null) : null;

        if (! is_array($entry) || ! is_string($entry['file'] ?? null)) {
            return ['available' => false];
        }

        $assetPath = public_path('build/'.$entry['file']);
        $bytes = is_file($assetPath) ? filesize($assetPath) : false;

        return [
            'available' => true,
            'file' => $entry['file'],
            'isDynamicEntry' => (bool) ($entry['isDynamicEntry'] ?? false),
            'bytes' => $bytes !== false ? $bytes : null,
            'importsCount' => is_array($entry['imports'] ?? null) ? count($entry['imports']) : 0,
        ];
    }
}
