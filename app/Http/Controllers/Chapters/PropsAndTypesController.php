<?php

namespace App\Http\Controllers\Chapters;

use App\Http\Controllers\Chapters\Concerns\ResolvesNeighbours;
use App\Http\Controllers\Chapters\Support\PostFacts;
use App\Http\Controllers\Chapters\Support\PostStatus;
use App\Http\Controllers\Chapters\Support\PublishedRecency;
use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use App\Models\Post;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class PropsAndTypesController
{
    use ResolvesNeighbours;

    public function show(Lab $lab, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find('props-and-types') ?? throw new RuntimeException('The props-and-types chapter is not registered.');

        $post = self::demoPost();
        $status = $post->published_at !== null ? PostStatus::Published : PostStatus::Draft;
        $wordCount = str_word_count(strip_tags($post->body));

        return Inertia::render('chapters/props-and-types', [
            'chapter' => $lab->value('chapter', $chapter->toArray()),
            'previous' => $lab->value('previous', self::neighbour($registry->previous('props-and-types'))),
            'next' => $lab->value('next', self::neighbour($registry->next('props-and-types'))),
            // A scalar.
            'views' => $lab->value('views', $post->views),
            // An array.
            'tags' => $lab->value('tags', ['launch', 'behind-the-scenes', 'engineering']),
            // A closure: resolved eagerly here because a full load always includes it, but
            // resolved through App::call() the same as every other closure prop in this app.
            'renderedAt' => $lab->closure('renderedAt', fn () => now()->toIso8601String()),
            // A backed enum. json_encode() serialises a BackedEnum case to its scalar
            // backing value natively (verified directly against this PHP version), even
            // though BackedEnum does not implement JsonSerializable.
            'status' => $lab->value('status', $status),
            // An Eloquent model. Model implements Illuminate\Contracts\Support\Arrayable,
            // so PropsResolver::resolveValue() calls toArray() on it, the same path a
            // plain array prop takes: no resource class is involved.
            'post' => $lab->value('post', $post),
            // A small class implementing Inertia\ProvidesInertiaProperty.
            'recency' => $lab->value('recency', new PublishedRecency($post->published_at)),
            // A nested array reached by dot notation: PropsResolver::unpackDotProps()
            // turns these two top-level dot keys into one { meta: { wordCount, readingMinutes } }
            // structure before resolution, and each leaf still filters independently under
            // a partial reload because the parent was never itself a resolved non-array value.
            'meta.wordCount' => $lab->value('meta.wordCount', $wordCount),
            'meta.readingMinutes' => $lab->value('meta.readingMinutes', max(1, intdiv($wordCount, 200))),
            // A class implementing Inertia\ProvidesInertiaProperties, added without a
            // string key of its own: PropsResolver::resolvePropertyProviders() only expands
            // a provider found at a numeric array position.
            new PostFacts($post, $lab),
        ]);
    }

    /**
     * A real row when one exists, so the model prop shows genuine Arrayable output; a
     * self-contained, unsaved example otherwise, so this chapter renders correctly on a
     * freshly migrated database that has never run LabSeeder.
     */
    private static function demoPost(): Post
    {
        $post = Post::query()
            ->select(['id', 'user_id', 'title', 'excerpt', 'body', 'cover_path', 'views', 'published_at'])
            ->latest('published_at')
            ->first();

        if ($post !== null) {
            return $post;
        }

        $fallback = new Post([
            'title' => 'Why this lab exists',
            'excerpt' => 'A short paragraph introducing the post, the same length as any other.',
            'body' => str_repeat('An example sentence for a demo post body. ', 40),
            'views' => 128,
            'published_at' => now(),
        ]);

        // id is not in Post::$fillable, so the constructor above never sets it: without
        // this, the attribute would be absent from toArray() on an unseeded database, a
        // shape difference the reader should never see. 0 is never a real row's id
        // (autoincrement starts at 1), and Post::$id is typed non-nullable.
        $fallback->id = 0;

        return $fallback;
    }
}
