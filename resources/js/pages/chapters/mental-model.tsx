import { router } from '@inertiajs/react';
import { ChapterShell } from '@/lab/ChapterShell';
import { Term } from '@/lab/Term';

const FAMILIAR = `function Posts() {
  const [posts, setPosts] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/posts')
      .then((r) => r.json())
      .then(setPosts)
      .catch(setError)
  }, [])

  if (error) return <Error error={error} />
  if (!posts) return <Spinner />

  return <List posts={posts} />
}`;

const ACTUAL = `function Posts({ posts }) {
  return <List posts={posts} />
}`;

type ChapterData = {
    slug: string;
    title: string;
    question: string;
    concept: string;
    routeName: string;
    serverFile: string;
    clientFile: string;
    translationFrom: string;
    translationTo: string;
    docsUrl: string;
    wave: number;
    order: number;
};

type PostSummary = {
    id: number;
    user_id: number;
    title: string;
    excerpt: string;
    published_at: string | null;
    author?: { id: number; name: string };
};

type ExpensiveStats = { posts: number; views: number };

type Neighbour = { slug: string; title: string };

type MentalModelProps = {
    chapter: ChapterData;
    posts: PostSummary[];
    expensiveStats?: ExpensiveStats;
    previous: Neighbour | null;
    next: Neighbour | null;
};

export default function MentalModel({
    chapter,
    posts,
    expensiveStats,
    previous,
    next,
}: MentalModelProps) {
    return (
        <ChapterShell
            chapter={chapter}
            previous={previous}
            next={next}
            tryThis={
                <button
                    type="button"
                    onClick={() => router.reload({ only: ['expensiveStats'] })}
                    className="rounded border border-neutral-400 px-3 py-1.5 text-sm dark:border-neutral-600"
                >
                    Ask the server for the deferred statistics
                </button>
            }
            watchFor={
                <p className="mt-2">
                    The strip below shows the request for this page. Its trace
                    lists posts as resolved and expensiveStats as skipped, with
                    the reason. A moment later a second entry appears on its
                    own: <Term term="Deferred prop">deferred props</Term>{' '}
                    resolve automatically once the initial page has rendered,
                    without anyone asking for them. That request carries
                    X-Inertia-Partial-Data: expensiveStats, and the trace on it
                    moves expensiveStats from skipped to resolved. The button
                    asks for the same thing again, on demand.
                </p>
            }
            whenToUse={
                <p>
                    This is not a feature to choose. It is how every screen in
                    this application works.
                </p>
            }
        >
            <section>
                <h2 className="text-lg font-semibold">The path you expect</h2>
                <pre className="mt-1 overflow-x-auto rounded bg-neutral-100 p-3 text-xs dark:bg-neutral-900">
                    {FAMILIAR}
                </pre>
                <h2 className="mt-4 text-lg font-semibold">
                    The path that just ran
                </h2>
                <pre className="mt-1 overflow-x-auto rounded bg-neutral-100 p-3 text-xs dark:bg-neutral-900">
                    {ACTUAL}
                </pre>
                <p className="mt-2">
                    The posts are already here: {posts.length} of them, passed
                    as an argument.
                </p>
                {expensiveStats ? (
                    <p>
                        Statistics arrived in a second request:{' '}
                        {expensiveStats.posts} posts.
                    </p>
                ) : null}
            </section>

            <section>
                <h2 className="text-lg font-semibold">
                    Three things that surprise people
                </h2>
                <ol className="mt-2 list-decimal space-y-1 pl-5">
                    <li>
                        There is no endpoint for this screen. The URL you are on
                        is the only one involved.
                    </li>
                    <li>
                        The component never fetches anything. It receives data
                        the way a function receives arguments.
                    </li>
                    <li>
                        The server decides what the client receives, per
                        request, and can skip work the client did not ask for.
                    </li>
                </ol>
            </section>
        </ChapterShell>
    );
}
