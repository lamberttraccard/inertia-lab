# Inertia Lab

A Laravel and Inertia application whose only subject is Inertia itself. There is no
Equativ domain here, no product to demo: every screen exists to isolate one Inertia
concept, let you trigger it, and show both halves of what happened, the wire on the
client side and the prop resolution on the server side.

## Who this is for

Primarily an engineering manager evaluating the Inertia based monolith chosen for BKO
V3, who wants to see how Inertia actually behaves rather than read about it. Secondarily,
any developer on that team onboarding onto Inertia. The reader is assumed to arrive with
a conventional API plus SPA mental model (a backend exposing endpoints, a frontend
fetching them), and every chapter is built to answer the questions that model produces:
where is the endpoint, how does the component get its data if it never fetches, what
replaces the loading state and the client cache.

## Setup

```bash
git clone <this repository>
cd inertia-lab
composer install
npm install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
npm run build
```

Then either serve the build you just made:

```bash
php artisan serve
```

or run everything live, server and Vite together, while you read:

```bash
composer run dev
```

Open `http://localhost:8000`. The home page lists every chapter; there is one so far,
chapter 0. Two further plans add chapters 1 to 16 on top of this same platform, without
changing anything described here.

The seeder is deterministic: it always produces the same 8 authors, 15 tags, 120 posts,
2000 comments and 30 notifications, so what you read here matches what this document
describes regardless of when or where you run it.

## How to read a chapter

Every chapter uses the same shell, so the format is learned once. In order: the question
the chapter answers, in plain language and without Inertia vocabulary; a control to
actually try the thing; the chapter's own content; what to watch, meaning the wire strip
docked at the bottom of the screen, its trace of which props were resolved or skipped and
why, and the round trip diagram that lights up the path a visit actually took; a callout
naming what you would have written in an API first application and what plays that role
here, or why it no longer exists; a source view showing the exact server file and client
file that produced the page you are looking at, read from disk on that request; when to
reach for this; links to the previous and next chapter and to the official documentation
page. The glossary defines the recurring vocabulary once, and the "where did the API go"
page is a single reference table connecting every artefact an API first developer expects
to write to whatever plays that role in Inertia, standing on its own if you only ever read
one page of this application.

## A note on how the wire strip works

The strip captures every Inertia visit by patching the browser's transport at boot. The
installed client, `@inertiajs/core` 3.6.1, issues visits through `XMLHttpRequest`, not
`fetch`, so that is the patch that actually lights up the strip; `window.fetch` is patched
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
| React | 19.2.0 | 19, required by Inertia 3 |
| Vite | 8.1.5 | 4, via `@inertiajs/vite` |
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
server has already been recording under `storage/inertia-devtools`. This lab's own wire
strip is a different, complementary device: it needs no extension, sits directly next to
each lesson, and is the one thing the official DevTools do not provide, a live report of
which props the server resolved or skipped on each request and why.
