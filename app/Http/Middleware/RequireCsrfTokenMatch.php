<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Contracts\Encryption\Encrypter;
use Illuminate\Cookie\CookieValuePrefix;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Symfony\Component\HttpFoundation\Response;

/**
 * A standalone reimplementation of the token-matching half of Laravel's own
 * PreventRequestForgery, deliberately not a subclass of it: Router::resolveMiddleware()
 * rejects any middleware that is a subclass of an excluded class (verified in
 * vendor/laravel/framework/src/Illuminate/Routing/Router.php), so registering a subclass
 * in its place on one route excludes that subclass right alongside the original, which
 * was tried first and produced a 302 (the check silently never ran) instead of a 419.
 *
 * The reason this exists at all: PreventRequestForgery::hasValidOrigin() trusts a
 * same-origin browser's own Sec-Fetch-Site header ahead of the token, and every modern
 * browser sends that header for a same-origin request, confirmed directly against a real
 * browser hitting this application rather than assumed. That makes a wrong or missing
 * token alone unreachable through a same-origin browser click on the default middleware.
 * The two chapters that demonstrate a bad token replace it with this, on their one demo
 * route each, so the token itself is what decides.
 */
class RequireCsrfTokenMatch
{
    public function __construct(private readonly Encrypter $encrypter) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (! $this->tokensMatch($request)) {
            throw new TokenMismatchException('CSRF token mismatch.');
        }

        return $next($request);
    }

    private function tokensMatch(Request $request): bool
    {
        $token = $this->tokenFromRequest($request);

        return is_string($token) && hash_equals($request->session()->token(), $token);
    }

    private function tokenFromRequest(Request $request): ?string
    {
        $token = $request->input('_token') ?: $request->header('X-CSRF-TOKEN');

        if (! $token && $header = $request->header('X-XSRF-TOKEN')) {
            try {
                $token = CookieValuePrefix::remove($this->encrypter->decrypt($header, EncryptCookies::serialized('XSRF-TOKEN')));
            } catch (DecryptException) {
                $token = '';
            }
        }

        return $token;
    }
}
