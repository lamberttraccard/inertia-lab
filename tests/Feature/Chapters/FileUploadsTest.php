<?php

use App\Models\Post;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    // DevTools::enabled() defaults to app()->environment('local'), which the testing
    // environment is not, so the trace stays off (and says so) unless a test opts in.
    config()->set('inertia.devtools.enabled', true);

    // The fake disk never touches storage/app/public: every assertion below reads back
    // from this in-memory fake, not from real disk, exactly per the brief for this chapter.
    Storage::fake('public');

    // HandleInertiaRequests::currentDemoUser() falls back to an unpersisted placeholder
    // (id 0) when the users table is empty, which posts.user_id's foreign key rejects.
    User::factory()->create();
});

it('renders the chapter with no cover recorded before any upload and no unexpected props', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => currentInertiaVersion(),
    ])->get(route('chapters.file-uploads'));

    $response->assertOk();

    // assertInertia() is deliberately not used here: see inertiaPage()'s docblock in
    // tests/Pest.php for why it cannot survive devtools being enabled.
    $page = assertInertiaPage($response, 'chapters/file-uploads');
    $trace = labTrace($response);

    expect($page['props']['coverPath'])->toBeNull()
        ->and($page['props']['coverUrl'])->toBeNull();

    // Verified empirically against this exact route (see the debug trace taken from
    // chapters/first-load-vs-visit for the shared baseline): errors, name, auth, demoUser,
    // unreadNotifications and demoUserOptions are the platform's own shared props, added
    // to every page regardless of this chapter; chapter, previous and next are the
    // standard chapter metadata every chapter passes; coverPath and coverUrl are this
    // chapter's own. Nothing else is added here.
    expect(array_keys($page['props']))->toEqualCanonicalizing([
        'errors', 'name', 'auth', 'demoUser', 'unreadNotifications', 'demoUserOptions',
        'chapter', 'previous', 'next', 'coverPath', 'coverUrl', '_lab',
    ])
        ->and(array_keys($trace['props']))->toEqualCanonicalizing([
            'demoUser', 'unreadNotifications', 'demoUserOptions',
            'chapter', 'previous', 'next', 'coverPath', 'coverUrl',
        ]);

    // Visiting the page is a GET and must not itself create the demo row.
    expect(Post::query()->count())->toBe(0);
});

it('rejects a non-image upload, storing no file and creating no row', function () {
    $file = UploadedFile::fake()->create('notes.txt', 10, 'text/plain');

    $response = $this->withHeaders(['referer' => route('chapters.file-uploads')])
        ->post(route('chapters.file-uploads.store'), ['cover' => $file]);

    $response->assertRedirect(route('chapters.file-uploads'));

    expect(Storage::disk('public')->allFiles('covers'))->toBeEmpty()
        ->and(Post::query()->count())->toBe(0);
});

it('stores the uploaded cover on the fake disk and records its path on the demo post', function () {
    $file = UploadedFile::fake()->image('cover.jpg', 800, 600);

    $response = $this->post(route('chapters.file-uploads.store'), ['cover' => $file]);

    $response->assertRedirect(route('chapters.file-uploads'));

    $post = Post::query()->sole();

    expect($post->cover_path)->not->toBeNull();
    Storage::disk('public')->assertExists($post->cover_path);

    $reload = $this->get(route('chapters.file-uploads'));
    $page = assertInertiaPage($reload, 'chapters/file-uploads');

    expect($page['props']['coverPath'])->toBe($post->cover_path)
        ->and($page['props']['coverUrl'])->not->toBeNull();
});

it('deletes the previous cover file when a second upload replaces it, keeping exactly one demo row', function () {
    $this->post(route('chapters.file-uploads.store'), [
        'cover' => UploadedFile::fake()->image('first.jpg'),
    ]);

    $post = Post::query()->sole();
    $firstPath = $post->cover_path;

    $this->post(route('chapters.file-uploads.store'), [
        'cover' => UploadedFile::fake()->image('second.jpg'),
    ]);

    $post->refresh();

    // Reversible, not accumulating: the disk never holds more than the one cover this
    // chapter's demo post currently points at, no matter how many times it is replaced.
    expect($post->cover_path)->not->toBe($firstPath);
    Storage::disk('public')->assertMissing($firstPath);
    Storage::disk('public')->assertExists($post->cover_path);
    expect(Post::query()->count())->toBe(1);
});
