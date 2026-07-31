import type { WireEntry } from './types';

const SEGMENTS = [
    'browser',
    'request',
    'route',
    'controller',
    'props',
    'page-object',
    'wire',
    'client-router',
    'render',
] as const;

type Segment = (typeof SEGMENTS)[number];
type SegmentState = { active: boolean; note: string };

const BOX_WIDTH = 200;
const BOX_HEIGHT = 90;

// Row-major 3x3 grid, read left to right then top to bottom, like text. A single row of
// nine boxes would have to shrink so much at a phone width that the labels stop being
// legible; three short rows keep the scale factor close to 1 when the SVG is sized down.
const LAYOUT: Record<Segment, { x: number; y: number }> = {
    browser: { x: 20, y: 20 },
    request: { x: 250, y: 20 },
    route: { x: 480, y: 20 },
    controller: { x: 20, y: 160 },
    props: { x: 250, y: 160 },
    'page-object': { x: 480, y: 160 },
    wire: { x: 20, y: 300 },
    'client-router': { x: 250, y: 300 },
    render: { x: 480, y: 300 },
};

const VIEWBOX_WIDTH = 700;
const VIEWBOX_HEIGHT = 410;

// Consecutive segments on the same row: a straight arrow from one box to the next.
const ROW_CONNECTORS: [Segment, Segment][] = [
    ['browser', 'request'],
    ['request', 'route'],
    ['controller', 'props'],
    ['props', 'page-object'],
    ['wire', 'client-router'],
    ['client-router', 'render'],
];

// Where the path wraps from the end of one row to the start of the next: an elbow arrow
// down from the right edge, then across to above the next box, then down into it.
const WRAP_CONNECTORS: [Segment, Segment][] = [
    ['route', 'controller'],
    ['page-object', 'wire'],
];

export function describe(
    entry: WireEntry | null,
): Record<Segment, SegmentState> {
    if (!entry) {
        return Object.fromEntries(
            SEGMENTS.map((segment) => [
                segment,
                { active: false, note: 'no visit recorded yet' },
            ]),
        ) as Record<Segment, SegmentState>;
    }

    // Verified against node_modules/@inertiajs/core/dist/index.js: prefetch-ness is never
    // an X-Inertia-* header (the spec's assumed 'x-inertia-prefetch' does not exist
    // anywhere in that bundle). It is carried as a bare `Purpose: prefetch` header, set in
    // RequestParams when `visit.prefetch` is true and stripped back off once a prefetched
    // response is adopted as a real visit.
    const isPrefetch = entry.requestHeaders['purpose'] === 'prefetch';
    const partial =
        entry.requestHeaders['x-inertia-partial-data'] ??
        entry.requestHeaders['x-inertia-partial-except'];
    const resolved = Object.keys(entry.trace?.props ?? {}).length;
    const skipped = Object.keys(entry.trace?.skipped ?? {}).length;
    const component =
        typeof entry.page?.component === 'string'
            ? entry.page.component
            : 'unknown';

    return {
        browser: {
            active: !isPrefetch,
            note: isPrefetch
                ? 'triggered by prefetch, not by the user'
                : 'user action',
        },
        request: {
            active: true,
            note: partial
                ? `partial reload: ${partial}`
                : `${entry.method} full visit`,
        },
        route: { active: true, note: 'matched by the Laravel router' },
        controller: {
            active: true,
            note: 'the same controller a full page load would run',
        },
        props: {
            active: true,
            note: `${resolved} resolved, ${skipped} skipped`,
        },
        'page-object': { active: true, note: `component ${component}` },
        wire: {
            active: true,
            note: `${entry.bytes} bytes in ${entry.durationMs} ms`,
        },
        'client-router': {
            active: true,
            note: 'swaps props into the current component',
        },
        render: {
            active: !isPrefetch,
            note: isPrefetch
                ? 'stored in cache, not rendered'
                : 'React renders with the new props',
        },
    };
}

function boxCenter(segment: Segment) {
    const { x, y } = LAYOUT[segment];

    return { x: x + BOX_WIDTH / 2, y: y + BOX_HEIGHT / 2 };
}

function rowConnectorPath(from: Segment, to: Segment) {
    const a = LAYOUT[from];
    const b = LAYOUT[to];
    const y = a.y + BOX_HEIGHT / 2;

    return `M${a.x + BOX_WIDTH},${y} L${b.x},${y}`;
}

function wrapConnectorPath(from: Segment, to: Segment) {
    const a = LAYOUT[from];
    const b = LAYOUT[to];
    const midY = a.y + BOX_HEIGHT + (b.y - (a.y + BOX_HEIGHT)) / 2;
    const targetX = b.x + BOX_WIDTH / 2;

    return `M${a.x + BOX_WIDTH},${a.y + BOX_HEIGHT / 2} L${a.x + BOX_WIDTH},${midY} L${targetX},${midY} L${targetX},${b.y}`;
}

export function RoundTrip({ entry }: { entry: WireEntry | null }) {
    const state = describe(entry);

    return (
        <figure className="w-full">
            <svg
                viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
                role="img"
                aria-label="The round trip a visit takes from the browser to the rendered page"
                className="h-auto w-full"
            >
                <defs>
                    <marker
                        id="round-trip-arrow"
                        markerWidth={8}
                        markerHeight={8}
                        refX={7}
                        refY={4}
                        orient="auto"
                    >
                        <path
                            d="M0,0 L8,4 L0,8 Z"
                            className="fill-neutral-400 dark:fill-neutral-600"
                        />
                    </marker>
                </defs>

                {[...ROW_CONNECTORS, ...WRAP_CONNECTORS].map(([from, to]) => (
                    <path
                        key={`${from}-${to}`}
                        d={
                            ROW_CONNECTORS.some(
                                ([r, s]) => r === from && s === to,
                            )
                                ? rowConnectorPath(from, to)
                                : wrapConnectorPath(from, to)
                        }
                        className="fill-none stroke-neutral-300 dark:stroke-neutral-700"
                        strokeWidth={2}
                        markerEnd="url(#round-trip-arrow)"
                    />
                ))}

                {SEGMENTS.map((segment) => {
                    const { x, y } = LAYOUT[segment];
                    const { active, note } = state[segment];
                    const { x: cx, y: cy } = boxCenter(segment);

                    return (
                        <g key={segment}>
                            <title>{`${segment}: ${active ? 'active' : 'inactive'}. ${note}`}</title>
                            <rect
                                x={x}
                                y={y}
                                width={BOX_WIDTH}
                                height={BOX_HEIGHT}
                                rx={10}
                                strokeWidth={2}
                                strokeDasharray={active ? undefined : '6 4'}
                                className={
                                    // The same two accents as the inspector's Trace tab, applied to
                                    // the same underlying idea at a different grain: a prop either
                                    // resolved or was skipped, a pipeline segment either ran or
                                    // didn't. The dashed stroke and the "active"/"inactive" text
                                    // below repeat the distinction, so colour is never the only cue.
                                    active
                                        ? 'fill-emerald-50 stroke-emerald-600 dark:fill-emerald-950 dark:stroke-emerald-500'
                                        : 'fill-sky-50 stroke-sky-600 dark:fill-sky-950 dark:stroke-sky-500'
                                }
                            />
                            <text
                                x={cx}
                                y={cy - 6}
                                textAnchor="middle"
                                fontSize={20}
                                fontWeight={600}
                                className={
                                    active
                                        ? 'fill-emerald-900 dark:fill-emerald-100'
                                        : 'fill-sky-900 dark:fill-sky-100'
                                }
                            >
                                {segment}
                            </text>
                            <text
                                x={cx}
                                y={cy + 16}
                                textAnchor="middle"
                                fontSize={13}
                                className={
                                    active
                                        ? 'fill-emerald-700 dark:fill-emerald-300'
                                        : 'fill-sky-700 dark:fill-sky-300'
                                }
                            >
                                {active ? 'active' : 'inactive'}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* The SVG above keeps to short labels so it survives shrinking to a phone
                width; the full note per segment lives here as ordinary reflowing text,
                which is also what a screen reader gets instead of SVG <title> tooltips.
                An inactive segment still gets its note shown here, never just its color:
                "this step did not happen, and here is why" is the lesson. */}
            <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                {SEGMENTS.map((segment) => (
                    <div key={segment} className="flex flex-col">
                        <dt className="font-medium">
                            {segment}{' '}
                            <span className="font-normal text-neutral-500">
                                ({state[segment].active ? 'active' : 'inactive'}
                                )
                            </span>
                        </dt>
                        <dd className="text-neutral-600 dark:text-neutral-400">
                            {state[segment].note}
                        </dd>
                    </div>
                ))}
            </dl>
        </figure>
    );
}
