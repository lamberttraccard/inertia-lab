import { router, usePoll } from '@inertiajs/react';
import { useState } from 'react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';
import type { ChapterData, Neighbour } from './types';

type PollingProps = {
    chapter: ChapterData;
    unreadNotifications: number;
    previous: Neighbour | null;
    next: Neighbour | null;
};

type PollerProps = {
    interval: number;
    keepAlive: boolean;
    onTick: () => void;
};

// usePoll's own effect (node_modules/@inertiajs/react/dist/index.js) has an empty
// dependency array: it creates the underlying poll once, from whatever interval and
// options it was called with on that first render, and never looks at them again.
// Isolating the hook in its own component lets a key on that component force React to
// unmount and remount it, which is the only way a changed interval or keepAlive here
// actually takes effect rather than being silently ignored.
function Poller({ interval, keepAlive, onTick }: PollerProps) {
    const { start, stop } = usePoll(
        interval,
        { only: ['unreadNotifications'], onSuccess: onTick },
        { keepAlive },
    );

    return (
        <div className="flex flex-wrap items-center gap-2">
            <button
                type="button"
                onClick={start}
                className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
            >
                Start
            </button>
            <button
                type="button"
                onClick={stop}
                className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
            >
                Stop
            </button>
        </div>
    );
}

export default function Polling({
    chapter,
    unreadNotifications,
    previous,
    next,
}: PollingProps) {
    const [interval, setInterval] = useState(2000);
    const [keepAlive, setKeepAlive] = useState(false);
    const [ticks, setTicks] = useState(0);

    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-sm">
                            Interval
                            <select
                                value={interval}
                                onChange={(event) =>
                                    setInterval(Number(event.target.value))
                                }
                                className="rounded border border-neutral-400 bg-transparent px-2 py-1 text-sm dark:border-neutral-600"
                            >
                                <option value={1000}>1 second</option>
                                <option value={2000}>2 seconds</option>
                                <option value={5000}>5 seconds</option>
                            </select>
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={keepAlive}
                                onChange={(event) =>
                                    setKeepAlive(event.target.checked)
                                }
                            />
                            keepAlive
                        </label>
                        <button
                            type="button"
                            onClick={() =>
                                router.post('/chapters/polling/simulate')
                            }
                            className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                        >
                            Simulate a new notification
                        </button>
                    </div>
                    <Poller
                        key={`${interval}-${keepAlive}`}
                        interval={interval}
                        keepAlive={keepAlive}
                        onTick={() => setTicks((count) => count + 1)}
                    />
                </div>
            }
            watchFor={
                <p className="mt-2">
                    <Term term="Polling">usePoll</Term> is issuing a partial
                    reload naming only unreadNotifications every{' '}
                    {interval / 1000} second{interval === 1000 ? '' : 's'}, and
                    the count below the ticks counter proves it: it climbs on
                    its own even if you never click anything. Click
                    &quot;Simulate a new notification&quot; and the number
                    updates right away, because that button&apos;s own visit is
                    a normal one that happens to refresh everything,
                    unreadNotifications included; the real proof polling is
                    doing anything is the ticks counter climbing on a timer
                    regardless. Changing the interval or keepAlive remounts the
                    poller you see above, since usePoll fixes both at the moment
                    it mounts and never re-reads them. To see keepAlive matter,
                    switch to another browser tab for a while with it off:
                    polling throttles to a tenth of its normal rate rather than
                    stopping outright, verified in the installed core's own
                    Poll.tick(). Switch keepAlive on first and it keeps ticking
                    at full speed in the background instead.
                </p>
            }
            whenToUse={
                <p>
                    Reach for usePoll when a value can drift out of date from
                    something this tab did not do itself, a count someone
                    else&apos;s action changed, a job finishing in the
                    background, and a full round trip on a timer is cheap enough
                    for how fresh you need it. Reach for a real-time channel
                    instead once the acceptable interval would need to be
                    uncomfortably short to feel current.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">
                    A number that keeps itself current
                </h2>
                <p className="mt-1">
                    unreadNotifications: {unreadNotifications}. Polled {ticks}{' '}
                    time{ticks === 1 ? '' : 's'} since this page loaded.
                </p>
            </section>
        </ChapterShell>
    );
}
