# Inertia Lab, chapters 1 to 32 implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add every remaining chapter of Inertia Lab on top of the platform built by the wave 1 platform plan, so the application covers the whole Inertia 3 concept surface minus SSR.

**Architecture:** The platform already provides the chapter registry, the `Lab` prop factories, the server-side resolution trace, the wire strip, the round-trip diagram, the source view, the slow mode and the chapter shell. A chapter is therefore four things and nothing more: one `ChapterRegistry` entry, one thin controller under `app/Http/Controllers/Chapters/`, one page component under `resources/js/pages/chapters/`, and one Pest test under `tests/Feature/Chapters/`. Chapter 0 (`mental-model`) is the worked example every later chapter copies.

**Tech Stack:** PHP 8.5, Laravel 13, `inertiajs/inertia-laravel ^3.2`, `@inertiajs/react ^3.6`, React 19, Vite, Tailwind 4, SQLite, Pest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-29-inertia-lab-design.md`. Platform plan: `docs/superpowers/plans/2026-07-29-inertia-lab-wave-1-platform.md`.
- Version floors are hard: `inertiajs/inertia-laravel ^3.2`, `@inertiajs/react ^3.6`.
- **No chapter teaches an API absent from the installed version.** Verify every API against `vendor/inertiajs/inertia-laravel/src/` and `node_modules/@inertiajs/react/types/` before writing the chapter. Where the documentation and the installed code disagree, the installed code wins and the chapter says so. If an API named in this plan does not exist in the installed version, do not invent a substitute: implement the rest of the chapter, state the gap in your report, and leave that control out.
- All application text, code, comments, commit messages and documentation in English.
- No em-dashes or en-dashes anywhere in output. Commas, colons, parentheses or a regular hyphen instead.
- Code comments explain why, never what. No explanatory prose comments in config files.
- Instrumentation fails loudly: a chapter that cannot demonstrate its concept says so on screen. Never render a panel that silently shows nothing.
- Chapters must not argue architecture. The translation callout names what an API-first developer would have written and what does that job here. The words "boilerplate", "simpler", "less code" and their equivalents do not appear.
- Every task ends with a passing test run (`php artisan test`) and the repo's own gates (pint, phpstan) green, then a commit.
- Commit messages end with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` on its own line after a blank line.

## The chapter procedure

Every chapter in this plan is built by the same six steps. The per-chapter sections below give only what differs: the registry entry, the props, the controls, and the assertions. Read this procedure once; it is not repeated per chapter.

**Step A. Read the worked example.** `app/Http/Controllers/Chapters/MentalModelController.php`, `resources/js/pages/chapters/mental-model.tsx`, `tests/Feature/Chapters/MentalModelTest.php`. Match their shape. Deviating from the established shape is a defect, not a style choice.

**Step B. Verify the APIs the chapter teaches.** Grep the installed packages for every method, component, hook and header the chapter names. Record in your report what you verified and where. A chapter that teaches a method that does not exist is the worst failure this project can produce.

**Step C. Write the failing test** in `tests/Feature/Chapters/<Name>Test.php`. Every chapter test asserts at least: the route returns the expected component, the chapter's registry metadata reaches the page, and the props the chapter is about behave as the concept requires (resolved, skipped, merged, deferred, and so on) as visible through `_lab` and the page props. Run it, confirm it fails for the right reason.

**Do not use `assertInertia()` in chapter tests.** It reads `TestResponse::viewData('page')`, which needs `Response::original` to still hold the view Inertia rendered. With the official DevTools recorder enabled, `Inertia\Middleware::handle()` calls `respondedWith()` after our own middleware has run and restored `original`, and that call injects its devtools id tag through a second `setContent()`, which clobbers `original` back to a plain string. On an Inertia JSON response the problem is different and equally fatal: `toResponse()` returns a bare `JsonResponse` and never touches a view at all.

The first task in this plan therefore adds two helpers to `tests/Pest.php`, and every chapter test uses them instead of re-extracting JSON by hand. Thirty-two copies of a `Str::betweenFirst` block would be exactly the verbatim duplication the review rubric rejects.

```php
function inertiaPage(\Illuminate\Testing\TestResponse $response): array
{
    if ($response->headers->get('Content-Type') === 'application/json') {
        return $response->json();
    }

    $json = \Illuminate\Support\Str::betweenFirst(
        (string) $response->getContent(),
        '<script data-page="app" type="application/json">',
        '</script>'
    );

    return json_decode($json, true, 512, JSON_THROW_ON_ERROR);
}

function labTrace(\Illuminate\Testing\TestResponse $response): array
{
    $page = inertiaPage($response);

    if (isset($page['props']['_lab'])) {
        return $page['props']['_lab'];
    }

    $json = \Illuminate\Support\Str::betweenFirst(
        (string) $response->getContent(),
        '<script id="lab-trace" type="application/json">',
        '</script>'
    );

    return json_decode($json, true, 512, JSON_THROW_ON_ERROR);
}
```

Verify both against the real response shapes before relying on them, and make them throw rather than return an empty array when the expected script tag is absent: a helper that silently returns `[]` would turn a broken page into a passing test. Refactor `tests/Feature/Chapters/MentalModelTest.php` onto them in the same task, so there is exactly one copy of this knowledge.

Losing `assertInertia()` also loses the bootstrap assertions it performed for free, so a third helper restores them. Every chapter test calls it on every response it examines, including partial reloads, where a regression serving the wrong component would otherwise pass silently:

```php
function assertInertiaPage(\Illuminate\Testing\TestResponse $response, string $component): array
{
    $page = inertiaPage($response);

    expect($page)->toHaveKeys(['component', 'props', 'url', 'version'])
        ->and($page['component'])->toBe($component);

    return $page;
}
```

Chapter tests still need `config()->set('inertia.devtools.enabled', true);` in a `beforeEach`, because `DevTools::enabled()` defaults to the local environment and the test environment is not local, so the trace would otherwise be off.

**Step D. Add the registry entry** to `ChapterRegistry::all()`, in `order` sequence, with every field filled: `slug`, `title`, `question`, `concept`, `routeName`, `serverFile`, `clientFile`, `translationFrom`, `translationTo`, `docsUrl`, `wave`, `order`. The registry consistency test enforces that none of these is empty.

**Step E. Write the controller and the page component.** The controller is thin: its interesting content is the props array, because that is what the source view shows the reader. The page component uses `ChapterShell` and supplies `tryThis`, `watchFor` and `whenToUse`.

Three template rules, each found by review of chapter 0 and each easy to repeat by copying:

- **Every prop goes through a `Lab` factory, including the chapter metadata.** `chapter`, `previous` and `next` are props like any other. Passed raw they never reach `TraceCollector::declared()`, so they are invisible in `_lab`, in an application whose entire subject is showing the reader every prop. Wrap them in `Lab::value()`.
- **Link a term to the glossary on its first use in a chapter.** Use the shared `<Term>` component in `resources/js/lab/Term.tsx`. Prose that says "partial reload" or "deferred prop" without linking it leaves the glossary an orphan page nobody reaches.
- **The shell links the translation callout to the "where did it go?" page.** That is shell-level and already done; do not reimplement it per chapter.
- **Shared shapes live in one place.** The `ChapterData` and `Neighbour` TypeScript types belong in `resources/js/pages/chapters/types.ts`, and the `neighbour()` controller helper belongs in a shared base or trait under `app/Http/Controllers/Chapters/`. The first task to touch them after this line was written must extract them from the chapters that already duplicate them. Twenty-six chapters copying the same two type declarations and the same private static method is the duplication the review rubric rejects, and it compounds with every chapter.

**Step F. Run the suite and the gates, then commit.** One commit per chapter, subject line `Add chapter <order>: <slug>`.

## New Lab factories

Two chapters need factories the platform deliberately left out. Add them when you reach the first chapter that uses them, with a test mirroring the existing factory tests in `tests/Feature/Lab/LabPropsTest.php`.

- `Lab::deepMerge(string $key, mixed $value): MergeProp` wrapping `Inertia::deepMerge()`, added by chapter 13.
- `Lab::scroll(string $key, mixed $value, string $wrapper = 'data', ProvidesScrollMetadata|callable|null $metadata = null): ScrollProp` wrapping `Inertia::scroll()`, added by chapter 14.

Both follow the shape of the existing factories: declare the prop, wrap the value through the same `is_object($value) && is_callable($value)` guard `Lab::wrap()` uses, return the genuine Inertia object.

---

## Task 1: Chapters 1 to 3, the protocol

**Files:** three controllers, three page components, three tests, three registry entries.

### Chapter 1: `first-load-vs-visit`

- **Title:** What actually travels on the wire
- **Question:** The first time you open a page you get HTML. What do you get the second time?
- **Concept:** The initial request returns a document; every visit after it returns the page object as JSON.
- **Docs:** https://inertiajs.com/docs/v3/core-concepts/how-it-works and https://inertiajs.com/docs/v3/core-concepts/the-protocol
- **Translation:** from "an HTML shell that boots a client router, then a separate JSON API call for the data" to "one response that carries both the page to render and the data to render it with".
- **Props:** `Lab::value('sample', ...)` holding a small serialisable array, plus `Lab::closure('renderedAt', fn () => now()->toIso8601String())` so the reader can see the payload change between visits.
- **Controls:** a `<Link>` back to the same route (a fresh visit), and a plain `<a href>` to the same route (a full document load). The contrast between the two entries in the wire strip is the lesson.
- **Page content:** the anatomy of the page object, field by field, read from the live entry rather than hardcoded: `component`, `props`, `url`, `version`, and the metadata keys present on this response.
- **Test asserts:** the component; that a request with no `X-Inertia` header returns HTML containing `<script data-page` and `type="application/json"`; that a request with `X-Inertia: true` returns JSON whose top level has exactly the keys `component`, `props`, `url`, `version` at minimum. Assert the real key set from the installed version rather than a remembered one.

### Chapter 2: `render-and-components`

- **Title:** From a controller to a component
- **Question:** How does a string in a controller become a React component on screen?
- **Concept:** `Inertia::render()` names a component; the client resolves that name to a module.
- **Docs:** https://inertiajs.com/docs/v3/the-basics/responses
- **Translation:** from "a controller returns JSON and the client router decides what to render" to "the controller names the component and passes it data in one step".
- **Props:** `Lab::value('resolvedComponent', 'chapters/render-and-components')` and `Lab::value('pagesRoot', 'resources/js/pages')`.
- **Controls:** a button that visits a route whose controller renders a component name that does not exist, so the reader sees the real failure. Route it to a second action on the same controller.
- **Page content:** how the name maps to a file, what `config('inertia.ensure_pages_exist')` does, and what `ComponentNotFoundException` looks like. Verify both exist in the installed version before writing about them.
- **Test asserts:** the component; and that visiting the deliberately broken action produces the framework's real failure. Assert the actual behaviour you observe, not an assumed exception class.

### Chapter 3: `redirects`

- **Title:** Redirects, and why a delete becomes a GET
- **Question:** After a POST or a DELETE, what does the browser end up showing?
- **Concept:** Inertia follows the server's redirect and renders the page it lands on; 303 is forced after PUT, PATCH and DELETE so the follow-up is a GET.
- **Docs:** https://inertiajs.com/docs/v3/the-basics/redirects
- **Translation:** from "the client decides what to do after a mutation, then refetches" to "the server redirects, and the response to that redirect is the next page".
- **Props:** `Lab::value('lastAction', session('lab.last_action', 'none'))`.
- **Controls:** three buttons issuing `router.post`, `router.delete` and a visit to an action calling `Inertia::location()` to an external URL. Each server action redirects back with a flash.
- **Page content:** the status codes actually observed, read from the wire strip, and what `Inertia::location()` does differently (409 plus `X-Inertia-Location`).
- **Test asserts:** the DELETE action responds with a redirect whose status is the one the installed version actually uses (verify, then assert that exact number); the `Inertia::location()` action responds 409 with the `X-Inertia-Location` header.

---

## Task 2: Chapters 4 to 6, visits, events and versioning

### Chapter 4: `links-and-visits`

- **Title:** Links, visits, and the options that shape them
- **Question:** What is the difference between a link and a manual visit, and what can you ask of either?
- **Concept:** `<Link>` is a visit with a nicer syntax; every visit takes the same option set.
- **Docs:** https://inertiajs.com/docs/v3/the-basics/links and https://inertiajs.com/docs/v3/the-basics/manual-visits
- **Translation:** from "a client router intercepts the click and you fetch in an effect" to "a link is an HTTP request whose response replaces the page".
- **Props:** `Lab::value('items', ...)` a short list, and `Lab::closure('serverTime', ...)`.
- **Controls:** toggles for `replace`, `preserveState`, `preserveScroll`, `preserveUrl`, `only`, `except`, and a `router.cancelAll()` button fired during a slow visit. Build the visit options object from the toggles and show it as JSON next to the buttons, so the reader sees exactly what they are sending.
- **Test asserts:** a visit with `only` returns just that prop plus what Inertia always includes; a visit with `except` omits it. Assert against the real response, including whatever Inertia adds unconditionally.

### Chapter 5: `events`

- **Title:** The events a visit fires
- **Question:** What happens, in order, between the click and the new screen?
- **Concept:** Every visit emits a fixed sequence of client events, some of which can cancel it.
- **Docs:** https://inertiajs.com/docs/v3/advanced/events
- **Translation:** from "promise callbacks around your fetch" to "a lifecycle you can subscribe to globally or per visit".
- **Props:** `Lab::value('note', ...)`.
- **Controls:** buttons that trigger a normal visit, a visit cancelled from the `before` event by returning false, a 422, a 500, and a request to a route that returns a non-Inertia response (which produces `httpException`). The Lifecycle tab of the wire strip is the output.
- **Page content:** the full event list with which are cancelable, taken from the installed `@inertiajs/core` types rather than from memory.
- **Test asserts:** the server side of each deliberate failure returns the status the chapter claims (422 and 500), and the non-Inertia route returns a response without the `X-Inertia` header.

### Chapter 6: `asset-versioning`

- **Title:** When the server has moved on
- **Question:** What happens to an open tab after you deploy?
- **Concept:** The client sends the asset version it booted with; a mismatch makes the server answer 409 and the client hard reload.
- **Docs:** https://inertiajs.com/docs/v3/advanced/asset-versioning
- **Translation:** from "a version banner you build yourself, or nothing at all" to "a header on every visit and a 409 the client already knows how to handle".
- **Props:** `Lab::value('serverVersion', Inertia::getVersion())`.
- **Controls:** a button that changes the server's asset version (store an override in the session and have a service provider or middleware feed it to `Inertia::version()`), then a link to visit any page. The 409 and the hard reload appear in the wire strip.
- **Test asserts:** with the override set and a visit carrying a stale `X-Inertia-Version`, the response is 409 with `X-Inertia-Location`.

---

## Task 3: Chapters 7 to 9, the first half of the prop taxonomy

### Chapter 7: `props-and-types`

- **Title:** What can be a prop
- **Question:** What exactly can you put in the array you hand to `Inertia::render()`?
- **Concept:** Values, closures, enums, objects that describe themselves, and nested structures addressed with dot notation.
- **Docs:** https://inertiajs.com/docs/v3/the-basics/responses
- **Translation:** from "a serializer or resource class that shapes the JSON" to "the array you return, plus objects that know how to present themselves".
- **Props:** one of each: a scalar, an array, a closure, a backed enum, a model, and a small class implementing `ProvidesInertiaProperty`, plus a nested array reached by dot notation. Verify the interface name and method signature in the installed version first.
- **Controls:** a partial reload asking for a nested key by dot path.
- **Test asserts:** each prop arrives in the shape the chapter claims, including the enum's serialised form and the `ProvidesInertiaProperty` object's output.

### Chapter 8: `shared-data`

- **Title:** Props every page gets
- **Question:** How does the header know who is signed in on every single page?
- **Concept:** `Inertia::share()` adds props to every response; closures in it are evaluated only when the response needs them.
- **Docs:** https://inertiajs.com/docs/v3/data-props/shared-data
- **Translation:** from "a global store hydrated once, then kept in sync by hand" to "props the server attaches to every response, recomputed per request".
- **Props:** the chapter's own props, plus shared props added by `HandleInertiaRequests::share()`: the demo user, the unread notification count as a closure, and a `shareOnce` entry. Extend the existing middleware rather than adding a second one.
- **Controls:** a user switcher (a POST that stores the demo user id in the session), and a partial reload showing which shared props were recomputed.
- **Test asserts:** shared props appear on an unrelated route too; switching the demo user changes them; the `sharedProps` key of the page object lists them.

### Chapter 9: `partial-reloads`

- **Title:** Asking for less
- **Question:** Sorting a table should not refetch the whole page. How do you ask for one prop?
- **Concept:** `only`, `except` and `reset` send header lists the server uses to skip work.
- **Docs:** https://inertiajs.com/docs/v3/data-props/partial-reloads
- **Translation:** from "a second endpoint that returns just the rows" to "the same endpoint, told which props you still need".
- **Props:** `posts` (a real query), `tags`, `stats` (deliberately slow, so slow mode makes the saving visible), each through `Lab`.
- **Controls:** buttons for `router.reload({ only: ['posts'] })`, `{ except: ['stats'] }`, and a full reload, with the payload size of each shown side by side from the wire strip.
- **Test asserts:** the `only` request resolves `posts` and skips `stats`, visible in `_lab.props` and `_lab.skipped` with the right `SkipReason`; the payload of the partial response is smaller than the full one.

---

## Task 4: Chapters 10 to 12, optional, deferred and always

### Chapter 10: `optional-props`

- **Title:** Props that are never sent unless asked for
- **Question:** How do you attach expensive data to a page without paying for it on load?
- **Concept:** `Inertia::optional()` is skipped on every request that does not name it.
- **Docs:** https://inertiajs.com/docs/v3/data-props/partial-reloads
- **Translation:** from "a separate endpoint you call when the panel opens" to "a prop on this page that the server only computes when you ask".
- **Props:** a cheap prop, a bare closure, and an `optional` prop, so the reader sees the difference between "a closure is still evaluated" and "an optional prop is not".
- **Controls:** a button that reloads with `only: ['expensive']`.
- **Test asserts:** the optional prop is absent from the first load and present after the targeted reload, with `_lab.skipped` naming `SkipReason::Optional` first.

### Chapter 11: `deferred-props`

- **Title:** Render now, fetch the rest
- **Question:** How does the page appear instantly when one of its panels takes a second to compute?
- **Concept:** `Inertia::defer()` sends the page immediately and lets the client fetch the deferred groups afterwards.
- **Docs:** https://inertiajs.com/docs/v3/data-props/deferred-props
- **Translation:** from "render a spinner, fire a second request from an effect, handle its loading and error states" to "declare the prop deferred and wrap the panel in `<Deferred>`".
- **Props:** two deferred props in the same group and one in another group, so the reader sees grouping produce separate requests. Plus, if and only if the installed version supports it, one deferred prop with `rescue` that throws, demonstrating the `rescue` slot. Verify `DeferProp::__construct`'s third parameter and the React `<Deferred>` props before writing this part.
- **Controls:** the slow mode slider, and a `router.reload({ only: [...] })` to watch `reloading` flip.
- **Test asserts:** the first response carries `deferredProps` metadata and skips those props with `SkipReason::Deferred`; a follow-up partial request resolves them.

### Chapter 12: `always-props`

- **Title:** Props that ignore your instructions
- **Question:** You asked for one prop. Why did three arrive?
- **Concept:** `Inertia::always()` survives partial reload filtering; `errors` behaves the same way.
- **Docs:** https://inertiajs.com/docs/v3/data-props/partial-reloads
- **Translation:** from "a response envelope you always merge into your store" to "props the server marks as non-negotiable".
- **Props:** a normal prop, an `always` prop, and a flash-like value.
- **Controls:** a reload with `only: ['normal']` that nonetheless returns the always prop.
- **Test asserts:** a request naming only one prop still contains the always prop.

---

## Task 5: Chapters 13 to 16, merging, scrolling, once and polling

### Chapter 13: `merging-props`

- **Title:** Appending instead of replacing
- **Question:** "Load more" adds to a list. Why does the new response not wipe the old rows?
- **Concept:** `merge()`, `deepMerge()`, prepend and `matchPropsOn` tell the client to combine rather than replace.
- **Docs:** https://inertiajs.com/docs/v3/data-props/merging-props
- **Translation:** from "concatenate the arrays yourself in a reducer and deduplicate by id" to "the server marks the prop mergeable and names the matching key".
- **Props:** a paginated comment list through `Lab::merge`, plus a `deepMerge` example. Add `Lab::deepMerge()` in this task.
- **Controls:** a load-more button, a reset button using the `reset` visit option, and a toggle between merge and deep merge.
- **Test asserts:** the page object lists the prop under `mergeProps` (and `deepMergeProps` for the second), and a reset request clears it. Verify the exact metadata key names in the installed version.

### Chapter 14: `infinite-scroll`

- **Title:** Scrolling in both directions
- **Question:** What does an infinite list need beyond "append the next page"?
- **Concept:** `Inertia::scroll()` carries the scroll metadata `<InfiniteScroll>` needs, in both directions.
- **Docs:** https://inertiajs.com/docs/v3/data-props/infinite-scroll
- **Translation:** from "an intersection observer, a page counter, and a request in an effect" to "a scroll prop and a component".
- **Props:** the post feed through `Lab::scroll()`. Add `Lab::scroll()` in this task.
- **Controls:** scrolling itself, plus a deep link to a middle page so backward paging is exercised.
- **Test asserts:** the page object carries `scrollProps` with the metadata keys the installed `ScrollMetadata::toArray()` actually produces; a request with the merge-intent header returns the adjacent page.

### Chapter 15: `once-props`

- **Title:** Sent once, then never again
- **Question:** Why send the same unchanging list on every single visit?
- **Concept:** `Inertia::once()` sends a prop once per client; the client then names it in `X-Inertia-Except-Once-Props` and the server skips the work.
- **Docs:** https://inertiajs.com/docs/v3/data-props/once-props
- **Translation:** from "cache it in the client store and remember to invalidate it" to "the client tells the server what it already holds".
- **Props:** the tag list through `Lab::once()`, plus a normal prop for contrast.
- **Controls:** repeated visits, with the request header and the trace side by side.
- **Test asserts:** the first response carries `onceProps` metadata; a second request sending `X-Inertia-Except-Once-Props` skips it with `SkipReason::AlreadyHeld`.

### Chapter 16: `polling`

- **Title:** Keeping a number fresh
- **Question:** How does the notification count update without a websocket?
- **Concept:** `usePoll` reloads chosen props on an interval, and can stop when the tab is hidden.
- **Docs:** https://inertiajs.com/docs/v3/data-props/polling
- **Translation:** from "a setInterval around a fetch, plus cleanup on unmount" to "a hook that issues partial reloads".
- **Props:** the unread notification count.
- **Controls:** start, stop, interval selector, and `keepAlive`. Verify the hook's real option names in `node_modules/@inertiajs/react/types/usePoll.d.ts` before writing them.
- **Test asserts:** the polled partial reload resolves only the polled prop.

---

## Task 6: Chapters 17 to 19, forms

### Chapter 17: `forms`

- **Title:** Forms without a form library
- **Question:** Where do validation errors come from if nobody fetched them?
- **Concept:** `<Form>` and `useForm` submit a visit; server validation failures come back as the `errors` prop.
- **Docs:** https://inertiajs.com/docs/v3/the-basics/forms and https://inertiajs.com/docs/v3/the-basics/validation
- **Translation:** from "POST to an endpoint, read the 422 body, map it into form state" to "submit, and read `errors` like any other prop".
- **Props:** the post being edited, plus the tag options.
- **Controls:** a real create-post form using `<Form>`, and the same form built with `useForm`, side by side. Show `processing`, `isDirty`, `wasSuccessful` and `errors` live.
- **Test asserts:** an invalid submission returns the validation errors as props and does not create a row; a valid one creates the row and redirects.

### Chapter 18: `file-uploads`

- **Title:** Files, progress, and multipart
- **Question:** What changes when a form carries a file?
- **Concept:** A visit with a file becomes multipart, and progress events fire.
- **Docs:** https://inertiajs.com/docs/v3/the-basics/file-uploads
- **Translation:** from "build the FormData yourself and wire an XHR progress handler" to "put the file in the form data and read `progress`".
- **Props:** the current cover image path.
- **Controls:** a cover image upload with a progress bar. Use the fake local disk so the test does not touch real storage.
- **Test asserts:** an uploaded file lands on the fake disk and the model records it.

### Chapter 19: `precognition`

- **Title:** Validating before submitting
- **Question:** How can the client validate with the server's rules without duplicating them?
- **Concept:** Precognition sends the same request with a header that asks the server to validate only.
- **Docs:** https://inertiajs.com/docs/v3/the-basics/forms
- **Translation:** from "a client-side schema kept in sync with the server's rules by hand" to "the server's own rules, run on demand".
- **Props:** none beyond the form.
- **Controls:** a slug field that validates uniqueness live. Verify how Precognition is enabled in the installed adapter (`useForm` with a method and url, or `withPrecognition`) and use the real API.
- **Test asserts:** a request carrying the Precognition headers returns the validation-only status the installed stack actually produces, and creates nothing.

---

## Task 7: Chapters 20 to 23, speed and perception

### Chapter 20: `prefetching`

- **Title:** Fetching before the click
- **Question:** Why does that link feel instant?
- **Concept:** Prefetch on hover, mount or click, with a cache that can be tagged and invalidated.
- **Docs:** https://inertiajs.com/docs/v3/data-props/prefetching
- **Translation:** from "a cache layer with keys, staleness rules and manual invalidation" to "an attribute on the link and a cache the router owns".
- **Controls:** the same link with each strategy, a `cacheFor` selector including the stale-while-revalidate tuple, `cacheTags`, and buttons for `router.flush`, `router.flushAll` and `router.flushByCacheTags`. Verify each function exists in the installed core before offering its button.
- **Test asserts:** server side, that the prefetched route responds to the prefetch request; the caching itself is client behaviour shown in the wire strip.

### Chapter 21: `instant-visits`

- **Title:** Showing the next page before the server answers
- **Question:** Can the next screen appear before the response arrives?
- **Concept:** An instant visit renders the target component immediately with shared props only, then merges the real props.
- **Docs:** https://inertiajs.com/docs/v3/the-basics/instant-visits
- **Translation:** from "an optimistic route transition you build with a skeleton screen" to "the component named up front and rendered while the request is in flight".
- **Controls:** a link with `component` set, with slow mode on so the intermediate state is visible. The page component must render correctly with its page-specific props undefined; that is the lesson.
- **Test asserts:** the target route works normally; the instant behaviour is client-side and shown in the wire strip.

### Chapter 22: `optimistic-updates`

- **Title:** Updating before the server agrees
- **Question:** What happens to an optimistic like when the server refuses it?
- **Concept:** `router.optimistic()` and the form equivalents update the props immediately and roll back on failure.
- **Docs:** https://inertiajs.com/docs/v3/the-basics/optimistic-updates
- **Translation:** from "mutate the store, remember the previous value, restore it in a catch" to "declare the optimistic shape and let the router roll back".
- **Controls:** a like button that succeeds, and one pointed at an endpoint that returns 422, so the rollback is visible.
- **Test asserts:** the failing endpoint returns 422 and does not persist a like; the succeeding one does.

### Chapter 23: `view-transitions`

- **Title:** Animating between pages
- **Question:** Can a page change be animated without a client-side animation library?
- **Concept:** The `viewTransition` visit option hands the swap to the browser's View Transitions API, and degrades silently where it is unsupported.
- **Docs:** https://inertiajs.com/docs/v3/the-basics/view-transitions
- **Translation:** from "an animation library wrapping your route transitions" to "one visit option and a CSS property".
- **Controls:** a link with and without `viewTransition`, plus a shared element carrying `view-transition-name`.
- **Test asserts:** server side only, that both routes render.

---

## Task 8: Chapters 24 to 28, state, history and layouts

### Chapter 24: `remembering-state`

- **Title:** State that survives the back button
- **Question:** You filter a list, open an item, press back. Where did the filter go?
- **Concept:** `useRemember` stores component state in the history entry; `preserveState` and `preserveScroll` control what a visit keeps.
- **Docs:** https://inertiajs.com/docs/v3/data-props/remembering-state and https://inertiajs.com/docs/v3/advanced/scroll-management
- **Translation:** from "serialise the filters into the query string and parse them back" to "a hook that puts the state in the history entry".
- **Controls:** a filter input with and without `useRemember`, a scroll region, and toggles for `preserveScroll` and `preserveState`.
- **Test asserts:** server side, the filtered route returns the filtered rows.

### Chapter 25: `history-encryption`

- **Title:** What stays in the browser after logout
- **Question:** Pressing back after signing out can show the previous user's data. What stops that?
- **Concept:** `encryptHistory()` encrypts the history state; `clearHistory()` drops it.
- **Docs:** https://inertiajs.com/docs/v3/security/history-encryption
- **Translation:** from "clearing your client store on logout and hoping the back button obeys" to "a server instruction carried on the response".
- **Controls:** a route rendered with encryption on, and a button calling the action that clears history.
- **Test asserts:** the page object carries `encryptHistory` true on the encrypted route, and `clearHistory` true after the clearing action. Verify the exact key names in the installed version.

### Chapter 26: `layouts`

- **Title:** The parts that do not re-render
- **Question:** Why does the sidebar keep its scroll position between pages?
- **Concept:** Persistent layouts survive visits; layout props let a page hand data to its layout.
- **Docs:** https://inertiajs.com/docs/v3/the-basics/layouts
- **Translation:** from "a router outlet with layout components chosen per route" to "a component that stays mounted across visits".
- **Controls:** two chapters sharing a layout that holds visible state (a counter, a scroll position) plus a `setLayoutProps` demonstration. Verify the exported names in `node_modules/@inertiajs/react/types/layoutProps.d.ts`.
- **Test asserts:** both routes render their components.

### Chapter 27: `http-requests`

- **Title:** Requests that are not visits
- **Question:** How do you call the server without changing the page?
- **Concept:** `useHttp` issues a request that does not produce a visit or touch history.
- **Docs:** https://inertiajs.com/docs/v3/the-basics/http-requests
- **Translation:** from "the same fetch you would have written, because this is the one case where you still want it" to "a hook that shares the router's conventions without navigating".
- **Controls:** a button that hits a JSON endpoint and shows the response, with the wire strip proving no page object came back.
- **Test asserts:** the endpoint returns JSON and no `X-Inertia` header.

### Chapter 28: `head-and-meta`

- **Title:** The title bar
- **Question:** Who sets the document title when there is no full page load?
- **Concept:** `<Head>` manages title and meta tags per page.
- **Docs:** https://inertiajs.com/docs/v3/the-basics/title-and-meta
- **Translation:** from "a head-management library" to "a component that ships with the adapter".
- **Controls:** a title field that updates the tab title live.
- **Test asserts:** the route renders; the title behaviour is client-side.

---

## Task 9: Chapters 29 to 32, errors, security and tooling

### Chapter 29: `error-handling`

- **Title:** When something goes wrong
- **Question:** A 500 during a visit is a JSON response the client cannot render. What does the reader see?
- **Concept:** In development Inertia shows the real error in a modal; in production `Inertia::handleExceptionsUsing()` renders an error page.
- **Docs:** https://inertiajs.com/docs/v3/advanced/error-handling
- **Translation:** from "an error boundary plus a catch on every call" to "the framework's own error page, rendered as a normal Inertia response".
- **Controls:** buttons producing 404, 419, 500 and a non-Inertia response.
- **Page content:** the `ExceptionResponse` API (`render`, `withSharedData`, `usingMiddleware`, `rootView`, `statusCode`), verified against the installed class, and the trap that a 404 happens outside the Inertia middleware so shared data must be requested explicitly.
- **Test asserts:** each deliberate failure route returns its status.

### Chapter 30: `authorization-and-csrf`

- **Title:** Who may do what
- **Question:** Where do permissions live when the client has no token?
- **Concept:** Authorization travels as props derived from policies; the session cookie carries identity, and a stale CSRF token produces a 419.
- **Docs:** https://inertiajs.com/docs/v3/security/authorization and https://inertiajs.com/docs/v3/security/csrf-protection
- **Translation:** from "a bearer token, a CORS policy, and permission claims decoded on the client" to "the session you already have, and permissions computed per request".
- **Props:** a post plus a `can` array from a real policy.
- **Controls:** switching the demo user changes what the buttons allow; a button that submits with a deliberately wrong CSRF token.
- **Test asserts:** the policy denies the non-author; the bad token produces 419.

### Chapter 31: `devtools-and-testing`

- **Title:** The tools you actually use
- **Question:** What do you reach for when a page sends the wrong props?
- **Concept:** The official DevTools record every request; `AssertableInertia` asserts props in tests.
- **Docs:** https://inertiajs.com/docs/v3/advanced/devtools and https://inertiajs.com/docs/v3/advanced/testing
- **Translation:** from "the network tab and a mocking library" to "a panel that pairs each request with its props, and assertions that read the page object".
- **Page content:** how to install and enable the DevTools extension, what its four tabs show, how it differs from this lab's own strip, and a real test file shown through the source view. Say plainly that the strip is a teaching device and the DevTools are the tool.
- **Controls:** a button that runs the chapter's own test through `Artisan::call` and prints the output. If running tests from a route proves unreliable, show the test file and its expected output instead and say so.
- **Test asserts:** the chapter's own `AssertableInertia` assertions, which are the subject matter.

### Chapter 32: `typescript-and-splitting`

- **Title:** Types across the boundary
- **Question:** What tells the editor the shape of the props?
- **Concept:** Page props are typed on the client; code splitting decides how much of the app ships up front.
- **Docs:** https://inertiajs.com/docs/v3/advanced/typescript and https://inertiajs.com/docs/v3/advanced/code-splitting
- **Translation:** from "a generated client from an OpenAPI document" to "a TypeScript type next to the component, and whatever the team keeps in sync".
- **Page content:** the honest limitation, that nothing enforces the match between the controller's array and the component's type unless a generator is added, and where Wayfinder fits.
- **Test asserts:** the route renders.

---

## Final task: the map, the README and the whole-app pass

- Update the home page so the chapter map groups chapters by part and shows the reader an order to follow.
- Fill the "where did it go?" rows so every row points at the chapter that now demonstrates it, replacing the placeholders that pointed at `mental-model`.
- Update the README's chapter list.
- Run the whole suite, the gates, and a browser pass over every chapter, reading the console for errors on each.
- Report which chapters, if any, had to drop a control because the installed version lacked the API.
