<?php

namespace App\Providers;

use App\Http\Middleware\HandleInertiaRequests;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Inertia\ExceptionResponse;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureInertiaExceptionHandling();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    /**
     * Scoped to chapters/error-handling/* so this stays a demonstration rather than a
     * behaviour change: chapters 2 and 5 already rely on the framework's default handling
     * (no X-Inertia header, the client's own dialog) to make their own points, and a
     * global registration here would turn every one of those into a rendered Inertia page
     * instead, silently invalidating both chapters and their tests.
     */
    protected function configureInertiaExceptionHandling(): void
    {
        Inertia::handleExceptionsUsing(function (ExceptionResponse $exceptionResponse) {
            if (! $exceptionResponse->request->is('chapters/error-handling/*')) {
                return null;
            }

            return $exceptionResponse
                ->render('chapters/error-handling-page', [
                    'status' => $exceptionResponse->statusCode(),
                    'message' => $exceptionResponse->exception->getMessage(),
                    'requestPath' => '/'.$exceptionResponse->request->path(),
                ])
                // Named explicitly rather than left to resolveMiddlewareFromKernel()'s
                // fallback: that fallback only works here because HandleInertiaRequests
                // happens to sit directly in the kernel's web group (bootstrap/app.php),
                // which would not be true if it were registered inside a route group instead.
                ->usingMiddleware(HandleInertiaRequests::class)
                ->rootView('app')
                // Required for the unmatched-route case: a 404 here never runs this app's
                // web middleware at all (verified empirically: Illuminate\Routing\Router::
                // findRoute() throws NotFoundHttpException from inside dispatchToRoute(),
                // before runRouteWithinStack() ever builds that route's middleware pipeline),
                // so HandleInertiaRequests::share() never ran and Inertia::getShared() is
                // empty until this call runs it directly. A 500 thrown from inside a matched
                // route already has shared data by this point, so this call is redundant
                // there, not harmful: ResponseFactory::share() only ever merges keys in.
                ->withSharedData();
        });
    }
}
