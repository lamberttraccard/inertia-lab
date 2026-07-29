<?php

namespace App\Lab\Trace;

use Illuminate\Http\Request;
use Inertia\DevTools\RequestRecorder;

class LabRecorder extends RequestRecorder
{
    public function __construct(private readonly TraceCollector $trace) {}

    public function propResolved(string $path, mixed $prop): void
    {
        $this->trace->markResolved($path);

        parent::propResolved($path, $prop);
    }

    public function propRescued(string $path, mixed $prop): void
    {
        $this->trace->markRescued($path);

        parent::propRescued($path, $prop);
    }

    public function pageRendered(Request $request, array $page, array $resolvedProps): void
    {
        $this->trace->pageRendered($page);

        parent::pageRendered($request, $page, $resolvedProps);
    }
}
