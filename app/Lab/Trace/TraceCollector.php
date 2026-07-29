<?php

namespace App\Lab\Trace;

class TraceCollector
{
    /** @var array<string, array{type: string, meta: array<string, mixed>, ms: float|null, order: int|null}> */
    private array $declared = [];

    /** @var array<int, string> */
    private array $resolved = [];

    private int $counter = 0;

    /** @param array<string, mixed> $meta */
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
