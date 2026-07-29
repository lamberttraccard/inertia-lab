<?php

namespace App\Http\Middleware;

use App\Lab\Trace\TraceCollector;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InjectLabTrace
{
    public function __construct(private readonly TraceCollector $trace) {}

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! app()->environment('local', 'testing')) {
            return $response;
        }

        $payload = $this->trace->payload($request);

        if ($response instanceof JsonResponse && $request->headers->has('X-Inertia')) {
            $data = $response->getData(true);
            $data['props']['_lab'] = $payload;
            $response->setData($data);

            return $response;
        }

        if (str_contains((string) $response->headers->get('Content-Type'), 'text/html')) {
            $content = (string) $response->getContent();

            if (str_contains($content, '</body>')) {
                $script = '<script id="lab-trace" type="application/json">'
                    .json_encode($payload, JSON_THROW_ON_ERROR | JSON_HEX_TAG)
                    .'</script>';

                // Illuminate\Http\Response::setContent() also overwrites $original with
                // whatever is passed in, which is the View instance for a rendered page.
                // Losing it breaks assertViewHas()/viewData() (and so assertInertia()) on
                // the response, so it is restored right after the content swap.
                $original = $response->original ?? null;
                $response->setContent(str_replace('</body>', $script.'</body>', $content));

                if ($original !== null) {
                    $response->original = $original;
                }
            }
        }

        return $response;
    }
}
