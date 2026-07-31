import { router } from '@inertiajs/react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';
import type { ChapterData, Neighbour } from './types';

type PostSummary = {
    id: number;
    title: string;
    excerpt: string;
    views: number;
    cover_path: string | null;
    published_at: string | null;
};

type Recency = { label: string; resolvedAsProp: string };

type Meta = { wordCount: number; readingMinutes: number };

type PropsAndTypesProps = {
    chapter: ChapterData;
    views: number;
    tags: string[];
    renderedAt: string;
    status: 'draft' | 'published';
    post: PostSummary;
    recency: Recency;
    excerptLength: number;
    hasCoverImage: boolean;
    meta: Meta;
    previous: Neighbour | null;
    next: Neighbour | null;
};

export default function PropsAndTypes({
    chapter,
    views,
    tags,
    renderedAt,
    status,
    post,
    recency,
    excerptLength,
    hasCoverImage,
    meta,
    previous,
    next,
}: PropsAndTypesProps) {
    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <button
                    type="button"
                    onClick={() =>
                        router.reload({ only: ['meta.readingMinutes'] })
                    }
                    className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                >
                    Reload asking only for meta.readingMinutes
                </button>
            }
            watchFor={
                <p className="mt-2">
                    The request carries X-Inertia-Partial-Data:
                    meta.readingMinutes. In the trace below, meta.readingMinutes
                    moves to resolved and every other{' '}
                    <Term term="Prop">prop</Term> on this page, including its
                    sibling meta.wordCount, moves to skipped with the reason
                    &quot;not requested by only&quot;. meta itself was never a
                    prop of its own: it exists only because two prop keys on
                    this page happen to share a dot-separated prefix.
                </p>
            }
            whenToUse={
                <p>
                    Every one of these kinds is available on every page in this
                    application, at the same time, in the same array. Reach for
                    a scalar or an array first; reach for a backed enum, a
                    model, or a class implementing ProvidesInertiaProperty when
                    the value needs a type or a shaping step a plain array
                    cannot express on its own.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">Six kinds, one array</h2>
                <p className="mt-1">
                    Everything below arrived in the exact array
                    PropsAndTypesController::show() hands to Inertia::render().
                    Nothing here was fetched by the component: every value
                    already sits on <Term term="Prop">the props</Term> this page
                    received, the way an argument sits on a function.
                </p>
                <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
                    <div>
                        <dt className="font-medium">
                            A scalar: <code className="font-mono">views</code>
                        </dt>
                        <dd>{views}</dd>
                    </div>
                    <div>
                        <dt className="font-medium">
                            An array: <code className="font-mono">tags</code>
                        </dt>
                        <dd>{tags.join(', ')}</dd>
                    </div>
                    <div>
                        <dt className="font-medium">
                            A closure, resolved on the server:{' '}
                            <code className="font-mono">renderedAt</code>
                        </dt>
                        <dd>{renderedAt}</dd>
                    </div>
                    <div>
                        <dt className="font-medium">
                            A backed enum:{' '}
                            <code className="font-mono">status</code>
                        </dt>
                        <dd>
                            {status} (a bare string on the wire, not {'{'} name,
                            value {'}'})
                        </dd>
                    </div>
                    <div>
                        <dt className="font-medium">
                            An Eloquent model:{' '}
                            <code className="font-mono">post</code>
                        </dt>
                        <dd>
                            {post.title} ({post.views} views, excerpt &quot;
                            {post.excerpt}&quot;)
                        </dd>
                    </div>
                    <div>
                        <dt className="font-medium">
                            A class implementing ProvidesInertiaProperty:{' '}
                            <code className="font-mono">recency</code>
                        </dt>
                        <dd>
                            {recency.label} (self-reported prop key: &quot;
                            {recency.resolvedAsProp}&quot;)
                        </dd>
                    </div>
                </dl>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    A backed enum, serialised
                </h2>
                <p className="mt-1">
                    App\Http\Controllers\Chapters\Support\PostStatus is a plain{' '}
                    <code className="font-mono">enum PostStatus: string</code>.
                    Passed as a prop value, it reaches the client as {status},
                    the bare backing string, because PHP&apos;s own
                    json_encode() serialises a backed enum case to its backing
                    value natively. That is a language feature, not something
                    this application or Inertia added: a backed enum does not
                    implement JsonSerializable, and no code here converts it. An
                    enum without a backing type could not be used this way at
                    all; it would have to be unwrapped by hand first.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    Two ways an object can describe itself
                </h2>
                <p className="mt-1">
                    App\Http\Controllers\Chapters\Support\PublishedRecency
                    implements Inertia\ProvidesInertiaProperty. Its
                    toInertiaProperty() method runs when the resolver reaches
                    the recency prop, receiving a PropertyContext that carries
                    the exact path it was found at, and returns whatever shape
                    it chooses. That is the same job a resource class does in an
                    API-first application, except there is no separate
                    serialization layer: this class is the prop.
                </p>
                <p className="mt-2">
                    App\Http\Controllers\Chapters\Support\PostFacts implements
                    Inertia\ProvidesInertiaProperties instead, the plural
                    interface, and is added to the props array without a string
                    key of its own. Its toInertiaProperties() method contributes
                    two keys at once: excerptLength ({excerptLength}) and
                    hasCoverImage ({hasCoverImage ? 'true' : 'false'}).
                    PropsResolver expands it only because the controller placed
                    it at a bare array position rather than under a name; giving
                    it a string key would have treated the object itself as the
                    prop value instead. Its method also runs on every request,
                    including the partial reload this page's button sends,
                    before the only filter is applied to the keys it just handed
                    back: cheap here, but worth wrapping in a closure if it ever
                    did real work.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    A nested array, by dot notation
                </h2>
                <p className="mt-1">
                    The controller declares two props named{' '}
                    <code className="font-mono">meta.wordCount</code> and{' '}
                    <code className="font-mono">meta.readingMinutes</code>, dots
                    included in the array keys. Before resolving anything,
                    PropsResolver::unpackDotProps() turns those two top-level
                    keys into one meta object, {'{ wordCount: '}
                    {meta.wordCount}
                    {', readingMinutes: '}
                    {meta.readingMinutes}
                    {' }'}, and each leaf still filters independently under a{' '}
                    <Term term="Partial reload">partial reload</Term>, the
                    button above being one.
                </p>
            </section>
        </ChapterShell>
    );
}
