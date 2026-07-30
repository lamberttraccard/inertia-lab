<?php

namespace App\Lab;

use App\Lab\Trace\TraceCollector;
use Closure;
use Inertia\AlwaysProp;
use Inertia\DeferProp;
use Inertia\Inertia;
use Inertia\MergeProp;
use Inertia\OnceProp;
use Inertia\OptionalProp;
use Inertia\ProvidesScrollMetadata;
use Inertia\ScrollProp;

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

    public function defer(string $key, callable $callback, string $group = 'default', bool $rescue = false): DeferProp
    {
        $this->trace->declare($key, 'defer', ['group' => $group, 'rescue' => $rescue]);

        return Inertia::defer(fn () => $this->trace->time($key, $callback), $group, $rescue);
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

    public function deepMerge(string $key, mixed $value): MergeProp
    {
        $this->trace->declare($key, 'deepMerge');

        return Inertia::deepMerge($this->wrap($key, $value));
    }

    /** @return ScrollProp<mixed> */
    public function scroll(string $key, mixed $value, string $wrapper = 'data', ProvidesScrollMetadata|callable|null $metadata = null): ScrollProp
    {
        $this->trace->declare($key, 'scroll', ['wrapper' => $wrapper]);

        return Inertia::scroll($this->wrap($key, $value), $wrapper, $metadata);
    }

    public function once(string $key, callable $callback): OnceProp
    {
        $this->trace->declare($key, 'once');

        return Inertia::once(fn () => $this->trace->time($key, $callback));
    }

    private function wrap(string $key, mixed $value): mixed
    {
        return (is_object($value) && is_callable($value))
            ? fn () => $this->trace->time($key, $value)
            : $value;
    }
}
