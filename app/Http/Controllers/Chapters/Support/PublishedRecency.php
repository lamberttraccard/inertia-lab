<?php

namespace App\Http\Controllers\Chapters\Support;

use Carbon\CarbonInterface;
use Inertia\PropertyContext;
use Inertia\ProvidesInertiaProperty;

// The chapter's example of Inertia\ProvidesInertiaProperty: a small class standing in for
// the serializer or resource class an API-first app would write, verified against
// vendor/inertiajs/inertia-laravel/src/ProvidesInertiaProperty.php and PropertyContext.php.
readonly class PublishedRecency implements ProvidesInertiaProperty
{
    public function __construct(private ?CarbonInterface $publishedAt) {}

    public function toInertiaProperty(PropertyContext $prop): mixed
    {
        return [
            'label' => $this->publishedAt?->diffForHumans() ?? 'not yet published',
            // Proves this object really receives the path Inertia resolved it under, not a
            // guess: $prop->key is PropertyContext's own property, read back here unchanged.
            'resolvedAsProp' => $prop->key,
        ];
    }
}
