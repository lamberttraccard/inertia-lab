import { router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';
import type { ChapterData, DemoUser, DemoUserOption, Neighbour } from './types';

type Post = { id: number; title: string; authorName: string };

type Can = { update: boolean; delete: boolean };

type AuthorizationAndCsrfProps = {
    chapter: ChapterData;
    post: Post;
    can: Can;
    demoUser: DemoUser;
    demoUserOptions: DemoUserOption[];
    previous: Neighbour | null;
    next: Neighbour | null;
};

function RenameForm({ post, can }: { post: Post; can: Can }) {
    const form = useForm({ title: post.title });

    function save(event: FormEvent) {
        event.preventDefault();
        form.patch(`/chapters/authorization-and-csrf/${post.id}`, {
            preserveScroll: true,
        });
    }

    function saveWithBadToken() {
        // Same technique as chapter 29: overwriting the cookie with plain text is what
        // makes PreventRequestForgery::getTokenFromRequest() fail to decrypt it, producing
        // a real CSRF mismatch rather than a simulated one.
        document.cookie = 'XSRF-TOKEN=deliberately-invalid-token; path=/';
        form.patch(`/chapters/authorization-and-csrf/${post.id}`, {
            preserveScroll: true,
        });
    }

    return (
        <form onSubmit={save} className="space-y-2">
            <label className="block text-sm">
                Title
                <input
                    type="text"
                    value={form.data.title}
                    onChange={(event) =>
                        form.setData('title', event.target.value)
                    }
                    disabled={!can.update}
                    className="mt-1 block w-full rounded border border-neutral-400 px-2 py-1 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900"
                />
            </label>
            <div className="flex flex-wrap gap-3">
                <button
                    type="submit"
                    disabled={!can.update || form.processing}
                    className="rounded border border-neutral-400 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-neutral-600"
                >
                    Save title
                </button>
                <button
                    type="button"
                    onClick={saveWithBadToken}
                    disabled={!can.update || form.processing}
                    className="rounded border border-neutral-400 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-neutral-600"
                >
                    Save with a wrong CSRF token (419)
                </button>
            </div>
        </form>
    );
}

export default function AuthorizationAndCsrf({
    chapter,
    post,
    can,
    demoUser,
    demoUserOptions,
    previous,
    next,
}: AuthorizationAndCsrfProps) {
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
                    <RenameForm key={post.id} post={post} can={can} />
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            disabled={!can.delete}
                            onClick={() =>
                                router.delete(
                                    `/chapters/authorization-and-csrf/${post.id}`,
                                    { preserveScroll: true },
                                )
                            }
                            className="rounded border border-neutral-400 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-neutral-600"
                        >
                            Delete this post
                        </button>
                        <button
                            type="button"
                            onClick={() => router.reload()}
                            className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                        >
                            Reload to restore a valid session
                        </button>
                    </div>
                </div>
            }
            watchFor={
                <p className="mt-2">
                    You are signed in as {demoUser.name}. This post belongs to{' '}
                    {post.authorName}. can.update is {String(can.update)},
                    can.delete is {String(can.delete)}: both false whenever
                    demoUser is not the author, both computed on this exact
                    request by <Term term="Policy">a real policy</Term>, not
                    hardcoded on this page. Switching demo user changes them
                    immediately, because the buttons above read the props this
                    request just received. Saving with a wrong token opens the
                    client&apos;s own error dialog, the same one chapter 5 and
                    chapter 29 show for a non-Inertia or thrown response:
                    dismiss it by clicking outside it, then use the reload
                    button to get a fresh, valid token before trying again.
                </p>
            }
            whenToUse={
                <p>
                    Compute can as a prop whenever a page needs to know, up
                    front, whether to show or disable an action: it saves a
                    round trip that would otherwise fail. Never treat it as the
                    enforcement itself. rename() and destroy() both call
                    Gate::forUser()-&gt;authorize() again on the server, so a
                    request that reached the route directly, bypassing this page
                    entirely, is still rejected exactly the same way.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">
                    Identity without a token
                </h2>
                <p className="mt-1">
                    Nothing above sends a bearer token or an Authorization
                    header. Switching the demo user is a POST that changes the
                    session (the same <Term term="Shared prop">shared</Term>{' '}
                    switcher chapter 8 introduced), and every request afterward,
                    including the rename and delete actions below, carries that
                    session automatically through the browser&apos;s cookies.
                    The policy this page checks reads whichever user the session
                    currently names, not a claim decoded from a request header.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    Two protections, not one
                </h2>
                <p className="mt-1">
                    Authorization and CSRF answer different questions and fail
                    differently. can.update being true only means the policy
                    allows this demoUser to update this post; it says nothing
                    about whether the specific request that follows will carry a
                    valid token. The wrong-token button above only appears
                    active when can.update is already true, so a rejection from
                    it is never explained by authorization: the request would
                    have succeeded if the token had been valid, and fails only
                    because PreventRequestForgery runs before rename() ever gets
                    a chance to check the policy at all.
                </p>
            </section>
        </ChapterShell>
    );
}
