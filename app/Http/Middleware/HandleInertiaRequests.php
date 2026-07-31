<?php

namespace App\Http\Middleware;

use App\Lab\ChapterRegistry;
use App\Lab\Lab;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Inertia\OnceProp;

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

    // Middleware::handle() calls $this->share($request) and $this->shareOnce($request)
    // directly rather than through the container, so this constructor must stay
    // compatible with that: Laravel still resolves HandleInertiaRequests itself through
    // the container for every request, which is what lets Lab arrive here already scoped
    // to the same request the controller's own Lab $lab parameter resolves to.
    public function __construct(private readonly Lab $lab, private readonly ChapterRegistry $registry) {}

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
        $demoUser = self::currentDemoUser();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            // The chapter header's "Chapter N of 33" needs the roster's own size, not a
            // number copied by hand: it is a plain value, like name above, because
            // counting an in-memory array costs nothing worth tracing or skipping.
            'totalChapters' => count($this->registry->all()),
            // chapters/shared-data switches this session value and reads it back; every
            // other chapter's test proves the switch reached it too, since this runs on
            // every request regardless of which controller is about to handle it.
            'demoUser' => $this->lab->value('demoUser', [
                'id' => $demoUser->id,
                'name' => $demoUser->name,
                'email' => $demoUser->email,
            ]),
            // A shared prop is merged into the same array a controller's own props are,
            // before any partial-reload filtering runs, so this closure is skipped, not
            // evaluated, on a partial reload that does not name it, the same as any
            // page-owned closure prop.
            'unreadNotifications' => $this->lab->closure(
                'unreadNotifications',
                fn () => Notification::query()
                    ->where('user_id', self::currentDemoUser()->id)
                    ->whereNull('read_at')
                    ->count(),
            ),
        ];
    }

    /**
     * Define the props that are shared once and remembered across navigations.
     *
     * @return array<string, callable|OnceProp>
     */
    public function shareOnce(Request $request): array
    {
        return [
            // The switcher's own option list: who is available to switch to does not
            // change from one request to the next, so it is sent once per client rather
            // than recomputed on every single response the way demoUser itself is.
            'demoUserOptions' => $this->lab->once(
                'demoUserOptions',
                fn () => User::query()->orderBy('id')->get(['id', 'name'])->all(),
            ),
        ];
    }

    /**
     * The session holds only an id, the smallest thing that can go stale: the row itself,
     * and whatever the reader sees for it, is always read fresh on every request.
     */
    public static function currentDemoUser(): User
    {
        $id = session('lab.demo_user_id');

        if (is_int($id) || is_string($id)) {
            $user = User::query()->find($id);

            if ($user !== null) {
                return $user;
            }
        }

        $fallback = User::query()->orderBy('id')->first();

        if ($fallback !== null) {
            return $fallback;
        }

        $placeholder = new User(['name' => 'Demo Reader', 'email' => 'demo@example.test']);
        $placeholder->id = 0;

        return $placeholder;
    }
}
