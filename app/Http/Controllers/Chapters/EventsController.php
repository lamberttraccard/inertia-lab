<?php

namespace App\Http\Controllers\Chapters;

use App\Lab\Chapter;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class EventsController
{
    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('events') ?? throw new RuntimeException('The events chapter is not registered.');

        return Inertia::render('chapters/events', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('events'))),
            'next' => $lab->value('next', self::neighbour($registry->next('events'))),
            'note' => $lab->value('note', 'Watch the Lifecycle tab below while you click each button.'),
        ]);
    }

    /**
     * Thrown before Inertia\ResponseFactory::render() is ever called, so the response the
     * exception handler builds never passes through Inertia\Response::toResponse(), which is
     * the only place that sets the X-Inertia response header. The client's Response class
     * checks that header, not the status code, to decide whether this is an Inertia response
     * at all: lacking it, a 422 built this way is indistinguishable from the non-Inertia route
     * below, and both fire httpException rather than the error event a validation failure
     * routed through session-flashed errors would produce.
     */
    public function unprocessable(): never
    {
        abort(422, 'Deliberate 422 for the events chapter.');
    }

    /** Same mechanism as unprocessable(), a different status, so both land on httpException. */
    public function serverError(): never
    {
        abort(500, 'Deliberate 500 for the events chapter.');
    }

    /**
     * A response that never touches Inertia::render() at all: no X-Inertia header, so the
     * client cannot tell this apart from the two deliberate failures above. All three exist to
     * make that one point rather than three different ones.
     */
    public function nonInertia(): SymfonyResponse
    {
        return response(
            'This route deliberately does not return an Inertia response.',
            200,
            ['Content-Type' => 'text/plain'],
        );
    }

    /** @return array{slug: string, title: string}|null */
    private static function neighbour(?Chapter $chapter): ?array
    {
        return $chapter === null ? null : ['slug' => $chapter->slug, 'title' => $chapter->title];
    }
}
