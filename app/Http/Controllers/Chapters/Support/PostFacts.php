<?php

namespace App\Http\Controllers\Chapters\Support;

use App\Lab\Lab;
use App\Models\Post;
use Inertia\ProvidesInertiaProperties;
use Inertia\RenderContext;

// The chapter's example of Inertia\ProvidesInertiaProperties: contributes more than one
// top-level prop from a single object. Verified against
// vendor/inertiajs/inertia-laravel/src/ProvidesInertiaProperties.php and PropsResolver::
// resolvePropertyProviders(), which only expands an instance placed at a numeric array
// key, so the controller must add this without a string key of its own.
readonly class PostFacts implements ProvidesInertiaProperties
{
    public function __construct(private Post $post, private Lab $lab) {}

    /** @return iterable<string, mixed> */
    public function toInertiaProperties(RenderContext $context): iterable
    {
        // resolvePropertyProviders() calls this unconditionally, on every request, before
        // partial-reload filtering runs on the props it yields: a class doing real work
        // here would pay that cost even when neither key is requested. Wrapping each
        // value through Lab keeps that cost visible in the trace below rather than hidden.
        return [
            'excerptLength' => $this->lab->value('excerptLength', mb_strlen($this->post->excerpt)),
            'hasCoverImage' => $this->lab->value('hasCoverImage', $this->post->cover_path !== null),
        ];
    }
}
