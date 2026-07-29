# Inertia Lab: design

Date: 2026-07-29
Status: approved, pending implementation plan

## 1. Purpose

A Laravel + Inertia + React application whose only subject is Inertia itself. The reader clones it, runs one command, and walks through chapters. Each chapter isolates one Inertia concept, lets the reader trigger it, and shows both halves of what happened: the wire on the client side, and the prop resolution on the server side.

Primary reader: an engineering manager who clones and runs the app, evaluating the Inertia monolith chosen in the BKO V3 ADR, section 3 (Confluence DEM 5575213079). Secondary reader: BKO V3 developers onboarding onto Inertia. Both may be English speakers, which is why the application is written in English.

**The reader arrives with a specific mental model, and shifting it is the point of the project.** They are used to conventional applications: a backend exposing an API, a frontend consuming it. Every question they will ask is framed by that model. Where is the endpoint. How does the component get its data if it does not fetch. What replaces my loading state, my client cache, my API contract. A chapter that explains an Inertia feature without answering the question underneath it will be read as a trick rather than a mechanism.

So the lab is built to relocate that model, not merely to enumerate features. Every chapter is designed to be understood by someone whose reflex is `fetch()`.

The success criterion is narrow and testable: after an hour in the app, the reader can trace what travels over the wire on an Inertia visit, can say where the API layer went and what took over each of its jobs, and can name which prop type to reach for in a given situation and why.

## 2. Non-goals

- No argued comparison against API + SPA: no benchmark, no scorecard, no "look how much less code" claim. The ADR already made that call and the lab does not relitigate it. This is distinct from the mental-model translation described in section 5.6, which is a teaching device: naming what an API-first developer would have written, so they can locate the equivalent here. Translating is in scope, arguing is not.
- No SSR chapter. The target is an internal application with no SEO requirement. The README states this in one paragraph so the question does not resurface in review.
- No production concerns: deployment, scaling, auth hardening, i18n.
- No Equativ domain. The sample domain is deliberately generic so that domain knowledge is never a prerequisite.
- Not a component library, not a design system showcase.

## 3. Stack and version policy

Pinned to the latest releases as of 2026-07-29:

| Package | Version | Note |
| --- | --- | --- |
| PHP | `^8.3`, 8.5.1 locally | |
| Laravel | 13.x | scaffolded with `laravel new --react --no-authentication --pest --database=sqlite` |
| `inertiajs/inertia-laravel` | `^3.2` | v3.2.1 released 2026-07-29 |
| `@inertiajs/react` | `^3.6` | 3.6.1 published 2026-07-07 |
| React | 19 | required by Inertia 3 |
| Vite, `@inertiajs/vite`, Tailwind | 4 | |
| `laravel/wayfinder` | `^0.1` | required by the instant-visits chapter |
| Database | SQLite | file-based, no external service |
| Tests | Pest | |

The lab pins the latest releases rather than the versions vendored in `jinglebox` (client 3.0.3, adapter 3.0.x). Three chapters depend on it: the official DevTools require client `^3.6` and adapter `^3.2`, and deferred-prop rescue plus once-prop expiry are recent additions. Verified during design: the `DeferProp` constructor vendored in `jinglebox` is `(callable $callback, ?string $group = null)` and has no rescue support, while the current documentation describes `rescue: true`.

Version policy, which is a hard rule for this project: **no chapter teaches an API that is absent from the pinned version.** Every chapter is verified against the installed code in `vendor/` and `node_modules/`, not against the documentation. Where the two disagree, the installed code wins and the chapter says so.

## 4. Sample domain

A blog: users (authors), posts, tags, comments, likes, notifications. Chosen because it is the most widely recognised demo domain and requires no explanation, while still offering natural material for every concept. A todo list was considered and rejected: it cannot motivate infinite scroll, expensive aggregates, file uploads or relations without contrivance.

Each domain feature exists to serve a concept:

| Domain feature | Concept it carries |
| --- | --- |
| Post feed | infinite scroll, prefetch on hover, instant visits |
| Tag and author filters | partial reloads, remembering state |
| Notification counter in the header | shared props, polling |
| Dashboard statistics | deferred props, groups, rescue |
| Tag list | once props with expiry |
| Like button | optimistic updates and rollback |
| Post editor | forms, file upload with progress, validation |
| Slug uniqueness on the editor | Precognition live validation |
| Load more comments | `merge()`, `deepMerge()`, `matchPropsOn` |
| Author-only edit | authorization props and policies |
| Post detail | nested props, `ProvidesInertiaProperties` |

Seed volume: 8 authors, 120 posts, roughly 2000 comments, 15 tags, likes and 30 notifications. Large enough that pagination, infinite scroll and aggregate queries are real work rather than mimed. The seeder uses a fixed random seed so payload sizes and screenshots are stable across machines.

No login wall. The app boots as an authenticated demo user, with a user switcher in the header that doubles as the shared-props demonstration. Authentication is not a subject of the lab. The authorization chapter uses real policies on posts.

## 5. The teaching layer

Six devices, shared by every chapter. This is the expensive part of the build; once it exists, chapters are repetitive and cheap.

### 5.1 Wire strip

A strip docked at the bottom of every chapter page, always visible next to the lesson. For the current and previous requests it shows: whether it was the initial HTML document or an Inertia visit, method, URL, status, duration, payload size, every `X-Inertia-*` header present on the request and the response, and the page object with its metadata expanded (`component`, `props`, `url`, `version`, `deferredProps`, `initialDeferredProps`, `mergeProps`, `deepMergeProps`, `prependProps`, `matchPropsOn`, `sharedProps`, `scrollProps`, `onceProps`, `flash`, `encryptHistory`, `clearHistory`, `preserveFragment`).

A second tab shows the client event timeline: `before`, `start`, `progress`, `beforeUpdate`, `success`, `flash`, `error`, `httpException`, `networkError`, `finish`, `navigate`, `location`, `prefetching`, `prefetched`, `cancel`, with which ones are cancelable.

Implementation: `window.fetch` is patched at boot to capture exact headers, byte counts and timings. Inertia 3 replaced Axios with its own fetch-based client, so every visit passes through it. Lifecycle events come from `router.on()`. The patch is lab-only, gated to the local environment, and the chapter that introduces the strip says explicitly that this is a teaching device and not a pattern to copy into an application.

### 5.2 Server prop-resolution trace

The device that carries the actual pedagogy, and the one thing the official DevTools do not provide. For every request it reports, per prop: whether it was evaluated or skipped, the reason it was skipped (not requested by `only`, excluded by `except`, deferred to a follow-up request, `optional()` and not requested, `once()` and already held by the client), the resolution time, and the serialized byte weight.

Implementation. An earlier draft of this design proposed rebuilding each prop object with an instrumented callable, and named that the main technical risk of the project. Reading the v3.2.1 source removed the risk: it is not how the trace should be built.

`Inertia\Response::toResponse()` instantiates `PropsResolver` directly, so that class cannot be decorated. But the same method reports to `Inertia\DevTools\DevTools::recorder($request)`, which resolves `RequestRecorder` **from the container**. That class exposes the exact lifecycle the trace needs: `requestStarted()`, `sharedPropsResolved()`, `propsShared()`, `pageRendering()`, `propResolved($path, $prop)` for every prop actually resolved, `propRescued()`, `pageRendered($request, $page, $resolvedProps)` and `respondedWith()`.

So the trace is built from two cooperating pieces, neither of which touches Inertia internals:

- A `LabRecorder` bound in place of `RequestRecorder`, extending it and calling `parent::` throughout so the official DevTools keep working unchanged. It records which props were resolved, in which order, and with what classification. `Inertia\DevTools\PropClassifier` is reused rather than reimplemented.
- Lab prop factories (`Lab::value()`, `Lab::optional()`, `Lab::defer()`, `Lab::always()`, `Lab::merge()`, `Lab::once()`, `Lab::scroll()`) that build **genuine Inertia prop objects** from an already-instrumented callable, so resolution time is measured at construction time rather than patched in afterwards. The returned object is the real thing, so fluent chaining still works. The factories also record the declared prop list.

Evaluated versus skipped is then the declared list minus the resolved list, and the reason comes from the prop type plus the request headers plus the page metadata. No reflection, no constructor replication, no dependency on protected members.

One consequence to handle explicitly: `DevTools::enabled()` defaults to `app()->environment('local')` and honours `inertia.devtools.enabled`. If a reader disables it, the trace goes dark. Per the failure rule in section 8, the strip must then state that recording is off and how to turn it back on, rather than render an empty panel.

Attaching the trace to the response, by a middleware gated to the local environment: for Inertia JSON responses, decode the payload, add `props._lab`, re-encode. For the initial HTML document the page object is embedded in `<script data-page="app" type="application/json">`, so the trace is injected instead as a separate `<script id="lab-trace" type="application/json">` block before `</body>`. Both paths are read by the wire strip at boot.

### 5.3 Source view

Each chapter renders the server file and the client file that produced the page currently on screen, read from disk at request time, with the relevant lines highlighted. Because the file displayed is the file executing, the tutorial cannot drift from the code. A test asserts that every path referenced by a source view exists.

### 5.4 Slow mode

A global toggle that makes the server delay prop resolution by a configurable amount. Without it, deferred props, prefetching and optimistic updates are invisible on localhost. The delay is applied inside the instrumented props, so the trace reports it honestly rather than hiding it.

### 5.5 Relationship with the official DevTools

Inertia 3 ships its own DevTools: a Chrome extension plus a server-side recorder, enabled by default in development, with a timeline of every request type and four tabs per entry (Props with deferred, optional and merged badges plus `file:line` links, HTTP, Route, Page). They require client `^3.6` and adapter `^3.2`, both released within the last three weeks.

The lab does not compete with them and does not reimplement them. The in-page strip exists because it sits next to the lesson, needs no extension install, and is narrated by the chapter. The official DevTools get their own chapter in wave 3, because they are the tool the team will actually use day to day. Where the two overlap, the chapter says so.

### 5.6 Mental-model bridge

The device that addresses the reader's starting point, present in three forms.

**The round-trip diagram**, on every chapter page. A small schematic of the full path: browser event, HTTP request, route, controller, prop resolution, page object, wire, client router, component render. After each visit, the segments that were actually exercised light up, annotated with what happened there. A partial reload lights up a shorter path than a first load; a deferred prop lights up a second pass; a prefetch lights up a path that ends in the cache instead of the screen. The reader watches the same diagram change shape across chapters, which is how the mechanism becomes a model rather than a list of features.

**The translation callout**, one per chapter, in a fixed format: *"In an API-first application you would have written this. Here, that job is done by this, or it no longer exists because of that."* Written flatly, without advocacy. Examples: a REST controller plus an API resource becomes the props array; the client-side loading state becomes deferred props or it disappears with the request; client cache invalidation after a mutation disappears because the server redirect returns the new page object; the OpenAPI contract becomes the TypeScript type of the page props.

**The "where did it go?" reference page**, reachable from the home page and linked from every callout. One row per artefact an API-first developer expects to write: REST endpoint, serializer or API resource, client-side router, `fetch` or axios call, loading and error state, client cache and its invalidation, optimistic UI, API contract and its versioning, CORS, token authentication, pagination metadata. Each row says what plays that role in Inertia, or why the role stops existing, and links to the chapter that demonstrates it. This page is the one artefact most likely to be read on its own and quoted in a meeting, so it is written to stand alone.

### 5.7 Chapter shell

Every chapter has the same skeleton, so the reader learns the format once and then only meets new content. In order: the question the chapter answers, in plain language and without Inertia vocabulary; the thing to try, with real controls; what to watch in the wire strip, the trace and the diagram; the translation callout; the source view; when to reach for this in practice, and when not to; the link to the official documentation page.

The chapters form an ordered path with previous and next links, so the app reads as a course rather than a reference. A glossary page defines the recurring vocabulary once (visit, page object, prop, partial reload, shared props, merge intent) and every chapter links terms to it on first use.

## 6. Chapter map

Chapters are grouped into three build waves. Each wave is independently demonstrable. Every chapter links to its page in the official v3 documentation, and the chapter set mirrors the documentation's own taxonomy minus SSR, so coverage is auditable rather than a matter of memory.

### Wave 1: foundation, protocol and the full prop taxonomy

Foundation: home page with the chapter map, the anatomy of the page object, the header reference, the glossary, the "where did it go?" reference page, and the versions actually installed, read from `composer.lock` and `package-lock.json` rather than hardcoded.

Protocol chapters:

0. The mental-model switch, and the first chapter anyone reads. Side by side, the same screen described twice: the path the reader expects (component mounts, calls an endpoint, receives JSON, sets state, renders, handles loading and error) and the path that actually runs here (link click, HTTP request, controller, props, page object, component render). No claim that one is better. The chapter ends by naming the three things that surprise people most: there is no endpoint for this screen, the component never fetches anything, and the server decides what the client receives.
1. `how-it-works` and `the-protocol`: initial document (`<script data-page="app" type="application/json">` followed by `<div id="app">`, which replaced the `data-page` attribute in version 3) versus an `X-Inertia: true` visit. Anatomy of the page object.
2. `responses`, `routing`, `pages`: `Inertia::render()`, component resolution, `ensure_pages_exist` and `ComponentNotFoundException`, `transformComponentUsing()`, `resolveUrlUsing()`.
3. `redirects`: 302 handling, the GET-after-PUT/PATCH/DELETE rule, `Inertia::back()`, `Inertia::location()` with its 409 and `X-Inertia-Location`.
4. `links` and `manual-visits`: `<Link>` versus `router.visit()`, the full visit option set (`replace`, `preserveState`, `preserveScroll`, `preserveUrl`, `only`, `except`, `reset`, `headers`, `async`, `queryStringArrayFormat`, `viewTransition`), `router.cancelAll()`.
5. `events`: the full event timeline, which events are cancelable, `router.on()` versus `document.addEventListener('inertia:*')`, `router.once()`.
6. `asset-versioning`: a button changes the server asset version, the next visit returns 409 and the client hard-reloads.

Prop taxonomy chapters:

7. Plain values, bare closures, enums, `ProvidesInertiaProperty` and `ProvidesInertiaProperties`, nested props and dot notation.
8. `shared-data`: `Inertia::share()`, the `sharedProps` key, `shareOnce()`.
9. `partial-reloads`: `only`, `except`, `reset`, `preserveErrors`, the request headers, and the payload shrinking measurably.
10. `Inertia::optional()`, contrasted with a bare closure.
11. `deferred-props`: `Inertia::defer()`, groups, `<Deferred>` with its `fallback` and `reloading` slots, plus the `rescue` slot and `rescue: true` if the pinned version provides them, per the version policy in section 3.
12. `Inertia::always()`.
13. `merging-props` and `load-when-visible`: `merge()`, `deepMerge()`, prepend, `matchPropsOn`, `<WhenVisible>`.
14. `infinite-scroll`: `Inertia::scroll()`, `<InfiniteScroll>` in both directions, the merge-intent header.
15. `once-props`: `Inertia::once()`, expiry, and the `X-Inertia-Except-Once-Props` request header.
16. `polling`: `usePoll()`, `keepAlive`, `autoStart`.

### Wave 2: forms, speed and perception

17. `forms` and `validation`: `<Form>` and `useForm()`, errors as ordinary props, error bags, `isDirty`, `transform()`, `reset()`.
18. `file-uploads`: multipart conversion, upload progress.
19. Precognition: live validation against the server rules, the `Precognition` and `Precognition-Validate-Only` headers, 204 versus 422, the 1500 ms debounce.
20. `prefetching`: hover with its 75 ms delay, mount, click, `cacheFor` including the stale-while-revalidate tuple, `cacheTags`, `usePrefetch()`, `router.flush()`, `router.flushAll()`, `router.flushByCacheTags()`, `invalidateCacheTags` on forms.
21. `instant-visits`: the target component rendered before the server responds, with shared props only, the `component` prop, and the Wayfinder `instant` shorthand.
22. `optimistic-updates`: `router.optimistic()`, `form.optimistic()`, `pageProps` on `<Link>`, automatic rollback on 422 and 500, and concurrent update tracking.
23. `view-transitions` and `progress-indicators`.

### Wave 3: state, history and tooling

24. `remembering-state` and `scroll-management`: `useRemember()`, `dontRemember()`, scroll regions, `preserveScroll`.
25. `history-encryption`: `encryptHistory()`, `clearHistory()`.
26. `layouts`: persistent layouts, nested layouts, default layout, layout props via `setLayoutProps()` and `resetLayoutProps()`.
27. `http-requests`: `useHttp()` for requests that do not cause a visit.
28. `title-and-meta`: `<Head>`.
29. `error-handling`: the development modal, then `Inertia::handleExceptionsUsing()` with `ExceptionResponse` (`render()`, `withSharedData()`, `usingMiddleware()`, `rootView()`, `statusCode()`), and the trap that 404s occur outside the Inertia middleware so shared data must be requested explicitly.
30. `authorization` and `csrf-protection`: authorization props backed by policies, the 419 case.
31. `devtools` and `testing`: the official DevTools, and `AssertableInertia` including partial-reload assertions.
32. `typescript` and `code-splitting`.

## 7. Repository layout

```
app/Http/Controllers/Chapters/      one thin controller per chapter
app/Lab/                            Lab::props(), the trace, the chapter registry
app/Http/Middleware/LabTrace.php    injects the trace into the response
resources/js/pages/chapters/        one page component per chapter
resources/js/lab/                   wire strip, source view, round-trip diagram, chapter shell
docs/superpowers/specs/             this document
```

The chapter registry is a single source of truth: slug, title, the plain-language question the chapter answers, concept, route, server file, client file, translation callout, documentation URL, order and wave. The home page, the navigation, the ordered path and the coverage test all read from it. Adding a chapter means adding one registry entry, one controller and one page component.

## 8. Error handling

Failures are subject matter, not accidents to hide. Dedicated chapters trigger, on purpose: a 422 validation failure, a 500 server error, a 409 version mismatch, a network error, a non-Inertia response producing `httpException`, and a 419 CSRF expiry. The development error modal is shown as a feature rather than suppressed.

The lab's own instrumentation fails loudly. If a source view cannot read a file, if the trace middleware cannot decode a payload, or if a chapter's registry entry is inconsistent, the page shows an explicit error banner. A teaching tool that degrades silently teaches something false.

## 9. Testing

- One Pest feature test per chapter route, asserting the component and the expected props through `AssertableInertia`, including partial-reload assertions where the chapter covers them.
- A test per prop type asserting that a prop built by a `Lab` factory is the genuine Inertia class, still supports fluent chaining, and resolves to the same value as the raw prop.
- A test asserting the trace still reports correctly when the official DevTools recorder is disabled, by showing the disabled state rather than an empty panel.
- A registry consistency test: every chapter has a route that returns 200, an existing page component, existing source-view file paths, a documentation URL, a plain-language question, and a translation callout. The last two are asserted because they are the parts most likely to be skipped under time pressure, and they are the parts that carry the teaching.
- A test asserting every row of the "where did it go?" page links to a chapter that exists.
- No browser or end-to-end tests in scope.

## 10. Assumptions and open questions

Assumptions, stated so they can be corrected cheaply:

- Application text, code, comments and README are in English. Confirmed rather than assumed: the demo is expected to be handed to English-speaking readers beyond the first one.
- The reader has PHP 8.4, Composer and Node available. `git clone`, `composer install`, `npm install`, `composer run dev` is the entire setup, with SQLite created and seeded by a post-install script.

Open question:

- Where the repository is pushed, so the manager can clone it. The local repository is at `/Users/lambert/Developer/inertia-lab`; the GitLab project path is to be confirmed.
