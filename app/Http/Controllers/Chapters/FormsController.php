<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Http\Middleware\HandleInertiaRequests;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use App\Models\Post;
use App\Models\Tag;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class FormsController
{
    use ResolvesNeighbours;

    // Fixed so the Form example and the useForm example edit the same one row instead
    // of each submission adding another: the lesson is the two ways of submitting, not
    // an ever-growing list of demo posts in a table every other chapter also reads.
    private const DEMO_SLUG = 'lab-demo-forms-post';

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('forms') ?? throw new RuntimeException('The forms chapter is not registered.');

        $post = Post::query()->where('slug', self::DEMO_SLUG)->with('tags:id')->first();

        $postProp = $post === null
            ? ['title' => '', 'excerpt' => '', 'body' => '', 'tags' => []]
            : [
                'title' => $post->title,
                'excerpt' => $post->excerpt,
                'body' => $post->body,
                'tags' => $post->tags->pluck('id')->all(),
            ];

        return Inertia::render('chapters/forms', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('forms'))),
            'next' => $lab->value('next', self::neighbour($registry->next('forms'))),
            'post' => $lab->value('post', $postProp),
            'tagOptions' => $lab->value('tagOptions', Tag::query()->orderBy('name')->get(['id', 'name'])->all()),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        /** @var array{title: string, excerpt: string, body: string, tags?: array<int, int>} $validated */
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'excerpt' => ['required', 'string', 'max:300'],
            'body' => ['required', 'string', 'min:20', 'max:2000'],
            'tags' => ['sometimes', 'array'],
            'tags.*' => ['integer', 'exists:tags,id'],
        ]);

        $post = Post::query()->updateOrCreate(
            ['slug' => self::DEMO_SLUG],
            [
                'user_id' => HandleInertiaRequests::currentDemoUser()->id,
                'title' => $validated['title'],
                'excerpt' => $validated['excerpt'],
                'body' => $validated['body'],
                'published_at' => now(),
            ]
        );

        $post->tags()->sync($validated['tags'] ?? []);

        return redirect()->route('chapters.forms');
    }
}
