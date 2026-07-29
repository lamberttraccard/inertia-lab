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
