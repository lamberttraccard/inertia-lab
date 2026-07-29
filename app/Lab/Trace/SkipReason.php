<?php

namespace App\Lab\Trace;

enum SkipReason: string
{
    case NotRequested = 'not requested by only';
    case Excluded = 'excluded by except';
    case Deferred = 'deferred to a follow-up request';
    case Optional = 'optional and not requested';
    case AlreadyHeld = 'once prop already held by the client';
    case Rescued = 'resolution threw and was rescued';

    public function explanation(): string
    {
        return match ($this) {
            self::NotRequested => 'This partial reload asked for a different set of props, so the server never ran this one.',
            self::Excluded => 'This partial reload excluded this prop by name.',
            self::Deferred => 'Deferred props are skipped on the first pass and fetched by a second request.',
            self::Optional => 'Optional props are never sent unless a partial reload asks for them by name.',
            self::AlreadyHeld => 'The client sent X-Inertia-Except-Once-Props, so the server skipped work it already delivered.',
            self::Rescued => 'The server ran this prop, it threw, and Inertia caught the exception because the prop was declared with rescue.',
        };
    }
}
