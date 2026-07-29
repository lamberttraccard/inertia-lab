<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Like;
use App\Models\Notification;
use App\Models\Post;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class LabSeeder extends Seeder
{
    public function run(): void
    {
        mt_srand(20260729);
        fake()->seed(20260729);

        // fake()->unique() keeps a per-generator history of already-returned
        // values that survives reseeding, so a second run in the same process
        // (or the same test) would retry past collisions with the first run's
        // values and desync the shared mt_rand stream from that point on.
        fake()->unique(true);

        $users = User::factory()->count(8)->create();
        $tags = collect(range(1, 15))->map(fn (int $i) => Tag::create([
            'name' => "Tag {$i}",
            'slug' => "tag-{$i}",
        ]));

        $posts = collect(range(1, 120))->map(function (int $i) use ($users) {
            $title = fake()->sentence(6);

            return Post::create([
                'user_id' => $users->random()->id,
                'title' => $title,
                'slug' => Str::slug($title).'-'.$i,
                'excerpt' => fake()->sentence(15),
                'body' => fake()->paragraphs(8, true),
                'published_at' => now()->subDays(120 - $i),
                'views' => mt_rand(0, 5000),
            ]);
        });

        $posts->each(fn (Post $post) => $post->tags()->attach($tags->random(mt_rand(1, 3))->pluck('id')));

        foreach (range(1, 2000) as $i) {
            Comment::create([
                'post_id' => $posts->random()->id,
                'user_id' => $users->random()->id,
                'body' => fake()->sentence(12),
            ]);
        }

        $posts->take(60)->each(fn (Post $post) => Like::create([
            'post_id' => $post->id,
            'user_id' => $users->random()->id,
        ]));

        foreach (range(1, 30) as $i) {
            Notification::create([
                'user_id' => $users->first()->id,
                'type' => 'comment',
                'data' => ['post_id' => $posts->random()->id],
                'read_at' => $i > 7 ? now() : null,
            ]);
        }
    }
}
