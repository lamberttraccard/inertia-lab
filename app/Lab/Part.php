<?php

namespace App\Lab;

// The registry's own grouping, so the home page map is derived rather than hand
// maintained: a chapter with no case assigned fails to construct at all, and a chapter
// with a case always renders under that heading without any change to the page.
enum Part: string
{
    case Protocol = 'protocol';
    case PropTaxonomy = 'prop-taxonomy';
    case Forms = 'forms';
    case SpeedAndPerception = 'speed-and-perception';
    case StateAndHistory = 'state-and-history';
    case ErrorsAndTooling = 'errors-and-tooling';

    public function label(): string
    {
        return match ($this) {
            self::Protocol => 'The protocol',
            self::PropTaxonomy => 'The prop taxonomy',
            self::Forms => 'Forms',
            self::SpeedAndPerception => 'Speed and perception',
            self::StateAndHistory => 'State and history',
            self::ErrorsAndTooling => 'Errors and tooling',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Protocol => 'What a visit sends and receives: the page object, redirects, links, the event lifecycle, and what happens once the server has moved on. Start here.',
            self::PropTaxonomy => 'Every way a controller can hand data to a page: shared, partial, optional, deferred, always, merged, scrolled, sent once, or polled.',
            self::Forms => 'Submitting a form, uploading a file, and validating before the real submission.',
            self::SpeedAndPerception => 'Making the next screen feel faster than the network allows: prefetching, instant visits, optimistic updates, and animated transitions.',
            self::StateAndHistory => 'What survives a visit and what does not: remembered state, encrypted history, a layout that stays mounted, a request that is not a visit, and the document title.',
            self::ErrorsAndTooling => 'What the reader sees when something goes wrong, who is allowed to do what, and the tools that keep the rest honest.',
        };
    }
}
