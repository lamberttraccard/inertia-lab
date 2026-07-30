// Shape verified against App\Lab\Trace\TraceCollector::payload() rather than assumed:
// a resolved prop always carries `rescued`, a skipped one never does, and `partial` is
// only present at all once the recorder is enabled.
export type SkippedProp = {
    type: string;
    reason: string;
    explanation: string;
};

export type ResolvedProp = {
    type: string;
    meta: Record<string, unknown>;
    ms: number | null;
    delayMs: number;
    order: number | null;
    rescued: boolean;
};

export type LabTrace = {
    enabled: boolean;
    reason?: string;
    props: Record<string, ResolvedProp>;
    skipped: Record<string, SkippedProp>;
    partial?: {
        component: string | null;
        only: string | null;
        except: string | null;
        exceptOnce: string | null;
    };
};

export type WireEntry = {
    id: number;
    kind: 'document' | 'visit';
    method: string;
    url: string;
    status: number;
    durationMs: number;
    bytes: number;
    requestHeaders: Record<string, string>;
    responseHeaders: Record<string, string>;
    page: Record<string, unknown> | null;
    trace: LabTrace | null;
};

export type LifecycleEvent = {
    id: number;
    name: string;
    at: number;
    cancelable: boolean;
};
