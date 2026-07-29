<?php

namespace App\Providers;

use App\Lab\Lab;
use App\Lab\Trace\TraceCollector;
use Illuminate\Support\ServiceProvider;

class LabServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->scoped(TraceCollector::class, fn () => new TraceCollector);
        $this->app->scoped(Lab::class, fn ($app) => new Lab($app->make(TraceCollector::class)));
    }
}
