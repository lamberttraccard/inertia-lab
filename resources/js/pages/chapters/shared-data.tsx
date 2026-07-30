import { router } from '@inertiajs/react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';
import type { ChapterData, Neighbour } from './types';

type DemoUser = { id: number; name: string; email: string };

type DemoUserOption = { id: number; name: string };

type SharedDataProps = {
    chapter: ChapterData;
    demoUser: DemoUser;
    unreadNotifications: number;
    demoUserOptions: DemoUserOption[];
    previous: Neighbour | null;
    next: Neighbour | null;
};

export default function SharedData({
    chapter,
    demoUser,
    unreadNotifications,
    demoUserOptions,
    previous,
    next,
}: SharedDataProps) {
    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-neutral-500">
                            Switch demo user:
                        </span>
                        {demoUserOptions.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                disabled={option.id === demoUser.id}
                                onClick={() =>
                                    router.post(
                                        '/chapters/shared-data/switch-user',
                                        { user_id: option.id },
                                    )
                                }
                                className="rounded border border-neutral-400 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-neutral-600"
                            >
                                {option.name}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() =>
                            router.reload({ only: ['unreadNotifications'] })
                        }
                        className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                    >
                        Reload asking only for unreadNotifications
                    </button>
                </div>
            }
            watchFor={
                <p className="mt-2">
                    Switching users is a real visit: the redirect it returns is
                    followed by a GET, and that response carries demoUser and
                    unreadNotifications recomputed for whoever you just switched
                    to. Open a second chapter afterward and the same values
                    follow you there, because{' '}
                    <Term term="Shared prop">every page shares them</Term>, not
                    just this one. The second button sends
                    X-Inertia-Partial-Data: unreadNotifications; in the trace
                    below, demoUser moves to skipped with &quot;not requested by
                    only&quot;, the same rule a page-owned prop follows.
                    Inertia::share() does not exempt anything from that filter.
                </p>
            }
            whenToUse={
                <p>
                    Reach for Inertia::share() for anything genuinely global:
                    who is signed in, a notification count, feature flags. A
                    value only one page needs belongs on that page's own props
                    instead, the way every earlier chapter's props do.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">
                    Where these three props come from
                </h2>
                <p className="mt-1">
                    demoUser, unreadNotifications and demoUserOptions never
                    appear in SharedDataController. All three are added by{' '}
                    <code className="font-mono">
                        App\Http\Middleware\HandleInertiaRequests
                    </code>
                    , the same middleware every request in this application
                    already passes through, extended rather than joined by a
                    second one. This lab is not a real login system: the demo
                    user is a row picked by an id this chapter stores in the
                    session, standing in for whatever your own authentication
                    guard would return from{' '}
                    <code className="font-mono">{'$request->user()'}</code>.
                </p>
                <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                    <div>
                        <dt className="font-medium">
                            demoUser, a <Term term="Shared prop">shared</Term>{' '}
                            plain value
                        </dt>
                        <dd>
                            #{demoUser.id} {demoUser.name} ({demoUser.email})
                        </dd>
                    </div>
                    <div>
                        <dt className="font-medium">
                            unreadNotifications, a shared closure
                        </dt>
                        <dd>{unreadNotifications}</dd>
                    </div>
                </dl>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    share(), shareOnce(), and why they differ
                </h2>
                <p className="mt-1">
                    HandleInertiaRequests::share() returns demoUser as a plain
                    value and unreadNotifications as a closure: both are
                    computed again on every request that includes them, because
                    a signed-in count going stale mid-session would be a worse
                    bug than recomputing it. demoUserOptions is different: it is
                    the switcher&apos;s own list of who is available, added
                    through HandleInertiaRequests::shareOnce() instead, so the
                    client is sent it once and asked for it again only if it
                    says it no longer holds it.
                </p>
            </section>
        </ChapterShell>
    );
}
