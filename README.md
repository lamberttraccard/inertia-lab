# Inertia Lab

A Laravel and Inertia application whose only subject is Inertia itself. There is no
business domain here, no product to demo: every screen exists to isolate one Inertia
concept, let you trigger it, and show both halves of what happened, the wire on the
client side and the prop resolution on the server side.

## Who this is for

Primarily someone evaluating an Inertia based monolith, who wants to see how Inertia
actually behaves rather than read about it. Secondarily, any developer onboarding onto
Inertia. The reader is assumed to arrive with
a conventional API plus SPA mental model (a backend exposing endpoints, a frontend
fetching them), and every chapter is built to answer the questions that model produces:
where is the endpoint, how does the component get its data if it never fetches, what
replaces the loading state and the client cache.

## Setup

```bash
git clone <this repository>
cd inertia-lab
touch database/database.sqlite
composer run setup
```

`composer run setup` installs the PHP dependencies, copies `.env.example` to `.env` if
it is not already there, generates the application key, migrates and seeds the
database, links `public/storage` to the disk the file-uploads chapter writes to,
installs the JavaScript dependencies and builds the frontend once.

Then either serve the build you just made:

```bash
php artisan serve
```

or run everything live, server and Vite together, while you read:

```bash
composer run dev
```

Open `http://localhost:8000`. The home page lists all 33 chapters, grouped into the
parts below; each chapter's own previous and next links follow the same order, from
chapter 0 to chapter 32.

The seeder is deterministic: it always produces the same 8 authors, 15 tags, 120 posts,
2000 comments and 30 notifications, so what you read here matches what this document
describes regardless of when or where you run it.

## How to read a chapter

Every chapter uses the same shell, so the format is learned once. In order: the question
the chapter answers, in plain language and without Inertia vocabulary; a control to
actually try the thing; the chapter's own content; what to watch, meaning the inspector
beside the lesson, with its wire, its trace of which props were resolved or skipped and
why, and the round trip diagram that lights up the path a visit actually took; a callout
naming what you would have written in an API first application and what plays that role
here, or why it no longer exists; a source view showing the exact server file and client
file that produced the page you are looking at, read from disk on that request; when to
reach for this; links to the previous and next chapter and to the official documentation
page. The glossary defines the recurring vocabulary once, and the "where did the API go"
page is a single reference table connecting every artefact an API first developer expects
to write to whatever plays that role in Inertia, standing on its own if you only ever read
one page of this application.

## Chapters

The chapter map on the home page groups the 33 chapters into six parts, in the order a
reader is meant to follow them. The grouping lives in the chapter registry
(`app/Lab/ChapterRegistry.php`, `app/Lab/Part.php`), not in the page, so a chapter added
to the registry appears here without any other change.

### The protocol

What a visit sends and receives: the page object, redirects, links, the event lifecycle,
and what happens once the server has moved on. Start here.

0. Where did the API go?
1. What actually travels on the wire
2. From a controller to a component
3. Redirects, and why a delete becomes a GET
4. Links, visits, and the options that shape them
5. The events a visit fires
6. When the server has moved on

### The prop taxonomy

Every way a controller can hand data to a page: shared, partial, optional, deferred,
always, merged, scrolled, sent once, or polled.

7. What can be a prop
8. Props every page gets
9. Asking for less
10. Props that are never sent unless asked for
11. Render now, fetch the rest
12. Props that ignore your instructions
13. Appending instead of replacing
14. Scrolling in both directions
15. Sent once, then never again
16. Keeping a number fresh

### Forms

Submitting a form, uploading a file, and validating before the real submission.

17. Forms without a form library
18. Files, progress, and multipart
19. Validating before submitting

### Speed and perception

Making the next screen feel faster than the network allows: prefetching, instant
visits, optimistic updates, and animated transitions.

20. Fetching before the click
21. Showing the next page before the server answers
22. Updating before the server agrees
23. Animating between pages

### State and history

What survives a visit and what does not: remembered state, encrypted history, a layout
that stays mounted, a request that is not a visit, and the document title.

24. State that survives the back button
25. What stays in the browser after logout
26. The parts that do not re-render
27. Requests that are not visits
28. The title bar

### Errors and tooling

What the reader sees when something goes wrong, who is allowed to do what, and the
tools that keep the rest honest.

29. When something goes wrong
30. Who may do what
31. The tools you actually use
32. Types across the boundary

## Running the tests

```
php artisan test
```

166 tests, 1468 assertions. Run them with the dev server stopped.

With `composer run dev` running, four tests fail reproducibly: two chapters that assert on
session backed state, one on a row created mid test, and one on a history flag. The suite
already isolates itself the usual way, an in memory SQLite database and an array session
driver in `phpunit.xml`, so the shared resource is something else and the mechanism is not
yet identified. Stopping the server makes all 166 pass, every time. This is a known open
issue in this repository, not a flaky test.

## A note on how the inspector captures the wire

The inspector captures every Inertia visit by patching the browser's transport at boot. The
installed client, `@inertiajs/core` 3.6.1, issues visits through `XMLHttpRequest`, not
`fetch`, so that is the patch that actually feeds the inspector; `window.fetch` is patched
too, purely as insurance in case a future Inertia release changes transport again. This is
a blunt, low level teaching device built to show exactly what left the browser, header for
header, independent of whatever code issued the call. It is not a pattern to copy into
application code, and nothing else in this repository does it.

## Why there is no SSR chapter

This is an internal application with no SEO requirement, so server side rendering is not
demonstrated here. Do not read that as Inertia lacking SSR: the framework supports it, and
`config/inertia.php` even points at an SSR server in this project. This lab simply has no
reason to exercise it, the same way it has no reason to exercise anything else outside its
one subject.

## Installed versions and the version floor rule

| Package | Installed | Floor |
| --- | --- | --- |
| PHP | 8.5.1 | `^8.3` |
| Laravel | 13.23.0 | `^13.17` |
| `inertiajs/inertia-laravel` | v3.2.1 | `^3.2` |
| `@inertiajs/react` | 3.6.1 | `^3.6` |
| React | 19.2.8 | 19, required by Inertia 3 |
| Vite | 8.1.5 | `^8.0`, via `@inertiajs/vite` |
| Tailwind CSS | 4.3.3 | 4 |
| Pest | 5.0.2 | 5 |
| `laravel/wayfinder` | 0.1.20 | `^0.1` |

The home page reports the adapter and client versions actually installed, read from
`composer.lock` and `node_modules/@inertiajs/react/package.json`, rather than a hardcoded
string, so this table cannot drift silently out of date the way a hand written one would.

The version floor is a hard rule for the whole project: no chapter teaches an API that is
absent from the installed version. Every chapter is verified against the code actually
present in `vendor/` and `node_modules/`, not against the documentation. Where the two
disagree, the installed code wins, and the chapter says so.

## The official Inertia DevTools

Inertia 3 ships its own DevTools: a server side recorder plus a browser extension, and the
server side half is on by default in a local environment (`APP_ENV=local`), or whenever
`inertia.devtools.enabled` is set explicitly. To see it, install the official Inertia
DevTools extension from the Chrome Web Store. It reads the entries this application's
server has already been recording under `storage/inertia-devtools`. This lab's own
inspector is a different, complementary device: it needs no extension, sits directly next
to each lesson, and is the one thing the official DevTools do not provide, a live report
of which props the server resolved or skipped on each request and why.
