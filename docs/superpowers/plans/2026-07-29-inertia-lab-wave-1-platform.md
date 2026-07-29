# Inertia Lab, wave 1 part 1: the teaching platform

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shared teaching platform of Inertia Lab (chapter registry, prop trace, wire strip, round-trip diagram, source view, slow mode, home, glossary, "where did it go?") and prove it end to end with chapter 0, the mental-model switch.

**Architecture:** A Laravel 13 application scaffolded from the React starter kit without authentication. Every chapter is a thin controller returning `Inertia::render()` with props built through `Lab` factories, which record the declared prop list and time each resolution. A `LabRecorder` bound in place of Inertia's own `RequestRecorder` receives the per-prop resolution callbacks from inside `Inertia\Response::toResponse()`. A middleware attaches the resulting trace to the response, and the React chapter shell renders it next to the lesson.

**Tech Stack:** PHP 8.5, Laravel 13, `inertiajs/inertia-laravel ^3.2`, `@inertiajs/react ^3.6`, React 19, Vite, Tailwind 4, SQLite, Pest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-29-inertia-lab-design.md`. Read it before starting.
- Version floors are hard: `inertiajs/inertia-laravel ^3.2`, `@inertiajs/react ^3.6`. The official DevTools require both.
- No chapter, helper or comment may reference an API absent from the installed version. Verify against `vendor/` and `node_modules/`, not against the documentation. Where they disagree, the installed code wins.
- All application text, code, comments, commit messages and documentation are in **English**.
- No em-dashes or en-dashes anywhere in output. Use commas, colons, parentheses or a regular hyphen.
- No explanatory prose comments in config files. Code comments explain why, never what.
- Instrumentation must fail loudly: when the trace, the source view or the registry cannot do its job, the UI says so explicitly. Never render an empty panel that reads as "nothing happened".
- The repository already exists at `/Users/lambert/Developer/inertia-lab` with `.git` and `docs/`. Do not delete either.
- Every task ends with a passing test run and a commit.

## File Structure

```
app/Lab/Chapter.php                     readonly DTO: one chapter's metadata
app/Lab/ChapterRegistry.php             ordered list of chapters, single source of truth
app/Lab/Lab.php                         prop factories that record declarations and time resolution
app/Lab/Trace/TraceCollector.php        per-request trace state, assembles the payload
app/Lab/Trace/LabRecorder.php           subclass of Inertia's RequestRecorder
app/Lab/Trace/SkipReason.php            enum: why a declared prop was not resolved
app/Lab/SourceReader.php                reads registry-listed files from disk, refuses anything else
app/Lab/SlowMode.php                    session-backed artificial latency
app/Providers/LabServiceProvider.php    container bindings
app/Http/Middleware/InjectLabTrace.php  attaches the trace to JSON and HTML responses
app/Http/Controllers/Chapters/          one thin controller per chapter
app/Http/Controllers/LabController.php  home, glossary, where-did-it-go, source endpoint
resources/js/lab/ChapterShell.tsx       the fixed chapter skeleton
resources/js/lab/WireStrip.tsx          wire and lifecycle tabs
resources/js/lab/wire-capture.ts        fetch patch and router event subscription
resources/js/lab/RoundTrip.tsx          the round-trip diagram
resources/js/lab/SourceView.tsx         source panel
resources/js/lab/types.ts               shared TypeScript types for trace and wire entries
resources/js/pages/lab/                 home, glossary, where-did-it-go
resources/js/pages/chapters/            one page component per chapter
tests/Feature/Lab/                      platform tests
tests/Feature/Chapters/                 one test per chapter
```

Files that change together live together: everything that knows about the trace is under `app/Lab/Trace/` and `resources/js/lab/`. Chapter controllers stay thin so the interesting code is always the props array, which is what the source view shows the reader.

---

### Task 1: Scaffold the application into the existing repository

**Files:**
- Create: the Laravel skeleton at the repository root
- Modify: `.gitignore`, `composer.json`, `package.json`
- Test: `tests/Feature/Lab/ScaffoldTest.php`

**Interfaces:**
- Consumes: nothing
- Produces: a running Laravel + Inertia + React application, SQLite database at `database/database.sqlite`, Pest configured

- [ ] **Step 1: Scaffold into a temporary directory**

The installer refuses to write into a directory that already contains files, and the repository already holds `.git` and `docs/`. Scaffold elsewhere, then move the files in.

```bash
cd /tmp && rm -rf inertia-lab-scaffold
laravel new inertia-lab-scaffold --react --no-authentication --pest --database=sqlite --no-interaction
```

- [ ] **Step 2: Move the scaffold into the repository**

```bash
cd /tmp/inertia-lab-scaffold
rsync -a --exclude '.git' --exclude 'docs' ./ /Users/lambert/Developer/inertia-lab/
cd /Users/lambert/Developer/inertia-lab && git status --short | head -20
```

- [ ] **Step 3: Verify the version floors and raise them if needed**

```bash
cd /Users/lambert/Developer/inertia-lab
php -r 'echo json_decode(file_get_contents("vendor/composer/installed.json"), true) ? "" : "";'
composer show inertiajs/inertia-laravel | head -3
node -p "require('./node_modules/@inertiajs/react/package.json').version"
```

Expected: `inertia-laravel` at 3.2.0 or higher, `@inertiajs/react` at 3.6.0 or higher. If either is lower:

```bash
composer require "inertiajs/inertia-laravel:^3.2" -W
npm install @inertiajs/react@^3.6 @inertiajs/vite@^3.6
```

- [ ] **Step 4: Write the failing test**

Create `tests/Feature/Lab/ScaffoldTest.php`:

```php
<?php

use Inertia\Testing\AssertableInertia;

it('serves an inertia page at the root url', function () {
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->component('welcome'));
});

it('meets the inertia version floors', function () {
    $lock = json_decode(file_get_contents(base_path('composer.lock')), true);
    $adapter = collect($lock['packages'])->firstWhere('name', 'inertiajs/inertia-laravel');

    expect(version_compare(ltrim($adapter['version'], 'v'), '3.2.0', '>='))->toBeTrue();

    $client = json_decode(file_get_contents(base_path('node_modules/@inertiajs/react/package.json')), true);

    expect(version_compare($client['version'], '3.6.0', '>='))->toBeTrue();
});
```

- [ ] **Step 5: Run the test**

```bash
php artisan test --filter=ScaffoldTest
```

Expected: PASS. If the component name assertion fails, read `routes/web.php` and use the component name the starter kit actually renders. Do not change the assertion to something vaguer; use the real name.

- [ ] **Step 6: Create and seed the database**

```bash
touch database/database.sqlite && php artisan migrate --force
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Scaffold Laravel 13 + Inertia 3 + React application"
```

---

### Task 2: The blog domain and a deterministic seeder

**Files:**
- Create: `app/Models/{User,Post,Tag,Comment,Like,Notification}.php`, matching migrations, `database/factories/`, `database/seeders/LabSeeder.php`
- Test: `tests/Feature/Lab/SeederTest.php`

**Interfaces:**
- Consumes: Task 1's application
- Produces: `Post` with `author()`, `tags()`, `comments()`, `likes()`; `User` with `posts()`, `notifications()`; `LabSeeder` producing exactly 8 users, 15 tags, 120 posts, 2000 comments, 30 notifications

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/Lab/SeederTest.php`:

```php
<?php

use App\Models\{Comment, Notification, Post, Tag, User};
use Database\Seeders\LabSeeder;

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

    $this->artisan('migrate:fresh');
    $this->seed(LabSeeder::class);

    expect(Post::orderBy('id')->pluck('title')->take(5)->all())->toBe($first);
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
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
php artisan test --filter=SeederTest
```

Expected: FAIL, class `App\Models\User` exists but `Post` does not.

- [ ] **Step 3: Create migrations and models**

```bash
php artisan make:model Post -m
php artisan make:model Tag -m
php artisan make:model Comment -m
php artisan make:model Like -m
php artisan make:model Notification -m
php artisan make:migration create_post_tag_table
```

Schema, one `Schema::create` per migration file:

```php
Schema::create('tags', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('slug')->unique();
});

Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('title');
    $table->string('slug')->unique();
    $table->string('excerpt');
    $table->text('body');
    $table->string('cover_path')->nullable();
    $table->timestamp('published_at')->nullable();
    $table->unsignedInteger('views')->default(0);
    $table->timestamps();
});

Schema::create('post_tag', function (Blueprint $table) {
    $table->foreignId('post_id')->constrained()->cascadeOnDelete();
    $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
    $table->primary(['post_id', 'tag_id']);
});

Schema::create('comments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('post_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->text('body');
    $table->timestamps();
});

Schema::create('likes', function (Blueprint $table) {
    $table->id();
    $table->foreignId('post_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->timestamps();
    $table->unique(['post_id', 'user_id']);
});

Schema::create('notifications', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('type');
    $table->json('data');
    $table->timestamp('read_at')->nullable();
    $table->timestamps();
});
```

Relations:

```php
// Post
public function author(): BelongsTo { return $this->belongsTo(User::class, 'user_id'); }
public function tags(): BelongsToMany { return $this->belongsToMany(Tag::class); }
public function comments(): HasMany { return $this->hasMany(Comment::class); }
public function likes(): HasMany { return $this->hasMany(Like::class); }

// User
public function posts(): HasMany { return $this->hasMany(Post::class); }
public function notifications(): HasMany { return $this->hasMany(Notification::class); }

// Comment
public function author(): BelongsTo { return $this->belongsTo(User::class, 'user_id'); }
```

`Notification` casts `data` to `array`. `Post` casts `published_at` to `datetime`.

`User` must drop the starter kit's `Notifiable` trait. That trait composes `HasDatabaseNotifications`, whose `readNotifications()` and `unreadNotifications()` call `$this->notifications()` and expect the trait's own polymorphic relation. The blog domain's `notifications()` relation shadows it, so those two methods would throw `BadMethodCallException` on the lab's `Notification` model. The lab never sends a Laravel notification, so removing the trait is the honest fix and keeps the domain relation named after the domain.

- [ ] **Step 4: Write the seeder with a fixed seed**

`database/seeders/LabSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Models\{Comment, Like, Notification, Post, Tag, User};
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class LabSeeder extends Seeder
{
    private const EPOCH = '2026-07-01 09:00:00';

    public function run(): void
    {
        mt_srand(20260729);
        fake()->seed(20260729);

        $epoch = CarbonImmutable::parse(self::EPOCH);

        $users = User::factory()->count(8)->create();
        $tags = collect(range(1, 15))->map(fn (int $i) => Tag::create([
            'name' => "Tag {$i}",
            'slug' => "tag-{$i}",
        ]));

        $posts = collect(range(1, 120))->map(function (int $i) use ($users, $epoch) {
            $title = fake()->sentence(6);

            return Post::create([
                'user_id' => $users->random()->id,
                'title' => $title,
                'slug' => Str::slug($title).'-'.$i,
                'excerpt' => fake()->sentence(15),
                'body' => fake()->paragraphs(8, true),
                'published_at' => $epoch->subDays(120 - $i),
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
                'read_at' => $i > 7 ? $epoch : null,
            ]);
        }
    }
}
```

Every timestamp is anchored to `EPOCH` rather than `now()`, including the `created_at` and `updated_at` columns Eloquent fills in: wrap the whole `run()` body in `CarbonImmutable::withTestNow($epoch, function () { ... })` so the model timestamps are anchored too. Without that, two runs on different days produce different rows, which defeats the point of seeding deterministically.

- [ ] **Step 5: Run the tests until they pass**

```bash
php artisan test --filter=SeederTest
```

Expected: PASS. If the determinism test fails, the cause is an unseeded random source; find it and seed it rather than relaxing the assertion.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "Add blog domain models and deterministic seeder"
```

---

### Task 3: The chapter registry

**Files:**
- Create: `app/Lab/Chapter.php`, `app/Lab/ChapterRegistry.php`
- Test: `tests/Feature/Lab/ChapterRegistryTest.php`

**Interfaces:**
- Consumes: nothing
- Produces: `ChapterRegistry::all(): array<Chapter>`, `ChapterRegistry::find(string $slug): ?Chapter`, `ChapterRegistry::next(string $slug): ?Chapter`, `ChapterRegistry::previous(string $slug): ?Chapter`. `Chapter` is a readonly class with `slug`, `title`, `question`, `concept`, `routeName`, `serverFile`, `clientFile`, `translationFrom`, `translationTo`, `docsUrl`, `wave`, `order`.

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/Lab/ChapterRegistryTest.php`:

```php
<?php

use App\Lab\ChapterRegistry;

it('exposes chapters in a stable order with unique slugs', function () {
    $chapters = app(ChapterRegistry::class)->all();

    expect($chapters)->not->toBeEmpty();

    $slugs = array_map(fn ($chapter) => $chapter->slug, $chapters);
    expect($slugs)->toBe(array_unique($slugs));

    $orders = array_map(fn ($chapter) => $chapter->order, $chapters);
    $sorted = $orders;
    sort($sorted);
    expect($orders)->toBe($sorted);
});

it('gives every chapter the teaching fields that carry the pedagogy', function () {
    foreach (app(ChapterRegistry::class)->all() as $chapter) {
        expect($chapter->question)->not->toBeEmpty("{$chapter->slug} has no plain-language question")
            ->and($chapter->translationFrom)->not->toBeEmpty("{$chapter->slug} has no translation callout")
            ->and($chapter->translationTo)->not->toBeEmpty("{$chapter->slug} has no translation callout")
            ->and($chapter->docsUrl)->toStartWith('https://inertiajs.com/');
    }
});

it('links chapters into a path', function () {
    $registry = app(ChapterRegistry::class);
    $first = $registry->all()[0];

    expect($registry->previous($first->slug))->toBeNull()
        ->and($registry->find($first->slug)->slug)->toBe($first->slug);
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
php artisan test --filter=ChapterRegistryTest
```

Expected: FAIL, `App\Lab\ChapterRegistry` not found.

- [ ] **Step 3: Implement `Chapter`**

```php
<?php

namespace App\Lab;

readonly class Chapter
{
    public function __construct(
        public string $slug,
        public string $title,
        public string $question,
        public string $concept,
        public string $routeName,
        public string $serverFile,
        public string $clientFile,
        public string $translationFrom,
        public string $translationTo,
        public string $docsUrl,
        public int $wave,
        public int $order,
    ) {}

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return get_object_vars($this);
    }
}
```

- [ ] **Step 4: Implement `ChapterRegistry` with chapter 0 only**

Later plans append entries. The registry is the only place a chapter is declared.

```php
<?php

namespace App\Lab;

class ChapterRegistry
{
    /** @var array<int, Chapter>|null */
    private ?array $chapters = null;

    /** @return array<int, Chapter> */
    public function all(): array
    {
        return $this->chapters ??= [
            new Chapter(
                slug: 'mental-model',
                title: 'Where did the API go?',
                question: 'If the component never calls an endpoint, how does it get its data?',
                concept: 'The server decides what the client receives, and sends it with the page.',
                routeName: 'chapters.mental-model',
                serverFile: 'app/Http/Controllers/Chapters/MentalModelController.php',
                clientFile: 'resources/js/pages/chapters/mental-model.tsx',
                translationFrom: 'A GET /api/posts endpoint, an API resource, a fetch call in useEffect, and a loading state.',
                translationTo: 'A route, a controller, and a props array. The component receives the data already resolved, as arguments.',
                docsUrl: 'https://inertiajs.com/docs/v3/core-concepts/how-it-works',
                wave: 1,
                order: 0,
            ),
        ];
    }

    public function find(string $slug): ?Chapter
    {
        return collect($this->all())->firstWhere('slug', $slug);
    }

    public function next(string $slug): ?Chapter
    {
        $chapters = $this->all();
        $index = array_search($slug, array_map(fn (Chapter $c) => $c->slug, $chapters), true);

        return $index === false ? null : ($chapters[$index + 1] ?? null);
    }

    public function previous(string $slug): ?Chapter
    {
        $chapters = $this->all();
        $index = array_search($slug, array_map(fn (Chapter $c) => $c->slug, $chapters), true);

        return $index === false || $index === 0 ? null : $chapters[$index - 1];
    }
}
```

- [ ] **Step 5: Run the tests**

```bash
php artisan test --filter=ChapterRegistryTest
```

Expected: PASS. The assertion that every declared source file exists on disk is deliberately not here: chapter 0's files do not exist until Task 13, and a task must not end on a red test. Task 13 adds that assertion once the files it guards are real.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "Add chapter registry as the single source of chapter metadata"
```

---

### Task 4: Prop factories that declare and time

**Files:**
- Create: `app/Lab/Trace/TraceCollector.php`, `app/Lab/Trace/SkipReason.php`, `app/Lab/Lab.php`, `app/Providers/LabServiceProvider.php`
- Modify: `bootstrap/providers.php`
- Test: `tests/Feature/Lab/LabPropsTest.php`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `TraceCollector::declare(string $key, string $type, array $meta = []): void`
  - `TraceCollector::time(string $key, callable $callback): mixed`
  - `TraceCollector::markResolved(string $path): void`
  - `TraceCollector::declared(): array`, `TraceCollector::resolved(): array`
  - `Lab::value(string $key, mixed $value): mixed`
  - `Lab::closure(string $key, callable $callback): Closure`
  - `Lab::optional(string $key, callable $callback): OptionalProp`
  - `Lab::defer(string $key, callable $callback, string $group = 'default'): DeferProp`
  - `Lab::always(string $key, mixed $value): AlwaysProp`
  - `Lab::merge(string $key, mixed $value): MergeProp`
  - `Lab::once(string $key, callable $callback): OnceProp`
  - `SkipReason` enum cases: `NotRequested`, `Excluded`, `Deferred`, `Optional`, `AlreadyHeld`
  - `Lab::scroll()` and `Lab::deepMerge()` are deliberately absent here. They are added by the infinite-scroll and merging chapters in the wave 1 part 3 plan, which is where their behaviour is first exercised and tested.

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/Lab/LabPropsTest.php`:

```php
<?php

use App\Lab\Lab;
use App\Lab\Trace\TraceCollector;
use Inertia\{AlwaysProp, DeferProp, MergeProp, OnceProp, OptionalProp};

it('returns genuine inertia prop objects', function () {
    $lab = app(Lab::class);

    expect($lab->optional('a', fn () => 1))->toBeInstanceOf(OptionalProp::class)
        ->and($lab->defer('b', fn () => 1))->toBeInstanceOf(DeferProp::class)
        ->and($lab->always('c', 1))->toBeInstanceOf(AlwaysProp::class)
        ->and($lab->merge('d', [1]))->toBeInstanceOf(MergeProp::class)
        ->and($lab->once('e', fn () => 1))->toBeInstanceOf(OnceProp::class);
});

it('keeps the value the raw prop would have produced', function () {
    expect((app(Lab::class)->optional('a', fn () => 'value'))())->toBe('value')
        ->and((app(Lab::class)->defer('b', fn () => 'deferred'))())->toBe('deferred');
});

it('preserves the deferred group', function () {
    $prop = app(Lab::class)->defer('stats', fn () => 1, 'dashboard');

    expect($prop->group())->toBe('dashboard');
});

it('records every declared prop with its type', function () {
    $lab = app(Lab::class);
    $lab->value('title', 'Hello');
    $lab->defer('stats', fn () => 1, 'dashboard');

    $declared = app(TraceCollector::class)->declared();

    expect($declared)->toHaveKeys(['title', 'stats'])
        ->and($declared['title']['type'])->toBe('value')
        ->and($declared['stats']['type'])->toBe('defer')
        ->and($declared['stats']['meta']['group'])->toBe('dashboard');
});

it('times a prop only when it is actually resolved', function () {
    $lab = app(Lab::class);
    $prop = $lab->optional('slow', function () {
        usleep(20_000);

        return 1;
    });

    expect(app(TraceCollector::class)->declared()['slow']['ms'])->toBeNull();

    $prop();

    expect(app(TraceCollector::class)->declared()['slow']['ms'])->toBeGreaterThan(15);
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
php artisan test --filter=LabPropsTest
```

Expected: FAIL, `App\Lab\Lab` not found.

- [ ] **Step 3: Implement `SkipReason`**

```php
<?php

namespace App\Lab\Trace;

enum SkipReason: string
{
    case NotRequested = 'not requested by only';
    case Excluded = 'excluded by except';
    case Deferred = 'deferred to a follow-up request';
    case Optional = 'optional and not requested';
    case AlreadyHeld = 'once prop already held by the client';

    public function explanation(): string
    {
        return match ($this) {
            self::NotRequested => 'This partial reload asked for a different set of props, so the server never ran this one.',
            self::Excluded => 'This partial reload excluded this prop by name.',
            self::Deferred => 'Deferred props are skipped on the first pass and fetched by a second request.',
            self::Optional => 'Optional props are never sent unless a partial reload asks for them by name.',
            self::AlreadyHeld => 'The client sent X-Inertia-Except-Once-Props, so the server skipped work it already delivered.',
        };
    }
}
```

- [ ] **Step 4: Implement `TraceCollector`**

```php
<?php

namespace App\Lab\Trace;

class TraceCollector
{
    /** @var array<string, array{type: string, meta: array<string, mixed>, ms: float|null, order: int|null}> */
    private array $declared = [];

    /** @var array<int, string> */
    private array $resolved = [];

    private int $counter = 0;

    public function declare(string $key, string $type, array $meta = []): void
    {
        $this->declared[$key] = ['type' => $type, 'meta' => $meta, 'ms' => null, 'order' => null];
    }

    public function time(string $key, callable $callback): mixed
    {
        $started = hrtime(true);

        try {
            return $callback();
        } finally {
            if (isset($this->declared[$key])) {
                $this->declared[$key]['ms'] = round((hrtime(true) - $started) / 1_000_000, 2);
                $this->declared[$key]['order'] ??= ++$this->counter;
            }
        }
    }

    public function markResolved(string $path): void
    {
        $this->resolved[] = $path;

        if (isset($this->declared[$path])) {
            $this->declared[$path]['order'] ??= ++$this->counter;
        }
    }

    /** @return array<string, array{type: string, meta: array<string, mixed>, ms: float|null, order: int|null}> */
    public function declared(): array
    {
        return $this->declared;
    }

    /** @return array<int, string> */
    public function resolved(): array
    {
        return array_values(array_unique($this->resolved));
    }
}
```

- [ ] **Step 5: Implement `Lab`**

```php
<?php

namespace App\Lab;

use App\Lab\Trace\TraceCollector;
use Closure;
use Inertia\{AlwaysProp, DeferProp, Inertia, MergeProp, OnceProp, OptionalProp};

class Lab
{
    public function __construct(private readonly TraceCollector $trace) {}

    public function value(string $key, mixed $value): mixed
    {
        $this->trace->declare($key, 'value');

        return $value;
    }

    public function closure(string $key, callable $callback): Closure
    {
        $this->trace->declare($key, 'closure');

        return fn () => $this->trace->time($key, $callback);
    }

    public function optional(string $key, callable $callback): OptionalProp
    {
        $this->trace->declare($key, 'optional');

        return Inertia::optional(fn () => $this->trace->time($key, $callback));
    }

    public function defer(string $key, callable $callback, string $group = 'default'): DeferProp
    {
        $this->trace->declare($key, 'defer', ['group' => $group]);

        return Inertia::defer(fn () => $this->trace->time($key, $callback), $group);
    }

    public function always(string $key, mixed $value): AlwaysProp
    {
        $this->trace->declare($key, 'always');

        return Inertia::always($this->wrap($key, $value));
    }

    public function merge(string $key, mixed $value): MergeProp
    {
        $this->trace->declare($key, 'merge');

        return Inertia::merge($this->wrap($key, $value));
    }

    public function once(string $key, callable $callback): OnceProp
    {
        $this->trace->declare($key, 'once');

        return Inertia::once(fn () => $this->trace->time($key, $callback));
    }

    private function wrap(string $key, mixed $value): mixed
    {
        return is_callable($value) ? fn () => $this->trace->time($key, $value) : $value;
    }
}
```

- [ ] **Step 6: Bind both as scoped services**

Create `app/Providers/LabServiceProvider.php`:

```php
<?php

namespace App\Providers;

use App\Lab\Lab;
use App\Lab\Trace\TraceCollector;
use Illuminate\Support\ServiceProvider;

class LabServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->scoped(TraceCollector::class, fn () => new TraceCollector);
        $this->app->scoped(Lab::class, fn ($app) => new Lab($app->make(TraceCollector::class)));
    }
}
```

Register it in `bootstrap/providers.php`.

- [ ] **Step 7: Run the tests**

```bash
php artisan test --filter=LabPropsTest
```

Expected: PASS. If `group()` is not the accessor name on `DeferProp`, read `vendor/inertiajs/inertia-laravel/src/DefersProps.php` and use the real one.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "Add lab prop factories that declare and time prop resolution"
```

---

### Task 5: The recorder that observes prop resolution

**Files:**
- Create: `app/Lab/Trace/LabRecorder.php`
- Modify: `app/Providers/LabServiceProvider.php`, `app/Lab/Trace/TraceCollector.php`
- Test: `tests/Feature/Lab/LabRecorderTest.php`

**Interfaces:**
- Consumes: `TraceCollector` from Task 4
- Produces: `TraceCollector::payload(Request $request): array` returning `['enabled' => bool, 'props' => [...], 'skipped' => [...], 'reason' => ...]`

`Inertia\Response::toResponse()` calls `DevTools::recorder($request)?->pageRendered(...)`, and `DevTools::recorder()` resolves `RequestRecorder` from the container, which the package registers with `$this->app->scoped(RequestRecorder::class, fn () => new RequestRecorder)`. The class is not final and has no constructor, so a subclass rebound in the lab's provider receives the whole lifecycle. Every override calls `parent::` so the official DevTools continue to record normally.

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/Lab/LabRecorderTest.php`:

```php
<?php

use App\Lab\Lab;
use App\Lab\Trace\{SkipReason, TraceCollector};
use Illuminate\Support\Facades\Route;
use Inertia\DevTools\RequestRecorder;
use Inertia\Inertia;

beforeEach(function () {
    config()->set('inertia.devtools.enabled', true);

    Route::middleware('web')->get('/trace-fixture', function (Lab $lab) {
        return Inertia::render('welcome', [
            'title' => $lab->value('title', 'Hello'),
            'body' => $lab->closure('body', fn () => 'resolved'),
            'stats' => $lab->defer('stats', fn () => ['views' => 1], 'dashboard'),
            'extra' => $lab->optional('extra', fn () => 'never on first load'),
        ]);
    });
});

it('binds the lab recorder in place of the package one', function () {
    expect(app(RequestRecorder::class))->toBeInstanceOf(App\Lab\Trace\LabRecorder::class);
});

it('separates resolved props from skipped ones with a reason', function () {
    $this->get('/trace-fixture');

    $payload = app(TraceCollector::class)->payload(request());

    expect($payload['enabled'])->toBeTrue()
        ->and(array_keys($payload['props']))->toContain('title', 'body')
        ->and($payload['skipped']['stats']['reason'])->toBe(SkipReason::Deferred->value)
        ->and($payload['skipped']['extra']['reason'])->toBe(SkipReason::Optional->value);
});

it('reports that recording is off rather than returning an empty trace', function () {
    config()->set('inertia.devtools.enabled', false);

    $this->get('/trace-fixture');

    $payload = app(TraceCollector::class)->payload(request());

    expect($payload['enabled'])->toBeFalse()
        ->and($payload['reason'])->toContain('inertia.devtools.enabled');
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
php artisan test --filter=LabRecorderTest
```

Expected: FAIL, `App\Lab\Trace\LabRecorder` not found.

- [ ] **Step 3: Implement `LabRecorder`**

```php
<?php

namespace App\Lab\Trace;

use Illuminate\Http\Request;
use Inertia\DevTools\RequestRecorder;

class LabRecorder extends RequestRecorder
{
    public function __construct(private readonly TraceCollector $trace) {}

    public function propResolved(string $path, mixed $prop): void
    {
        $this->trace->markResolved($path);

        parent::propResolved($path, $prop);
    }

    public function propRescued(string $path, mixed $prop): void
    {
        $this->trace->markRescued($path);

        parent::propRescued($path, $prop);
    }

    public function pageRendered(Request $request, array $page, array $resolvedProps): void
    {
        $this->trace->pageRendered($page);

        parent::pageRendered($request, $page, $resolvedProps);
    }
}
```

- [ ] **Step 4: Extend `TraceCollector` with the payload assembly**

Add to `TraceCollector`:

```php
    /** @var array<int, string> */
    private array $rescued = [];

    /** @var array<string, mixed> */
    private array $page = [];

    public function markRescued(string $path): void
    {
        $this->rescued[] = $path;
    }

    /** @param array<string, mixed> $page */
    public function pageRendered(array $page): void
    {
        $this->page = $page;
    }

    /** @return array<string, mixed> */
    public function payload(Request $request): array
    {
        if (! DevTools::enabled()) {
            return [
                'enabled' => false,
                'reason' => 'Prop recording is off. Set inertia.devtools.enabled to true, or run with APP_ENV=local.',
                'props' => [],
                'skipped' => [],
            ];
        }

        $resolved = $this->resolved();
        $props = [];
        $skipped = [];

        foreach ($this->declared as $key => $entry) {
            if (in_array($key, $resolved, true)) {
                $props[$key] = $entry + ['rescued' => in_array($key, $this->rescued, true)];

                continue;
            }

            $reason = $this->skipReason($key, $entry, $request);
            $skipped[$key] = [
                'type' => $entry['type'],
                'reason' => $reason->value,
                'explanation' => $reason->explanation(),
            ];
        }

        return [
            'enabled' => true,
            'props' => $props,
            'skipped' => $skipped,
            'partial' => [
                'component' => $request->header(Header::PARTIAL_COMPONENT),
                'only' => $request->header(Header::PARTIAL_ONLY),
                'except' => $request->header(Header::PARTIAL_EXCEPT),
                'exceptOnce' => $request->header(Header::EXCEPT_ONCE_PROPS),
            ],
        ];
    }

    private function skipReason(string $key, array $entry, Request $request): SkipReason
    {
        $only = array_filter(explode(',', (string) $request->header(Header::PARTIAL_ONLY)));
        $except = array_filter(explode(',', (string) $request->header(Header::PARTIAL_EXCEPT)));
        $exceptOnce = array_filter(explode(',', (string) $request->header(Header::EXCEPT_ONCE_PROPS)));

        return match (true) {
            in_array($key, $exceptOnce, true) => SkipReason::AlreadyHeld,
            in_array($key, $except, true) => SkipReason::Excluded,
            $entry['type'] === 'defer' => SkipReason::Deferred,
            $entry['type'] === 'optional' => SkipReason::Optional,
            $only !== [] => SkipReason::NotRequested,
            default => SkipReason::NotRequested,
        };
    }
```

Import `Illuminate\Http\Request`, `Inertia\DevTools\DevTools` and `Inertia\Support\Header` at the top of the file.

- [ ] **Step 5: Rebind the recorder**

In `LabServiceProvider::register()`, after the existing bindings:

```php
        $this->app->scoped(RequestRecorder::class, fn ($app) => new LabRecorder($app->make(TraceCollector::class)));
```

- [ ] **Step 6: Run the tests**

```bash
php artisan test --filter=LabRecorderTest
```

Expected: PASS. If the binding assertion fails, the package provider is registering after the app provider; move the rebinding into `boot()` instead of `register()` and re-run.

- [ ] **Step 7: Run the whole suite to check nothing regressed**

```bash
php artisan test
```

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "Observe prop resolution through a lab subclass of Inertia's request recorder"
```

---

### Task 6: Attach the trace to the response

**Files:**
- Create: `app/Http/Middleware/InjectLabTrace.php`
- Modify: `bootstrap/app.php`
- Test: `tests/Feature/Lab/InjectLabTraceTest.php`

**Interfaces:**
- Consumes: `TraceCollector::payload()` from Task 5
- Produces: `props._lab` on Inertia JSON responses, `<script id="lab-trace" type="application/json">` on the initial HTML document

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Lab\Lab;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

beforeEach(function () {
    config()->set('inertia.devtools.enabled', true);

    Route::middleware('web')->get('/trace-fixture', fn (Lab $lab) => Inertia::render('welcome', [
        'title' => $lab->value('title', 'Hello'),
    ]));
});

it('injects the trace into the initial html document', function () {
    $response = $this->get('/trace-fixture');

    $response->assertOk();
    expect($response->getContent())->toContain('<script id="lab-trace" type="application/json">');
});

it('injects the trace into an inertia json response', function () {
    $response = $this->withHeaders(['X-Inertia' => 'true', 'X-Inertia-Version' => ''])->get('/trace-fixture');

    $response->assertOk();
    expect($response->json('props._lab.enabled'))->toBeTrue()
        ->and($response->json('props._lab.props'))->toHaveKey('title');
});

it('leaves non inertia responses untouched', function () {
    Route::middleware('web')->get('/plain', fn () => response('plain body'));

    expect($this->get('/plain')->getContent())->toBe('plain body');
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
php artisan test --filter=InjectLabTraceTest
```

Expected: FAIL, no `lab-trace` script and no `_lab` key.

- [ ] **Step 3: Implement the middleware**

```php
<?php

namespace App\Http\Middleware;

use App\Lab\Trace\TraceCollector;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InjectLabTrace
{
    public function __construct(private readonly TraceCollector $trace) {}

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! app()->environment('local', 'testing')) {
            return $response;
        }

        $payload = $this->trace->payload($request);

        if ($response instanceof JsonResponse && $request->headers->has('X-Inertia')) {
            $data = $response->getData(true);
            $data['props']['_lab'] = $payload;
            $response->setData($data);

            return $response;
        }

        if (str_contains((string) $response->headers->get('Content-Type'), 'text/html')) {
            $content = (string) $response->getContent();

            if (str_contains($content, '</body>')) {
                $script = '<script id="lab-trace" type="application/json">'
                    .json_encode($payload, JSON_THROW_ON_ERROR | JSON_HEX_TAG)
                    .'</script>';

                $response->setContent(str_replace('</body>', $script.'</body>', $content));
            }
        }

        return $response;
    }
}
```

`JSON_HEX_TAG` matters: without it a prop value containing `</script>` would close the tag early and break the page.

- [ ] **Step 4: Register it on the web group**

In `bootstrap/app.php`, inside `->withMiddleware(function (Middleware $middleware) { ... })`:

```php
    $middleware->web(append: [
        \App\Http\Middleware\InjectLabTrace::class,
    ]);
```

- [ ] **Step 5: Run the tests**

```bash
php artisan test --filter=InjectLabTraceTest
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "Attach the prop trace to both response shapes"
```

---

### Task 7: Slow mode

**Files:**
- Create: `app/Lab/SlowMode.php`, route and controller action to toggle it
- Modify: `app/Lab/Trace/TraceCollector.php`, `app/Lab/Lab.php`
- Test: `tests/Feature/Lab/SlowModeTest.php`

**Interfaces:**
- Consumes: `TraceCollector`
- Produces: `SlowMode::delayMs(): int`, `SlowMode::set(int $ms): void`; trace entries gain `delayMs` reported separately from `ms`

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Lab\{Lab, SlowMode};
use App\Lab\Trace\TraceCollector;

it('defaults to no artificial delay', function () {
    expect(app(SlowMode::class)->delayMs())->toBe(0);
});

it('delays prop resolution and reports the delay separately from real time', function () {
    app(SlowMode::class)->set(50);

    $prop = app(Lab::class)->optional('slow', fn () => 'value');
    $prop();

    $entry = app(TraceCollector::class)->declared()['slow'];

    expect($entry['ms'])->toBeGreaterThan(45)
        ->and($entry['delayMs'])->toBe(50);
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
php artisan test --filter=SlowModeTest
```

Expected: FAIL, `App\Lab\SlowMode` not found.

- [ ] **Step 3: Implement `SlowMode`**

```php
<?php

namespace App\Lab;

use Illuminate\Contracts\Session\Session;

class SlowMode
{
    public function __construct(private readonly Session $session) {}

    public function delayMs(): int
    {
        return (int) $this->session->get('lab.slow_mode', 0);
    }

    public function set(int $ms): void
    {
        $this->session->put('lab.slow_mode', max(0, min($ms, 3000)));
    }
}
```

- [ ] **Step 4: Apply the delay inside the timed callback**

In `TraceCollector::time()`, before invoking the callback, sleep for the configured delay and record it:

```php
    public function time(string $key, callable $callback): mixed
    {
        $delay = app(SlowMode::class)->delayMs();

        if ($delay > 0) {
            usleep($delay * 1000);
        }

        $started = hrtime(true);

        try {
            return $callback();
        } finally {
            if (isset($this->declared[$key])) {
                $this->declared[$key]['ms'] = round((hrtime(true) - $started) / 1_000_000, 2) + $delay;
                $this->declared[$key]['delayMs'] = $delay;
                $this->declared[$key]['order'] ??= ++$this->counter;
            }
        }
    }
```

Also initialise `'delayMs' => 0` in `declare()` so the key always exists.

- [ ] **Step 5: Run the tests**

```bash
php artisan test --filter=SlowModeTest
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "Add slow mode so deferred and prefetched work is visible on localhost"
```

---

### Task 8: The source reader

**Files:**
- Create: `app/Lab/SourceReader.php`, `app/Http/Controllers/LabController.php` with a `source` action, route `GET /lab/source/{slug}`
- Test: `tests/Feature/Lab/SourceReaderTest.php`

**Interfaces:**
- Consumes: `ChapterRegistry` from Task 3
- Produces: `SourceReader::read(string $path): array{path: string, contents: string, lines: int}`, throwing `InvalidArgumentException` for any path not listed in the registry

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Lab\SourceReader;

it('reads a file listed in the registry', function () {
    $result = app(SourceReader::class)->read('app/Lab/ChapterRegistry.php');

    expect($result['contents'])->toContain('class ChapterRegistry')
        ->and($result['lines'])->toBeGreaterThan(10);
});

it('refuses a path that no chapter declares', function () {
    app(SourceReader::class)->read('.env');
})->throws(InvalidArgumentException::class);

it('refuses traversal out of the project', function () {
    app(SourceReader::class)->read('../../etc/passwd');
})->throws(InvalidArgumentException::class);
```

The first test requires `app/Lab/ChapterRegistry.php` to be declared by some chapter. Chapter 0's `serverFile` is its controller, so add the registry file to the allow list explicitly rather than loosening the check: `SourceReader` allows registry `serverFile` and `clientFile` values plus a small fixed list of platform files the chapters point at.

- [ ] **Step 2: Run it to confirm it fails**

```bash
php artisan test --filter=SourceReaderTest
```

Expected: FAIL, `App\Lab\SourceReader` not found.

- [ ] **Step 3: Implement `SourceReader`**

```php
<?php

namespace App\Lab;

use InvalidArgumentException;

class SourceReader
{
    private const PLATFORM_FILES = [
        'app/Lab/ChapterRegistry.php',
        'app/Lab/Lab.php',
        'app/Lab/Trace/LabRecorder.php',
        'app/Http/Middleware/InjectLabTrace.php',
    ];

    public function __construct(private readonly ChapterRegistry $registry) {}

    /** @return array{path: string, contents: string, lines: int} */
    public function read(string $path): array
    {
        if (! in_array($path, $this->allowed(), true)) {
            throw new InvalidArgumentException("Refusing to read [{$path}]: no chapter declares it.");
        }

        $absolute = base_path($path);

        if (! is_file($absolute)) {
            throw new InvalidArgumentException("Declared source file [{$path}] does not exist on disk.");
        }

        $contents = file_get_contents($absolute);

        return [
            'path' => $path,
            'contents' => $contents,
            'lines' => substr_count($contents, "\n") + 1,
        ];
    }

    /** @return array<int, string> */
    private function allowed(): array
    {
        $fromChapters = collect($this->registry->all())
            ->flatMap(fn (Chapter $chapter) => [$chapter->serverFile, $chapter->clientFile])
            ->all();

        return [...self::PLATFORM_FILES, ...$fromChapters];
    }
}
```

The allow list, rather than a path-prefix check, is what makes traversal impossible: `../../etc/passwd` is simply not in the list.

- [ ] **Step 4: Run the tests**

```bash
php artisan test --filter=SourceReaderTest
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Add source reader restricted to registry-declared files"
```

---

### Task 9: Shared TypeScript types and wire capture

**Files:**
- Create: `resources/js/lab/types.ts`, `resources/js/lab/wire-capture.ts`
- Test: manual verification in the browser, plus the type check

**Interfaces:**
- Consumes: the `_lab` payload shape from Task 5 and the `#lab-trace` script from Task 6
- Produces: `installWireCapture(onEntry: (entry: WireEntry) => void): () => void`, `readInitialTrace(): LabTrace | null`, and the `WireEntry`, `LabTrace`, `LifecycleEvent` types

- [ ] **Step 1: Write the types**

`resources/js/lab/types.ts`:

```ts
export type SkippedProp = { type: string; reason: string; explanation: string }

export type ResolvedProp = {
  type: string
  meta: Record<string, unknown>
  ms: number | null
  delayMs: number
  order: number | null
  rescued: boolean
}

export type LabTrace = {
  enabled: boolean
  reason?: string
  props: Record<string, ResolvedProp>
  skipped: Record<string, SkippedProp>
  partial?: {
    component: string | null
    only: string | null
    except: string | null
    exceptOnce: string | null
  }
}

export type WireEntry = {
  id: number
  kind: 'document' | 'visit'
  method: string
  url: string
  status: number
  durationMs: number
  bytes: number
  requestHeaders: Record<string, string>
  responseHeaders: Record<string, string>
  page: Record<string, unknown> | null
  trace: LabTrace | null
}

export type LifecycleEvent = { id: number; name: string; at: number; cancelable: boolean }
```

- [ ] **Step 2: Implement wire capture**

`resources/js/lab/wire-capture.ts`:

```ts
import type { LabTrace, WireEntry } from './types'

const INERTIA_HEADER_PREFIX = 'x-inertia'

let nextId = 1

export function readInitialTrace(): LabTrace | null {
  const tag = document.getElementById('lab-trace')

  if (!tag?.textContent) {
    return null
  }

  try {
    return JSON.parse(tag.textContent) as LabTrace
  } catch {
    return null
  }
}

export function installWireCapture(onEntry: (entry: WireEntry) => void): () => void {
  const original = window.fetch

  window.fetch = async (input, init) => {
    const started = performance.now()
    const response = await original(input, init)

    const requestHeaders = collectHeaders(new Headers(init?.headers))

    if (!('x-inertia' in requestHeaders)) {
      return response
    }

    const clone = response.clone()
    const body = await clone.text()

    let page: Record<string, unknown> | null = null

    try {
      page = JSON.parse(body)
    } catch {
      page = null
    }

    onEntry({
      id: nextId++,
      kind: 'visit',
      method: (init?.method ?? 'GET').toUpperCase(),
      url: typeof input === 'string' ? input : input.toString(),
      status: response.status,
      durationMs: Math.round(performance.now() - started),
      bytes: new Blob([body]).size,
      requestHeaders,
      responseHeaders: collectHeaders(response.headers),
      page,
      trace: (page?.props as { _lab?: LabTrace } | undefined)?._lab ?? null,
    })

    return response
  }

  return () => {
    window.fetch = original
  }
}

function collectHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {}

  headers.forEach((value, key) => {
    const lower = key.toLowerCase()

    if (lower.startsWith(INERTIA_HEADER_PREFIX) || lower === 'content-type' || lower === 'precognition') {
      out[lower] = value
    }
  })

  return out
}
```

Patching `window.fetch` is a teaching device, not a pattern to copy. Inertia 3 replaced Axios with its own fetch-based client, which is why every visit passes through here. The chapter that introduces the strip says this in as many words.

- [ ] **Step 3: Type check**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "Add wire capture and shared lab types"
```

---

### Task 10: The wire strip

**Files:**
- Create: `resources/js/lab/WireStrip.tsx`
- Test: browser verification

**Interfaces:**
- Consumes: Task 9's `installWireCapture`, `readInitialTrace`, and the `router` events from `@inertiajs/react`
- Produces: `<WireStrip />`, mounted once by the chapter shell

- [ ] **Step 1: Implement the component**

Two tabs. Wire lists entries newest first: kind, method, status, duration, byte size, the `X-Inertia-*` headers of the request and the response, the page object with its metadata keys, and the trace with resolved props (type, milliseconds, of which artificial delay) and skipped props (reason and explanation). Lifecycle lists the router events in order with their timestamps.

Subscribe to every event named in the spec:

```tsx
import { router } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { installWireCapture, readInitialTrace } from './wire-capture'
import type { LifecycleEvent, WireEntry } from './types'

const EVENTS = [
  'before', 'start', 'progress', 'beforeUpdate', 'success', 'flash', 'error',
  'httpException', 'networkError', 'finish', 'navigate', 'location',
  'prefetching', 'prefetched', 'cancel',
] as const

const CANCELABLE = new Set(['before', 'httpException', 'networkError', 'location'])

export function WireStrip() {
  const [entries, setEntries] = useState<WireEntry[]>([])
  const [events, setEvents] = useState<LifecycleEvent[]>([])
  const initialTrace = readInitialTrace()

  useEffect(() => installWireCapture((entry) => setEntries((all) => [entry, ...all].slice(0, 25))), [])

  useEffect(() => {
    let id = 0
    const off = EVENTS.map((name) =>
      router.on(name, () => {
        setEvents((all) => [{ id: ++id, name, at: performance.now(), cancelable: CANCELABLE.has(name) }, ...all].slice(0, 60))
      }),
    )

    return () => off.forEach((remove) => remove())
  }, [])

  const [tab, setTab] = useState<'wire' | 'lifecycle'>('wire')
  const trace = entries[0]?.trace ?? initialTrace

  return (
    <section aria-label="Wire" className="fixed inset-x-0 bottom-0 max-h-[40vh] overflow-auto border-t bg-white/95 text-sm dark:bg-neutral-950/95">
      <nav className="flex gap-2 border-b px-3 py-2">
        <button onClick={() => setTab('wire')} aria-pressed={tab === 'wire'}>Wire</button>
        <button onClick={() => setTab('lifecycle')} aria-pressed={tab === 'lifecycle'}>Lifecycle</button>
      </nav>

      {trace && !trace.enabled && (
        <p role="status" className="px-3 py-2 text-amber-700">{trace.reason}</p>
      )}

      {!trace && (
        <p role="status" className="px-3 py-2 text-amber-700">
          No trace found on this page. The lab middleware did not run, so prop resolution cannot be shown.
        </p>
      )}

      {tab === 'wire' ? (
        <ol className="divide-y">
          {entries.length === 0 && <li className="px-3 py-2 text-neutral-500">No Inertia visit yet. Follow a link to record one.</li>}
          {entries.map((entry) => (
            <li key={entry.id} className="px-3 py-2">
              <p>
                {entry.method} {entry.url} <span>{entry.status}</span> <span>{entry.durationMs} ms</span> <span>{entry.bytes} bytes</span>
              </p>
              <dl>
                {Object.entries(entry.requestHeaders).map(([key, value]) => (
                  <div key={key}><dt>request {key}</dt><dd>{value}</dd></div>
                ))}
                {Object.entries(entry.responseHeaders).map(([key, value]) => (
                  <div key={key}><dt>response {key}</dt><dd>{value}</dd></div>
                ))}
              </dl>
              {entry.trace?.enabled && (
                <>
                  <p>Resolved on the server</p>
                  <ul>
                    {Object.entries(entry.trace.props).map(([key, prop]) => (
                      <li key={key}>{key} ({prop.type}) {prop.ms} ms{prop.delayMs > 0 ? ` including ${prop.delayMs} ms of slow mode` : ''}</li>
                    ))}
                  </ul>
                  <p>Skipped by the server</p>
                  <ul>
                    {Object.entries(entry.trace.skipped).map(([key, prop]) => (
                      <li key={key}>{key} ({prop.type}): {prop.reason}. {prop.explanation}</li>
                    ))}
                  </ul>
                </>
              )}
              <details>
                <summary>Page object</summary>
                <pre>{JSON.stringify(entry.page, null, 2)}</pre>
              </details>
            </li>
          ))}
        </ol>
      ) : (
        <ol className="divide-y">
          {events.map((event) => (
            <li key={event.id} className="px-3 py-1">
              {event.name}
              {event.cancelable ? ' (cancelable)' : ''}
              <span> {Math.round(event.at)} ms</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
```

The two `role="status"` branches are the failure rule from the spec in code: a missing trace and a disabled recorder both say so, and neither renders as an empty panel that would read as "nothing happened".

- [ ] **Step 2: Verify in the browser**

Create `.claude/launch.json` with a `inertia-lab` entry running `composer run dev` on the port Vite serves, then start the preview and read the console.

Expected: no console errors, and the strip lists one entry after clicking a link.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "Add the in-page wire strip"
```

---

### Task 11: The round-trip diagram

**Files:**
- Create: `resources/js/lab/RoundTrip.tsx`
- Test: browser verification

**Interfaces:**
- Consumes: the latest `WireEntry` from the strip's state, lifted into the chapter shell
- Produces: `<RoundTrip entry={entry} />`

- [ ] **Step 1: Implement the diagram**

An inline SVG with nine named segments. The component derives their state from the last entry, so the same diagram tells a different story per chapter:

```tsx
import type { WireEntry } from './types'

const SEGMENTS = ['browser', 'request', 'route', 'controller', 'props', 'page-object', 'wire', 'client-router', 'render'] as const

type Segment = (typeof SEGMENTS)[number]

export function describe(entry: WireEntry | null): Record<Segment, { active: boolean; note: string }> {
  if (!entry) {
    return Object.fromEntries(SEGMENTS.map((s) => [s, { active: false, note: 'no visit recorded yet' }])) as never
  }

  const isPrefetch = 'x-inertia-prefetch' in entry.requestHeaders
  const partial = entry.requestHeaders['x-inertia-partial-data'] ?? entry.requestHeaders['x-inertia-partial-except']
  const resolved = Object.keys(entry.trace?.props ?? {}).length
  const skipped = Object.keys(entry.trace?.skipped ?? {}).length

  return {
    browser: { active: !isPrefetch, note: isPrefetch ? 'triggered by prefetch, not by the user' : 'user action' },
    request: { active: true, note: partial ? `partial reload: ${partial}` : `${entry.method} full visit` },
    route: { active: true, note: 'matched by the Laravel router' },
    controller: { active: true, note: 'the same controller a full page load would run' },
    props: { active: true, note: `${resolved} resolved, ${skipped} skipped` },
    'page-object': { active: true, note: `component ${String((entry.page as { component?: string })?.component ?? 'unknown')}` },
    wire: { active: true, note: `${entry.bytes} bytes in ${entry.durationMs} ms` },
    'client-router': { active: true, note: 'swaps props into the current component' },
    render: { active: !isPrefetch, note: isPrefetch ? 'stored in cache, not rendered' : 'React renders with the new props' },
  }
}
```

An inactive segment is drawn dark with its note shown, because "this step did not happen, and here is why" is the lesson.

- [ ] **Step 2: Verify in the browser at three widths**

```
resize_window to mobile, tablet, desktop
```

Expected: the diagram stays readable and the page never scrolls horizontally.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "Add the round-trip diagram"
```

---

### Task 12: The chapter shell, home, glossary and "where did it go?"

**Files:**
- Create: `resources/js/lab/ChapterShell.tsx`, `resources/js/lab/SourceView.tsx`, `resources/js/pages/lab/{home,glossary,where-did-it-go}.tsx`, controller actions in `LabController`
- Modify: `routes/web.php`
- Test: `tests/Feature/Lab/LabPagesTest.php`

**Interfaces:**
- Consumes: `ChapterRegistry`, `SourceReader`
- Produces: routes `lab.home`, `lab.glossary`, `lab.where-did-it-go`; `<ChapterShell chapter={...}>` rendering the fixed section order from the spec

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Lab\ChapterRegistry;
use Inertia\Testing\AssertableInertia;

it('lists every chapter on the home page', function () {
    $this->get(route('lab.home'))->assertInertia(
        fn (AssertableInertia $page) => $page
            ->component('lab/home')
            ->has('chapters', count(app(ChapterRegistry::class)->all()))
    );
});

it('links every row of the where-did-it-go page to a chapter that exists', function () {
    $this->get(route('lab.where-did-it-go'))->assertInertia(function (AssertableInertia $page) {
        $slugs = array_map(fn ($chapter) => $chapter->slug, app(ChapterRegistry::class)->all());

        foreach ($page->toArray()['props']['rows'] as $row) {
            expect($slugs)->toContain($row['chapter']);
        }
    });
});

it('serves the glossary', function () {
    $this->get(route('lab.glossary'))->assertInertia(fn (AssertableInertia $page) => $page->component('lab/glossary')->has('terms'));
});

it('reports the versions actually installed rather than hardcoded ones', function () {
    $adapter = collect(json_decode(file_get_contents(base_path('composer.lock')), true)['packages'])
        ->firstWhere('name', 'inertiajs/inertia-laravel')['version'];

    $this->get(route('lab.home'))->assertInertia(
        fn (AssertableInertia $page) => $page->where('versions.inertiaLaravel', $adapter)->has('versions.inertiaReact')
    );
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
php artisan test --filter=LabPagesTest
```

Expected: FAIL, route `lab.home` not defined.

- [ ] **Step 3: Implement the controller and routes**

```php
<?php

namespace App\Http\Controllers;

use App\Lab\{Chapter, ChapterRegistry, SourceReader};
use Inertia\Inertia;
use Inertia\Response;

class LabController
{
    public function home(ChapterRegistry $registry): Response
    {
        return Inertia::render('lab/home', [
            'chapters' => array_map(fn (Chapter $chapter) => $chapter->toArray(), $registry->all()),
            'versions' => [
                'inertiaLaravel' => collect(json_decode(file_get_contents(base_path('composer.lock')), true)['packages'])
                    ->firstWhere('name', 'inertiajs/inertia-laravel')['version'],
                'inertiaReact' => json_decode(file_get_contents(base_path('node_modules/@inertiajs/react/package.json')), true)['version'],
                'laravel' => app()->version(),
                'php' => PHP_VERSION,
            ],
        ]);
    }

    public function glossary(): Response
    {
        return Inertia::render('lab/glossary', ['terms' => self::TERMS]);
    }

    public function whereDidItGo(): Response
    {
        return Inertia::render('lab/where-did-it-go', ['rows' => self::ROWS]);
    }

    public function source(string $slug, SourceReader $reader, ChapterRegistry $registry): Response
    {
        $chapter = $registry->find($slug) ?? abort(404);

        return Inertia::render('lab/source', [
            'server' => $reader->read($chapter->serverFile),
            'client' => $reader->read($chapter->clientFile),
        ]);
    }
}
```

`self::TERMS` is a fixed array of `['term' => ..., 'definition' => ...]` covering at least: visit, page object, prop, shared prop, partial reload, deferred prop, optional prop, merge intent, asset version, error bag.

`self::ROWS` is a fixed array of `['artefact' => ..., 'inertiaEquivalent' => ..., 'disappears' => bool, 'chapter' => slug]`. It covers, at minimum: REST endpoint, API resource or serializer, client-side router, fetch call, loading state, error state, client cache, cache invalidation, optimistic UI, API contract and versioning, CORS, token authentication, pagination metadata. Every `chapter` value must be a slug present in the registry, which the test asserts. Rows whose chapter is not written yet point at `mental-model` until their chapter lands.

- [ ] **Step 4: Implement `ChapterShell`**

```tsx
import { Link } from '@inertiajs/react'
import type { PropsWithChildren, ReactNode } from 'react'
import { RoundTrip } from './RoundTrip'
import { SourceView } from './SourceView'
import { WireStrip } from './WireStrip'

type ChapterMeta = {
  slug: string
  title: string
  question: string
  concept: string
  translationFrom: string
  translationTo: string
  docsUrl: string
  serverFile: string
  clientFile: string
}

export function ChapterShell({
  chapter,
  tryThis,
  watchFor,
  whenToUse,
  previous,
  next,
  children,
}: PropsWithChildren<{
  chapter: ChapterMeta
  tryThis: ReactNode
  watchFor: ReactNode
  whenToUse: ReactNode
  previous: { slug: string; title: string } | null
  next: { slug: string; title: string } | null
}>) {
  return (
    <article className="mx-auto max-w-4xl space-y-8 p-6 pb-[45vh]">
      <header>
        <h1>{chapter.title}</h1>
        <p>{chapter.question}</p>
      </header>

      <section aria-labelledby="try"><h2 id="try">Try this</h2>{tryThis}</section>

      {children}

      <section aria-labelledby="watch"><h2 id="watch">What to watch</h2>{watchFor}<RoundTrip /></section>

      <section aria-labelledby="translate">
        <h2 id="translate">Coming from an API-first application</h2>
        <p>You would have written: {chapter.translationFrom}</p>
        <p>Here: {chapter.translationTo}</p>
      </section>

      <SourceView serverFile={chapter.serverFile} clientFile={chapter.clientFile} />

      <section aria-labelledby="when"><h2 id="when">When to reach for this</h2>{whenToUse}</section>

      <footer className="flex justify-between">
        {previous ? <Link href={`/chapters/${previous.slug}`}>Previous: {previous.title}</Link> : <span />}
        <a href={chapter.docsUrl} target="_blank" rel="noreferrer">Official documentation</a>
        {next ? <Link href={`/chapters/${next.slug}`}>Next: {next.title}</Link> : <span />}
      </footer>

      <WireStrip />
    </article>
  )
}
```

The section order is fixed and lives only here, so no chapter can drift from the format.

- [ ] **Step 5: Run the tests**

```bash
php artisan test --filter=LabPagesTest
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "Add chapter shell, home, glossary and the where-did-it-go reference"
```

---

### Task 13: Chapter 0, the mental-model switch

**Files:**
- Create: `app/Http/Controllers/Chapters/MentalModelController.php`, `resources/js/pages/chapters/mental-model.tsx`
- Modify: `routes/web.php`
- Test: `tests/Feature/Chapters/MentalModelTest.php`

**Interfaces:**
- Consumes: `Lab`, `ChapterRegistry`, `ChapterShell`
- Produces: route `chapters.mental-model`, and the source-file assertion that Task 3 deliberately deferred to here

This task also adds to `tests/Feature/Lab/ChapterRegistryTest.php`, now that the files it guards exist:

```php
it('points every chapter at source files that exist', function () {
    foreach (app(App\Lab\ChapterRegistry::class)->all() as $chapter) {
        expect(file_exists(base_path($chapter->serverFile)))->toBeTrue("missing {$chapter->serverFile}")
            ->and(file_exists(base_path($chapter->clientFile)))->toBeTrue("missing {$chapter->clientFile}");
    }
});
```

- [ ] **Step 1: Write the failing test**

```php
<?php

use Inertia\Testing\AssertableInertia;

it('renders the chapter with its teaching metadata and props of three kinds', function () {
    $this->get(route('chapters.mental-model'))->assertInertia(
        fn (AssertableInertia $page) => $page
            ->component('chapters/mental-model')
            ->has('chapter.question')
            ->has('chapter.translationFrom')
            ->has('posts')
            ->has('_lab.props.posts')
            ->has('_lab.skipped.expensiveStats')
    );
});

it('resolves the deferred prop only when it is asked for', function () {
    $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => '',
        'X-Inertia-Partial-Component' => 'chapters/mental-model',
        'X-Inertia-Partial-Data' => 'expensiveStats',
    ])->get(route('chapters.mental-model'))
        ->assertInertia(fn (AssertableInertia $page) => $page->has('expensiveStats')->has('_lab.props.expensiveStats'));
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
php artisan test --filter=MentalModelTest
```

Expected: FAIL, route not defined.

- [ ] **Step 3: Implement the controller**

```php
<?php

namespace App\Http\Controllers\Chapters;

use App\Lab\{ChapterRegistry, Lab};
use App\Models\Post;
use Inertia\Inertia;
use Inertia\Response;

class MentalModelController
{
    public function __invoke(Lab $lab, ChapterRegistry $registry): Response
    {
        return Inertia::render('chapters/mental-model', [
            'chapter' => $registry->find('mental-model')->toArray(),
            'posts' => $lab->closure('posts', fn () => Post::query()
                ->with('author:id,name')
                ->latest('published_at')
                ->take(5)
                ->get(['id', 'user_id', 'title', 'excerpt', 'published_at'])),
            'expensiveStats' => $lab->defer('expensiveStats', fn () => [
                'posts' => Post::count(),
                'views' => Post::sum('views'),
            ]),
        ]);
    }
}
```

- [ ] **Step 4: Implement the page component**

```tsx
import { router } from '@inertiajs/react'
import { ChapterShell } from '@/lab/ChapterShell'

const FAMILIAR = `function Posts() {
  const [posts, setPosts] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/posts')
      .then((r) => r.json())
      .then(setPosts)
      .catch(setError)
  }, [])

  if (error) return <Error error={error} />
  if (!posts) return <Spinner />

  return <List posts={posts} />
}`

const ACTUAL = `function Posts({ posts }) {
  return <List posts={posts} />
}`

export default function MentalModel({ chapter, posts, expensiveStats, previous, next }) {
  return (
    <ChapterShell
      chapter={chapter}
      previous={previous}
      next={next}
      tryThis={
        <button onClick={() => router.reload({ only: ['expensiveStats'] })}>
          Ask the server for the deferred statistics
        </button>
      }
      watchFor={
        <p>
          The strip below shows one request. Its trace lists posts as resolved and expensiveStats as skipped,
          with the reason. Press the button and a second request appears, carrying X-Inertia-Partial-Data.
        </p>
      }
      whenToUse={<p>This is not a feature to choose. It is how every screen in this application works.</p>}
    >
      <section>
        <h2>The path you expect</h2>
        <pre>{FAMILIAR}</pre>
        <h2>The path that just ran</h2>
        <pre>{ACTUAL}</pre>
        <p>The posts are already here: {posts.length} of them, passed as an argument.</p>
        {expensiveStats ? <p>Statistics arrived in a second request: {expensiveStats.posts} posts.</p> : null}
      </section>

      <section>
        <h2>Three things that surprise people</h2>
        <ol>
          <li>There is no endpoint for this screen. The URL you are on is the only one involved.</li>
          <li>The component never fetches anything. It receives data the way a function receives arguments.</li>
          <li>The server decides what the client receives, per request, and can skip work the client did not ask for.</li>
        </ol>
      </section>
    </ChapterShell>
  )
}
```

The left column describes a familiar approach, not a straw man. The chapter makes no claim that either approach is better, and the words "boilerplate" and "simpler" do not appear.

- [ ] **Step 5: Run the tests**

```bash
php artisan test --filter=MentalModelTest
php artisan test --filter=ChapterRegistryTest
```

Expected: both PASS. The registry test's file-existence assertion now passes.

- [ ] **Step 6: Verify in the browser**

Start the preview, open the chapter, click the deferred prop control, and confirm in the wire strip that a second request carries `X-Inertia-Partial-Data: expensiveStats` and that the trace moves `expensiveStats` from skipped to resolved.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "Add chapter 0: where did the API go"
```

---

### Task 14: README and full verification

**Files:**
- Create: `README.md`
- Test: the whole suite, plus a browser pass

- [ ] **Step 1: Write the README**

Contents: what the lab is and who it is for; the one-command setup (`git clone`, `composer install`, `npm install`, `npm run build` or `composer run dev`); how to read a chapter; the note that the app patches `window.fetch` as a teaching device and that this is not a pattern to copy; the paragraph on why there is no SSR chapter (internal application, no SEO requirement, and the reader should not infer that Inertia lacks SSR); the installed versions and the version floor rule; how to enable the official Inertia DevTools extension.

- [ ] **Step 2: Run the whole suite**

```bash
php artisan test
```

Expected: all green. Report the actual count in the commit message.

- [ ] **Step 3: Verify the app runs from a clean state**

```bash
rm -f database/database.sqlite && touch database/database.sqlite
php artisan migrate --seed --force
npm run build
```

Expected: no errors.

- [ ] **Step 4: Browser pass**

Start the preview, walk the home page, chapter 0, the glossary and the "where did it go?" page. Read the console for errors. Take a screenshot of chapter 0 with the wire strip populated.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Add README and complete wave 1 platform"
```

---

## What comes next

Two further plans complete wave 1, both written against this platform:

- **Wave 1 part 2, protocol chapters:** chapters 1 to 6 of the spec (first load versus visit, responses and routing, redirects, links and manual visits, events, asset versioning).
- **Wave 1 part 3, the prop taxonomy:** chapters 7 to 16 (plain values and closures, shared data, partial reloads, optional, deferred with groups and rescue, always, merging, infinite scroll, once, polling).

Each new chapter is one registry entry, one thin controller, one page component and one test. The platform does not change.
