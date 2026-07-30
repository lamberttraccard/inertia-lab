<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class ErrorHandlingController
{
    use ResolvesNeighbours;

    private const STATUS_KEY = 'lab.error_handling_status';

    private const STATUS_DEFAULT = 'No protected action attempted yet. Use the button below.';

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('error-handling') ?? throw new RuntimeException('The error-handling chapter is not registered.');

        return Inertia::render('chapters/error-handling', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('error-handling'))),
            'next' => $lab->value('next', self::neighbour($registry->next('error-handling'))),
            'status' => $lab->value('status', session(self::STATUS_KEY, self::STATUS_DEFAULT)),
        ]);
    }

    /**
     * Reached only when the request carries a valid CSRF token: PreventRequestForgery sits
     * earlier in the web middleware group than HandleInertiaRequests (verified in
     * bootstrap/app.php, which appends HandleInertiaRequests after the framework's default
     * web group), so a mismatched token throws before this action, or any Inertia-specific
     * middleware, ever runs.
     */
    public function protectedAction(): RedirectResponse
    {
        session()->flash(self::STATUS_KEY, 'The action succeeded: this request carried a valid CSRF token.');

        return back();
    }

    /** A deliberate, real 500, thrown from inside a matched route's controller. */
    public function crash(): never
    {
        abort(500, 'Deliberate 500 for the error-handling chapter.');
    }

    /**
     * A response that never touches Inertia::render(): no X-Inertia header, so the client
     * shows it in the same error dialog chapter 5's non-Inertia route already demonstrates.
     * Inertia::handleExceptionsUsing() has nothing to do with this response, since nothing
     * here throws: there is no exception for it to intercept.
     */
    public function plain(): SymfonyResponse
    {
        return response(
            'This route deliberately does not return an Inertia response.',
            200,
            ['Content-Type' => 'text/plain'],
        );
    }
}
