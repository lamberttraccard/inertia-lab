<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Requests\Chapters\PrecognitionPostRequest;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class PrecognitionController
{
    use ResolvesNeighbours;

    // The reader picks the slug, which is the entire point of this chapter, so unlike
    // chapters 17 and 18 this row cannot be found again by a fixed slug of its own. This
    // marker in excerpt (never shown to the reader, never itself validated) is what
    // identifies and replaces it instead, keeping this chapter's real submissions bounded
    // to one row exactly the way the other two mutating chapters are.
    private const DEMO_MARKER = 'Created by the chapters/precognition demo. Safe to delete; the next submission replaces it.';

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('precognition') ?? throw new RuntimeException('The precognition chapter is not registered.');

        return Inertia::render('chapters/precognition', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('precognition'))),
            'next' => $lab->value('next', self::neighbour($registry->next('precognition'))),
        ]);
    }

    /**
     * Only a genuine, non-precognitive request ever runs this far. Resolving
     * PrecognitionPostRequest validates every request that reaches this route, precognitive
     * or not, since that happens during parameter resolution; what actually gates the body
     * is Illuminate\Foundation\Routing\PrecognitionControllerDispatcher, which aborts before
     * calling it only when the request is precognitive, leaving a genuine request's own
     * dispatcher to call it normally.
     */
    public function store(PrecognitionPostRequest $request): RedirectResponse
    {
        /** @var array{title: string, slug: string} $validated */
        $validated = $request->validated();

        Post::query()->where('excerpt', self::DEMO_MARKER)->delete();

        Post::create([
            'user_id' => HandleInertiaRequests::currentDemoUser()->id,
            'title' => $validated['title'],
            'slug' => $validated['slug'],
            'excerpt' => self::DEMO_MARKER,
            'body' => self::DEMO_MARKER,
            'published_at' => now(),
        ]);

        return redirect()->route('chapters.precognition');
    }
}
