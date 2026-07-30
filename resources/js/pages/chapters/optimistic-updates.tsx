import { router } from '@inertiajs/react';
import { useState } from 'react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';
import type { ChapterData, Neighbour } from './types';

type LikeableCard = {
    label: string;
    likes: number;
    likedByMe: boolean;
};

type OptimisticUpdatesProps = {
    chapter: ChapterData;
    reliable: LikeableCard;
    unreliable: LikeableCard;
    previous: Neighbour | null;
    next: Neighbour | null;
};

type LikeCardProps = LikeableCard & {
    pending: boolean;
    note: string;
    onLike: () => void;
};

function LikeCard({
    label,
    likes,
    likedByMe,
    pending,
    note,
    onLike,
}: LikeCardProps) {
    return (
        <div className="rounded border border-neutral-400 p-3 text-sm dark:border-neutral-600">
            <p className="font-medium">{label}</p>
            <p className="mt-1">
                {likes} like{likes === 1 ? '' : 's'}
                {likedByMe ? ', including yours' : ''}.
            </p>
            <button
                type="button"
                onClick={onLike}
                disabled={pending}
                className="mt-2 rounded border border-neutral-400 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-neutral-600"
            >
                {likedByMe ? 'Unlike' : 'Like'}
            </button>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                {note}
            </p>
        </div>
    );
}

export default function OptimisticUpdates({
    chapter,
    reliable,
    unreliable,
    previous,
    next,
}: OptimisticUpdatesProps) {
    const [reliablePending, setReliablePending] = useState(false);
    const [unreliablePending, setUnreliablePending] = useState(false);
    const [reliableNote, setReliableNote] = useState('nothing tried yet');
    const [unreliableNote, setUnreliableNote] = useState('nothing tried yet');

    function likeReliable() {
        router
            .optimistic<OptimisticUpdatesProps>((props) => ({
                reliable: {
                    ...props.reliable,
                    likes: props.reliable.likedByMe
                        ? props.reliable.likes - 1
                        : props.reliable.likes + 1,
                    likedByMe: !props.reliable.likedByMe,
                },
            }))
            .post(
                '/chapters/optimistic-updates/like',
                {},
                {
                    preserveScroll: true,
                    onStart: () => {
                        setReliablePending(true);
                        setReliableNote('applied optimistically, saving...');
                    },
                    onSuccess: () => setReliableNote('confirmed by the server'),
                    onFinish: () => setReliablePending(false),
                },
            );
    }

    function likeUnreliable() {
        router
            .optimistic<OptimisticUpdatesProps>((props) => ({
                unreliable: {
                    ...props.unreliable,
                    likes: props.unreliable.likes + 1,
                    likedByMe: true,
                },
            }))
            .post(
                '/chapters/optimistic-updates/like-unreliable',
                {},
                {
                    preserveScroll: true,
                    onStart: () => {
                        setUnreliablePending(true);
                        setUnreliableNote(
                            'applied optimistically, waiting for the server...',
                        );
                    },
                    onHttpException: () => {
                        setUnreliableNote(
                            'the server answered 422: rolled back automatically',
                        );

                        // Suppresses Inertia's own error dialog for this one visit only:
                        // chapters/events already shows what that dialog looks like for an
                        // unhandled httpException. This chapter's subject is the rollback,
                        // which runs from onFinish regardless of this callback's result.
                        return false;
                    },
                    onFinish: () => setUnreliablePending(false),
                },
            );
    }

    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <LikeCard
                        {...reliable}
                        pending={reliablePending}
                        note={reliableNote}
                        onLike={likeReliable}
                    />
                    <LikeCard
                        {...unreliable}
                        pending={unreliablePending}
                        note={unreliableNote}
                        onLike={likeUnreliable}
                    />
                </div>
            }
            watchFor={
                <p className="mt-2">
                    Click Like on the left card: the count and the wording
                    change immediately, before any request has answered, because{' '}
                    <code className="font-mono">router.optimistic()</code>{' '}
                    applies its callback&apos;s return value to the page&apos;s
                    props synchronously, in the same tick as the click. Set slow
                    mode above 0 first (any other chapter&apos;s slider reaches
                    the same session value) to stretch that gap wide enough to
                    actually see on this card: at 0 the round trip is fast
                    enough that the confirmed count and the optimistic one are
                    indistinguishable on screen. Slow mode will not do the same
                    for the right card: likeUnreliable() calls abort(422) before
                    resolving any prop Lab could slow down, so that round trip
                    stays just as fast regardless of the slider, and the
                    rollback still happens correctly, just too quickly to watch.
                    Click Like on the right card and the optimistic count still
                    applies for a moment, then falls back to where it started:
                    that endpoint always answers 422, and once the visit
                    finishes without succeeding, the rollback restores exactly
                    the value this card held the moment you clicked, not a value
                    read back from the server, since the server never sent one.
                </p>
            }
            whenToUse={
                <p>
                    Reach for an optimistic update on an action that almost
                    always succeeds and whose failure is rare enough that a
                    brief, corrected flicker is an acceptable cost: a like, a
                    star, a checkbox. Avoid it for anything whose failure is
                    common or whose consequences are expensive to have shown
                    even briefly, a payment or an irreversible delete, where
                    waiting for confirmation is the safer default.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">
                    Declare the change, not a promise to undo it
                </h2>
                <p className="mt-1">
                    <code className="font-mono">
                        router.optimistic(callback)
                    </code>{' '}
                    stores callback and returns the router itself, so the very
                    next visit method chained onto it, here{' '}
                    <code className="font-mono">.post()</code>, picks it up as
                    that visit&apos;s own{' '}
                    <Term term="Optimistic update">optimistic update</Term>.
                    Passing <code className="font-mono">optimistic</code>{' '}
                    directly in a visit&apos;s own options object, without the
                    chained call, works identically: both are read from the same{' '}
                    <code className="font-mono">Visit</code> type in{' '}
                    <code className="font-mono">
                        node_modules/@inertiajs/core/types/types.d.ts
                    </code>
                    . callback receives the page&apos;s current props and
                    returns only the keys it wants to change; the client applies
                    that partial object to the live page immediately, verified
                    by reading{' '}
                    <code className="font-mono">applyOptimisticUpdate()</code>{' '}
                    in{' '}
                    <code className="font-mono">
                        node_modules/@inertiajs/core/dist/index.js
                    </code>
                    .{' '}
                    <code className="font-mono">
                        {'<Form optimistic={(props, data) => ...}>'}
                    </code>{' '}
                    and{' '}
                    <code className="font-mono">
                        useForm().optimistic(callback)
                    </code>{' '}
                    are the same mechanism reached from a form instead of a
                    plain visit, verified in{' '}
                    <code className="font-mono">FormComponentProps</code> and{' '}
                    <code className="font-mono">InertiaFormProps</code> in the
                    same types file; neither card above needs one, since liking
                    a post is not a form.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    What actually gets restored, and when
                </h2>
                <p className="mt-1">
                    Before applying the change, the client remembers the value
                    each key the callback touched held at that exact moment, not
                    the page&apos;s original value from before any clicks at
                    all: like twice in a row and a failing second click rolls
                    back to what the first click left behind, not to zero. That
                    restore runs once the visit finishes, from the same{' '}
                    <code className="font-mono">onFinish</code> callback every
                    visit already fires, and only if{' '}
                    <code className="font-mono">onSuccess</code> never ran
                    first. A visit fails this way whether the server answers
                    with validation errors, a bare{' '}
                    <code className="font-mono">httpException</code> such as the
                    right card&apos;s deliberate 422, or a network error that
                    never reaches the server at all: all three still reach{' '}
                    <code className="font-mono">onFinish</code>, verified by
                    reading <code className="font-mono">Request.send()</code>
                    &apos;s own <code className="font-mono">
                        .finally()
                    </code>{' '}
                    block.
                </p>
            </section>
        </ChapterShell>
    );
}
