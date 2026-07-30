<?php

use App\Models\Comment;
use App\Models\Notification;
use App\Models\Post;
use App\Models\Tag;
use App\Models\User;
use Database\Seeders\LabSeeder;
use Illuminate\Support\Facades\DB;

it('seeds a deterministic dataset', function () {
    $this->seed(LabSeeder::class);

    expect(User::count())->toBe(8)
        ->and(Tag::count())->toBe(15)
        ->and(Post::count())->toBe(120)
        ->and(Comment::count())->toBe(2000)
        ->and(Notification::count())->toBe(30);
});

it('seeds the same data on every run', function () {
    $this->seed(LabSeeder::class);
    $first = Post::orderBy('id')->pluck('title')->take(5)->all();

    $this->seed(LabSeeder::class);

    expect(Post::orderBy('id')->pluck('title')->take(5)->all())->toBe($first);
});

it('can be seeded twice without hitting the unique index on user emails', function () {
    // composer run setup passes --seed unconditionally, and migrate is a no-op
    // once the database exists, so this is what re-running setup does.
    $this->seed(LabSeeder::class);
    $this->seed(LabSeeder::class);

    expect(User::count())->toBe(8)
        ->and(Tag::count())->toBe(15)
        ->and(Post::count())->toBe(120)
        ->and(Comment::count())->toBe(2000)
        ->and(Notification::count())->toBe(30);
});

it('clears rows a reader created before reseeding', function () {
    $this->seed(LabSeeder::class);

    Post::create([
        'user_id' => User::first()->id,
        'title' => 'A row a reader created',
        'slug' => 'a-row-a-reader-created',
        'excerpt' => 'x',
        'body' => 'x',
    ]);

    expect(Post::count())->toBe(121);

    $this->seed(LabSeeder::class);

    expect(Post::count())->toBe(120)
        ->and(Post::where('slug', 'a-row-a-reader-created')->exists())->toBeFalse();
});

it('gives every post an author and at least one tag', function () {
    $this->seed(LabSeeder::class);

    expect(Post::doesntHave('author')->count())->toBe(0)
        ->and(Post::doesntHave('tags')->count())->toBe(0);
});

it('anchors every timestamp so two runs on different days produce the same rows', function () {
    $this->seed(LabSeeder::class);

    expect(Post::min('published_at'))->toBe('2026-03-04 09:00:00')
        ->and(Post::max('published_at'))->toBe('2026-07-01 09:00:00')
        ->and(Post::whereDate('created_at', '2026-07-01')->count())->toBe(120);
});

it('seeds the blog domain through the default database seeder, not just directly', function () {
    // php artisan migrate --seed and php artisan db:seed both run DatabaseSeeder with no
    // class named, so a clean clone only gets the blog domain if that seeder calls
    // LabSeeder itself. composer.json's own setup script runs exactly that migrate --seed,
    // and the README's setup steps do too, so both are only correct because this is true.
    $this->seed();

    expect(Post::count())->toBe(120);
});
