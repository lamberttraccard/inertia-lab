import type { LabTrace, WireEntry } from './types';

const INERTIA_HEADER = 'x-inertia';

// Everything else on a request or response is noise for the lesson; these are the
// headers that actually change Inertia's behaviour or reveal something about the wire.
const KEPT_HEADERS = new Set(['content-type', 'precognition', 'purpose']);

let nextId = 1;

export function readInitialTrace(): LabTrace | null {
    // Guards a server-side render (Inertia SSR is enabled in config/inertia.php): there is
    // no `document` in that environment, and this must not be what crashes the render.
    if (typeof document === 'undefined') {
        return null;
    }

    const tag = document.getElementById('lab-trace');

    if (!tag?.textContent) {
        return null;
    }

    try {
        return JSON.parse(tag.textContent) as LabTrace;
    } catch {
        return null;
    }
}

/**
 * Patching window.fetch is a blunt, low-level teaching device: it is the plainest way to
 * show exactly what left the browser, header for header, independent of whatever code
 * issued the call. It is not a pattern to copy into real application code.
 *
 * It cannot be the only tap, though. The @inertiajs/core version pinned in this project
 * (3.6.1) ships XhrHttpClient as its default client, built on XMLHttpRequest, not fetch:
 * `var httpClient = xhrHttpClient;` in node_modules/@inertiajs/core/dist/index.js, and
 * there is no `window.fetch(` call anywhere in that bundle (every "fetch" hit there is
 * `prefetch`/`isPrefetch`, not the Fetch API). Every real Inertia visit in this app
 * travels over XMLHttpRequest, so the fetch patch alone would silently record nothing
 * after a real visit. The XHR patch below is what actually lights up the strip; the fetch
 * patch stays so a genuine fetch call, from this app or a future Inertia release that
 * switches transport, is still caught.
 */
export function installWireCapture(
    onEntry: (entry: WireEntry) => void,
): () => void {
    const restoreFetch = patchFetch(onEntry);
    const restoreXhr = patchXhr(onEntry);

    return () => {
        restoreFetch();
        restoreXhr();
    };
}

function patchFetch(onEntry: (entry: WireEntry) => void): () => void {
    const original = window.fetch;

    window.fetch = async (input, init) => {
        const started = performance.now();
        const response = await original(input, init);
        const requestHeaders = collectHeaders(new Headers(init?.headers));

        if (!(INERTIA_HEADER in requestHeaders)) {
            return response;
        }

        // Read through a clone: consuming the original body would break Inertia itself,
        // which still needs to read the very same response.
        const body = await response.clone().text();

        onEntry(
            buildEntry({
                method: (
                    init?.method ??
                    (input instanceof Request ? input.method : 'GET')
                ).toUpperCase(),
                url: input instanceof Request ? input.url : input.toString(),
                status: response.status,
                durationMs: Math.round(performance.now() - started),
                body,
                requestHeaders,
                responseHeaders: collectHeaders(response.headers),
            }),
        );

        return response;
    };

    return () => {
        window.fetch = original;
    };
}

// The extra fields are all optional, so a plain XMLHttpRequest already satisfies this
// type; that is what lets the patched methods below keep `this: XMLHttpRequest` callers
// happy while still stashing state across the open/setRequestHeader/send lifecycle.
type CapturedXhr = XMLHttpRequest & {
    labMethod?: string;
    labUrl?: string;
    labHeaders?: Record<string, string>;
};

function patchXhr(onEntry: (entry: WireEntry) => void): () => void {
    const proto = XMLHttpRequest.prototype;
    const openOriginal = proto.open;
    const setRequestHeaderOriginal = proto.setRequestHeader;
    const sendOriginal = proto.send;

    proto.open = function (
        this: CapturedXhr,
        method: string,
        url: string | URL,
        ...rest: unknown[]
    ) {
        this.labMethod = method;
        this.labUrl = url.toString();
        this.labHeaders = {};

        return (openOriginal as (...args: unknown[]) => void).apply(this, [
            method,
            url,
            ...rest,
        ]);
    };

    proto.setRequestHeader = function (
        this: CapturedXhr,
        name: string,
        value: string,
    ) {
        (this.labHeaders ??= {})[name.toLowerCase()] = value;

        return setRequestHeaderOriginal.call(this, name, value);
    };

    proto.send = function (
        this: CapturedXhr,
        body?: Document | XMLHttpRequestBodyInit | null,
    ) {
        const requestHeaders = filterHeaderMap(this.labHeaders ?? {});

        if (!(INERTIA_HEADER in requestHeaders)) {
            return sendOriginal.call(this, body);
        }

        const started = performance.now();
        const method = this.labMethod ?? 'GET';
        const url = this.labUrl ?? '';

        // XHR buffers the whole response as a string: unlike a fetch Response, there is no
        // stream to exhaust, so responseText can be read here and again by Inertia's own
        // onload handler without either one breaking the other.
        this.addEventListener('load', function (this: CapturedXhr) {
            onEntry(
                buildEntry({
                    method: method.toUpperCase(),
                    url: url || this.responseURL,
                    status: this.status,
                    durationMs: Math.round(performance.now() - started),
                    body: this.responseText,
                    requestHeaders,
                    responseHeaders: filterHeaderMap(
                        parseResponseHeaders(this.getAllResponseHeaders()),
                    ),
                }),
            );
        });

        return sendOriginal.call(this, body);
    };

    return () => {
        proto.open = openOriginal;
        proto.setRequestHeader = setRequestHeaderOriginal;
        proto.send = sendOriginal;
    };
}

function buildEntry(data: {
    method: string;
    url: string;
    status: number;
    durationMs: number;
    body: string;
    requestHeaders: Record<string, string>;
    responseHeaders: Record<string, string>;
}): WireEntry {
    let page: Record<string, unknown> | null = null;

    try {
        page = JSON.parse(data.body) as Record<string, unknown>;
    } catch {
        page = null;
    }

    const lab =
        page?.props && typeof page.props === 'object'
            ? (page.props as Record<string, unknown>)._lab
            : undefined;

    return {
        id: nextId++,
        kind: 'visit',
        method: data.method,
        url: data.url,
        status: data.status,
        durationMs: data.durationMs,
        bytes: new Blob([data.body]).size,
        requestHeaders: data.requestHeaders,
        responseHeaders: data.responseHeaders,
        page,
        trace: (lab as LabTrace | undefined) ?? null,
    };
}

function collectHeaders(headers: Headers): Record<string, string> {
    const out: Record<string, string> = {};

    headers.forEach((value, key) => {
        const lower = key.toLowerCase();

        if (lower.startsWith(INERTIA_HEADER) || KEPT_HEADERS.has(lower)) {
            out[lower] = value;
        }
    });

    return out;
}

function filterHeaderMap(
    headers: Record<string, string>,
): Record<string, string> {
    const out: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
        if (key.startsWith(INERTIA_HEADER) || KEPT_HEADERS.has(key)) {
            out[key] = value;
        }
    }

    return out;
}

function parseResponseHeaders(raw: string): Record<string, string> {
    const out: Record<string, string> = {};

    for (const line of raw.trim().split(/[\r\n]+/)) {
        const separator = line.indexOf(':');

        if (separator === -1) {
            continue;
        }

        out[line.slice(0, separator).trim().toLowerCase()] = line
            .slice(separator + 1)
            .trim();
    }

    return out;
}
