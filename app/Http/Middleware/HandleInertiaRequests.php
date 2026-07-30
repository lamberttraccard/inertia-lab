<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     *
     * The chapters/asset-versioning demo needs a version this app can change at request
     * time, which a manifest hash cannot do: the override lives in the session so the
     * chapter's own bump and reset actions can set and clear it without touching the
     * actual build. This reads through the global session() helper rather than
     * $request->session(): Inertia\Middleware::handle() calls this from inside a closure
     * evaluated by Inertia::getVersion(), which currentInertiaVersion() in tests/Pest.php
     * also invokes directly against a bare Request::create('/') that never passed through
     * the session middleware, and $request->session() throws on a request like that.
     * session() has a genuinely mixed return type here (whatever was last stored), so the
     * string check is a real narrowing step, not decoration.
     */
    public function version(Request $request): ?string
    {
        $override = session('lab.asset_version_override');

        return is_string($override) ? $override : parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
        ];
    }
}
