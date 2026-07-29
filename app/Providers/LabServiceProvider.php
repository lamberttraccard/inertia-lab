<?php

namespace App\Providers;

use App\Lab\Lab;
use App\Lab\Trace\LabRecorder;
use App\Lab\Trace\TraceCollector;
use Illuminate\Support\ServiceProvider;
use Inertia\DevTools\RequestRecorder;

class LabServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->scoped(TraceCollector::class, fn () => new TraceCollector);
        $this->app->scoped(Lab::class, fn ($app) => new Lab($app->make(TraceCollector::class)));
    }

    public function boot(): void
    {
        $this->app->scoped(RequestRecorder::class, fn ($app) => new LabRecorder($app->make(TraceCollector::class)));
    }
}
