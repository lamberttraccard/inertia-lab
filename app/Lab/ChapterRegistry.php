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
        $index = $this->indexOf($slug);

        return $index === false ? null : ($this->all()[$index + 1] ?? null);
    }

    public function previous(string $slug): ?Chapter
    {
        $index = $this->indexOf($slug);

        return $index === false || $index === 0 ? null : $this->all()[$index - 1];
    }

    private function indexOf(string $slug): int|false
    {
        return array_search($slug, array_map(fn (Chapter $chapter) => $chapter->slug, $this->all()), true);
    }
}
