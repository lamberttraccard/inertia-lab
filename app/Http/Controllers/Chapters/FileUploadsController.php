<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Http\Middleware\HandleInertiaRequests;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class FileUploadsController
{
    use ResolvesNeighbours;

    // Fixed so every upload replaces the same one row's cover instead of each submission
    // creating another post: the lesson is the upload itself, not an ever-growing table.
    private const DEMO_SLUG = 'lab-demo-file-uploads-post';

    private const DISK = 'public';

    private const DIRECTORY = 'covers';

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('file-uploads') ?? throw new RuntimeException('The file-uploads chapter is not registered.');

        // A GET must not create the demo row: only a successful upload does, in store().
        $post = Post::query()->where('slug', self::DEMO_SLUG)->first();
        $coverPath = $post?->cover_path;

        return Inertia::render('chapters/file-uploads', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('file-uploads'))),
            'next' => $lab->value('next', self::neighbour($registry->next('file-uploads'))),
            'coverPath' => $lab->value('coverPath', $coverPath),
            'coverUrl' => $lab->value('coverUrl', $coverPath === null ? null : Storage::disk(self::DISK)->url($coverPath)),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'cover' => ['required', 'image', 'max:5120'],
        ]);

        /** @var UploadedFile $cover */
        $cover = $validated['cover'];

        $post = Post::query()->firstOrCreate(
            ['slug' => self::DEMO_SLUG],
            [
                'user_id' => HandleInertiaRequests::currentDemoUser()->id,
                'title' => 'File uploads demo post',
                'excerpt' => 'The post this chapter attaches an uploaded cover image to.',
                'body' => 'This post exists only so the file-uploads chapter has a real row to attach a cover image to.',
                'published_at' => now(),
            ]
        );

        // Delete the outgoing file before storing its replacement so the fake (and, in
        // development, the real) disk never accumulates more than the one cover this
        // single demo post currently points at, no matter how many times this runs.
        if ($post->cover_path !== null) {
            Storage::disk(self::DISK)->delete($post->cover_path);
        }

        $storedPath = $cover->store(self::DIRECTORY, self::DISK);

        if ($storedPath === false) {
            throw new RuntimeException('Storing the uploaded cover image failed.');
        }

        $post->cover_path = $storedPath;
        $post->save();

        return redirect()->route('chapters.file-uploads');
    }
}
