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
        public Part $part,
        public int $order,
    ) {}

    /**
     * Explicit rather than get_object_vars($this) alone: the chapter header needs the
     * part's own label (e.g. "The prop taxonomy"), and computing it here, once, is the
     * single place that can never drift from Part::label() the way a second copy on the
     * frontend could.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [...get_object_vars($this), 'partLabel' => $this->part->label()];
    }
}
