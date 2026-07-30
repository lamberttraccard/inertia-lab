<?php

namespace App\Lab\Trace;

use App\Lab\SlowMode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Inertia\DevTools\DevTools;
use Inertia\Support\Header;

class TraceCollector
{
    /** @var array<string, array{type: string, meta: array<string, mixed>, ms: float|null, delayMs: int, order: int|null}> */
    private array $declared = [];

    /** @var array<int, string> */
    private array $resolved = [];

    /** @var array<int, string> */
    private array $rescued = [];

    /** @var array<string, mixed> */
    private array $page = [];

    private int $counter = 0;

    /** @param array<string, mixed> $meta */
    public function declare(string $key, string $type, array $meta = []): void
    {
        $this->declared[$key] = ['type' => $type, 'meta' => $meta, 'ms' => null, 'delayMs' => 0, 'order' => null];
    }

    public function time(string $key, callable $callback): mixed
    {
        $delay = app(SlowMode::class)->delayMs();

        if ($delay > 0) {
            usleep($delay * 1000);
        }

        $started = hrtime(true);

        try {
            // Mirrors Inertia\ResolvesCallables::resolveCallable(): props resolve through
            // App::call() there, so a closure that type-hints an injectable parameter must
            // resolve here the same way, not just when running through real Inertia.
            return $this->useAsCallable($callback) ? App::call($callback) : $callback();
        } finally {
            if (isset($this->declared[$key])) {
                $this->declared[$key]['ms'] = round((hrtime(true) - $started) / 1_000_000, 2) + $delay;
                $this->declared[$key]['delayMs'] = $delay;
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

    public function markRescued(string $path): void
    {
        $this->rescued[] = $path;
    }

    /** @param array<string, mixed> $page */
    public function pageRendered(array $page): void
    {
        $this->page = $page;
    }

    /** @return array<string, array{type: string, meta: array<string, mixed>, ms: float|null, delayMs: int, order: int|null}> */
    public function declared(): array
    {
        return $this->declared;
    }

    /** @return array<int, string> */
    public function resolved(): array
    {
        return array_values(array_unique($this->resolved));
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

    /**
     * A rescued path never reaches resolved(): PropsResolver::resolveProps() calls
     * propRescued() and continues before propResolved() would ever run, so this is
     * checked before anything else, and it can never collide with the reasons below
     * (reaching resolveValue() at all already means it passed every exclusion check
     * those reasons describe).
     *
     * Inertia's PropsResolver only runs the defer/optional/once exclusion machinery
     * (excludeFromInitialResponse) when the request is not a partial reload of the
     * current component: resolveProps() guards that call with `! $this->isPartial`.
     * On a partial reload, the sole reason a prop is missing is the only/except
     * filter, regardless of its declared type, so that must be checked first, and
     * pathMatchesPartialRequest() checks an only mismatch before an except match
     * (the except check is only reached once the only check has already passed).
     *
     * @param  array{type: string, meta: array<string, mixed>, ms: float|null, delayMs: int, order: int|null}  $entry
     */
    private function skipReason(string $key, array $entry, Request $request): SkipReason
    {
        if (in_array($key, $this->rescued, true)) {
            return SkipReason::Rescued;
        }

        $component = $this->page['component'] ?? null;
        $isPartial = $component !== null && $request->header(Header::PARTIAL_COMPONENT) === $component;

        if ($isPartial) {
            $only = array_filter(explode(',', (string) $request->header(Header::PARTIAL_ONLY)));
            $except = array_filter(explode(',', (string) $request->header(Header::PARTIAL_EXCEPT)));

            return match (true) {
                $only !== [] && ! in_array($key, $only, true) => SkipReason::NotRequested,
                in_array($key, $except, true) => SkipReason::Excluded,
                default => SkipReason::NotRequested,
            };
        }

        $exceptOnce = array_filter(explode(',', (string) $request->header(Header::EXCEPT_ONCE_PROPS)));

        return match (true) {
            in_array($key, $exceptOnce, true) => SkipReason::AlreadyHeld,
            $entry['type'] === 'defer' => SkipReason::Deferred,
            $entry['type'] === 'optional' => SkipReason::Optional,
            default => SkipReason::NotRequested,
        };
    }

    private function useAsCallable(mixed $value): bool
    {
        return is_object($value) && is_callable($value);
    }
}
