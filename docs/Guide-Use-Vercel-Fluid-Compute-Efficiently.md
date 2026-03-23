# Guide: Using Vercel Fluid Compute efficiently

## 1) The mental model Codex should optimize for

With Fluid Compute, Vercel bills **Active CPU** only while your code is actually executing. When your function is waiting on I/O such as database queries or external API calls, CPU billing pauses, though provisioned memory billing continues until the in-flight work finishes. That means the fastest path to lower Fluid CPU usage is usually: **avoid invoking functions when possible, and make each invoked function do less actual compute.** ([Vercel][1])

Fluid Compute is enabled by default for new projects, and older projects can enable it explicitly. Configuration precedence is also important: **function code overrides `vercel.json`, which overrides dashboard settings, which override Fluid defaults**. Codex should respect that order before proposing changes. ([Vercel][2])

## 2) Optimization order Codex should follow

### A. Measure first, then optimize

Codex should start by identifying the worst offenders in **Usage** and **Observability**, not by globally changing settings. Vercel’s usage dashboard is the place to understand function metrics, and Vercel also supports usage alerts and spend management so teams can catch regressions early. If you have richer Observability access, route-level function data becomes even more useful for sorting by duration and finding expensive endpoints. ([Vercel][3])

### B. Reduce function invocations before tuning function settings

The best optimization is often to **serve from cache instead of running the function at all**. Vercel recommends using CDN caching for dynamic content that does not need real-time freshness, using ISR for page-level caching, and using Next.js caching APIs for reusable data and computations. ([Vercel][4])

### C. After caching, reduce per-request compute

Once unavoidable routes are identified, Codex should focus on expensive JSON transforms, report generation, sorting/filtering large datasets, repeated ORM work, image/document processing, and duplicate fetch/query chains. That is where Active CPU accumulates, because Vercel bills the actual compute time your code spends processing. ([Vercel][1])

### D. Only then tune region, duration, and memory/CPU

Region, max duration, and memory/CPU matter, but they are second-order wins compared with caching and removing wasted work. Region affects latency to your data source, max duration is a guardrail, and memory/CPU tuning can either help or hurt depending on the workload. ([Vercel][5])

## 3) Best practices Codex should apply

### 3.1 Verify Fluid Compute is actually enabled where needed

For any older Vercel project, Codex should verify Fluid Compute is on. If you want it explicitly controlled in source, use `vercel.json`. ([Vercel][2])

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "fluid": true
}
```

That is the supported project-level switch in `vercel.json`. ([Vercel][2])

### 3.2 Prefer caching over request-time work

For dynamic responses that can tolerate staleness, Codex should cache them at the CDN layer or use ISR. Vercel’s CDN can cache function responses with `Cache-Control`, and ISR stores page responses in the CDN and durable storage. ([Vercel][4])

Example for a route handler or API response:

```ts
export async function GET() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
    }
  })
}
```

On Vercel, function responses can be cached with `Cache-Control`, and targeted CDN headers such as `CDN-Cache-Control` and `Vercel-CDN-Cache-Control` are also available when you need finer control. ([Vercel][4])

### 3.3 In Next.js, cache data and computations aggressively when they are reusable

For Next.js 16, Codex should prefer the `use cache` model. It can cache functions, components, pages, and other computations. For earlier App Router patterns, `fetch(..., { next: { revalidate } })` and `unstable_cache` remain relevant; `unstable_cache` is specifically for expensive operations like database queries, though Next.js 16 recommends migrating to `use cache`. ([Next.js][6])

Example, Next.js 16 style:

```ts
import { cacheLife } from "next/cache"

export async function getProducts() {
  "use cache"
  cacheLife("hours")
  return db.product.findMany()
}
```

Example, older pattern:

```ts
const res = await fetch("https://api.example.com/posts", {
  next: { revalidate: 3600 }
})
```

Or for DB work:

```ts
import { unstable_cache } from "next/cache"

export const getCachedUser = unstable_cache(
  async (id: string) => db.user.findUnique({ where: { id } }),
  ["user"],
  { revalidate: 3600 }
)
```

Those patterns are directly aligned with Next.js’ caching guidance for reusing data across requests. ([Next.js][7])

### 3.4 Use remote/shared caching selectively, not everywhere

For Next.js 16 request-time work outside the static shell, Codex can consider `'use cache: remote'`, but only when it is justified. Next.js explicitly warns against remote caching when operations are already fast, when the data changes too frequently, or when cache keys are highly unique per request. It is most useful for slow or rate-limited upstreams, expensive queries/computations, and shared request-time content where in-memory cache hits are too low. ([Next.js][8])

This means Codex should **avoid** remote caching for things like per-user cache keys, endless search/filter permutations, or ultra-fresh values. It should prefer lower-cardinality keys such as language, category, or product ID when shared caching is needed. ([Next.js][8])

### 3.5 Use Vercel Runtime Cache for repeated generic function work, but do not mix up its invalidation model with ISR

Vercel Runtime Cache is a **regional, ephemeral cache** for functions, middleware, and builds, with TTLs and tags. It is useful for reducing duplicate work close to where the code runs. However, Vercel’s own docs say Runtime Cache does **not** integrate first-class with ISR invalidation: `revalidatePath`/`revalidateTag` do not invalidate Runtime Cache, and Runtime Cache tags do not invalidate ISR pages. Runtime Cache usage is also charged. ([Vercel][9])

So Codex should use Runtime Cache intentionally for function-level reuse, but should not assume it shares invalidation semantics with ISR or Next.js page revalidation. ([Vercel][10])

### 3.6 Put functions near the database or main upstream

Vercel explicitly recommends running functions close to the data source. If a function is far from the database, every query adds latency and extends the time work stays in flight. Codex should audit project-level and per-function regions, especially when some routes use different backends. ([Vercel][5])

A reasonable baseline `vercel.json` pattern is:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "regions": ["iad1"],
  "functions": {
    "app/api/reports/**/*": {
      "maxDuration": 15,
      "regions": ["iad1"]
    },
    "app/api/webhooks/**/*": {
      "maxDuration": 30,
      "regions": ["iad1"]
    }
  }
}
```

Vercel supports project-level and per-function region settings, and per-function regions are especially useful when different routes talk to different data sources. ([Vercel][11])

### 3.7 Set `maxDuration` intentionally

`maxDuration` should be used as a guardrail, not as a bandage. Codex should lower it for routes that should always be fast and predictable, and only raise it for truly long-running routes that have no better design. On Fluid Compute, the default duration is 300 seconds, with higher maximums on Pro and Enterprise. ([Vercel][12])

In a Next.js route:

```ts
export const maxDuration = 5
```

Or in `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "functions": {
    "app/api/**/*": {
      "maxDuration": 5
    }
  }
}
```

That is the supported pattern for route-level or glob-based duration control. ([Vercel][12])

### 3.8 Tune memory/CPU based on workload, not superstition

On current Vercel docs, the memory selection determines the CPU allocated to functions. Vercel notes that increasing memory/CPU can improve performance and may even reduce overall billed duration for CPU-heavy work, while too little memory can throttle CPU and make heavy functions slower. Codex should therefore benchmark CPU-heavy routes before recommending a downgrade in memory/CPU. ([Vercel][13])

Also, for current Fluid Compute settings, Vercel says memory size is configured in the dashboard, not in `vercel.json`. On Pro and Enterprise, the default is 2 GB / 1 vCPU and can be upgraded to 4 GB / 2 vCPUs. ([Vercel][13])

### 3.9 Audit DB pooling and suspension behavior

If the app uses pooled database clients, Codex should evaluate `attachDatabasePool` from `@vercel/functions`. Vercel says it should be called right after creating the pool so idle clients are released before functions suspend under Fluid Compute. ([Vercel][10])

Example:

```ts
import { Pool } from "pg"
import { attachDatabasePool } from "@vercel/functions"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

attachDatabasePool(pool)
```

That is a real Vercel-specific optimization, not just generic Node advice wearing a fake moustache. ([Vercel][10])

### 3.10 Be careful with module-level mutable state

Fluid Compute allows multiple invocations to share the same physical instance concurrently. That improves performance and cost, but it also means Codex should audit for unsafe mutable globals, singleton state that assumes one request at a time, and caches that accidentally mix request-specific data. ([Vercel][2])

### 3.11 Use modern Node in production where possible

On Node.js 20+ in production, Vercel applies bytecode caching for faster subsequent cold starts. This is more of a latency win than a direct CPU-hour lever, but it is still a good baseline optimization for sporadically invoked functions. ([Vercel][2])

## 4) What Codex should actively look for in the codebase

Codex should audit for these patterns and change them when safe:

* Routes using `cache: "no-store"`, `default-no-store`, `only-no-store`, or equivalent request-time rendering defaults even though the data is reusable. Those settings push more work into request time. ([Next.js][14])
* Repeated DB queries or external API calls for identical inputs without `use cache`, `unstable_cache`, Runtime Cache, or CDN/ISR caching. ([Next.js][15])
* API routes returning deterministic data but lacking `Cache-Control` headers. ([Vercel][4])
* Functions running far from their main database or upstream API. ([Vercel][5])
* CPU-heavy transforms inside the request path that could be precomputed, cached, or moved to write time. This is an engineering inference directly aligned with Vercel’s Active CPU billing model. ([Vercel][1])
* DB pools created without `attachDatabasePool` where supported. ([Vercel][10])
* Remote cache keys with very high cardinality, such as one key per user, per session, or per arbitrary filter combination. ([Next.js][8])
* Unsafe shared mutable globals under concurrent execution. ([Vercel][2])

## 5) Practical engineering rules Codex should follow

* **Default to static or cached unless freshness is truly required.** Next.js and Vercel both provide multiple caching layers; use them before adding more compute. ([Next.js][15])
* **Cache at the highest sensible layer.** CDN/ISR usually beats function-level caching for public content because it avoids the function entirely. Runtime Cache or data-level caching is better when only part of the work is reusable. ([Vercel][4])
* **Use shared remote caching only where in-memory caching is not enough.** Next.js explicitly frames `'use cache: remote'` as a selective tool with extra cost and latency tradeoffs. ([Next.js][8])
* **Keep cache keys low-cardinality.** Prefer language/category/product over session/user/random query combinations. ([Next.js][8])
* **Use memory/CPU upgrades for CPU-bound routes, not for everything.** Too little memory can throttle CPU; more CPU can reduce runtime for heavy tasks. ([Vercel][13])
* **Set route-specific `maxDuration` values.** Fast routes should fail fast; only long jobs should get long time budgets. ([Vercel][12])

## 6) Definition of success

A good Codex optimization pass should produce these outcomes:

* Fewer function invocations on cacheable traffic. ([Vercel][4])
* Lower Active CPU usage on hot routes because repeated compute is removed or cached. ([Vercel][1])
* Lower latency to DB-backed routes because function regions match data regions. ([Vercel][5])
* Fewer slow/time-out routes because `maxDuration`, memory/CPU, and DB pool behavior are tuned intentionally. ([Vercel][12])
* Cleaner separation between public cacheable data, request-time shared cacheable data, and truly per-user fresh data. ([Vercel][16])

## 7) A concise brief

Review this Vercel project for Fluid Compute efficiency. Optimize in this order:

1. identify the hottest routes from Vercel Usage and Observability,
2. reduce function invocations with CDN cache, ISR, and Next.js caching,
3. remove repeated expensive compute inside request paths,
4. align function regions to the database/upstreams,
5. set route-specific `maxDuration`,
6. benchmark memory/CPU only for CPU-heavy routes,
7. audit DB pools for `attachDatabasePool`,
8. avoid unsafe mutable module globals under concurrent execution,
9. use `use cache` / `unstable_cache` / Runtime Cache selectively,
10. avoid high-cardinality remote cache keys and avoid remote caching where data is too fresh or operations are already fast.
    Prefer changes that reduce request-time work without changing behavior.

## 8) Pin Forge Studio roadmap

This section captures the current roadmap for Pin Forge Studio specifically. These items are intentionally limited to lower-risk, easier changes that should improve Fluid Compute efficiency without materially changing product behavior or introducing major consistency risk.

### 8.1 Current stance

- No implementation is planned immediately.
- This is a future roadmap, not an active optimization pass.
- Prefer configuration, delivery, and narrow caching wins before any larger query or architecture refactors.
- Avoid roadmap items that would risk stale publishing state, stale queue guidance, or drift between Studio and Publer.

### 8.2 Approved low-risk roadmap items

#### A. Add explicit Vercel source config

Document and later implement a checked-in `vercel.json` that:

- explicitly enables Fluid Compute if needed
- defines the intended default region
- sets route-group `maxDuration` values where the app already expects predictable behavior

Expected impact:

- clearer deployment behavior
- easier debugging of timeouts and route budgets
- better consistency between dashboard settings and source control

Likely Pin Forge Studio targets:

- fast dashboard write routes
- long-running generation / publish / sync routes

#### B. Standardize route-specific `maxDuration`

Add explicit duration budgets to routes that should always be quick, and keep longer budgets only for routes that are already known to be heavy.

Expected impact:

- fewer runaway executions
- easier identification of real slow-path regressions
- cleaner operational guardrails

Low-risk targets include:

- workspace selection route
- API key routes
- Publer options route
- small dashboard mutation routes such as snooze / settings-related writes

#### C. Reduce asset-serving function invocations

Review generated pin delivery so persistent generated assets are served with stronger cache semantics, while temporary uploads remain `no-store`.

Expected impact:

- fewer function invocations on image-heavy screens such as review and publish
- lower repeated read cost for generated pin assets
- faster image loading in dashboard workflows

Important constraint:

- only treat persistent generated assets as strongly cacheable if keys are effectively immutable

#### D. Prefer direct public asset URLs where already supported

When the storage configuration already supports a public asset base URL, prefer that path for persistent generated assets instead of routing those reads through the app.

Expected impact:

- removes the app server from repeated asset reads
- reduces Fluid Compute usage without changing user-facing workflow

Important constraint:

- do not apply this to temporary uploads or any asset flow that still requires private handling

#### E. Add short-lived caching to low-churn read helpers

Use selective, conservative caching only for helpers that are reused across dashboard pages and do not need immediate freshness on every request.

Good future candidates:

- integration settings summary
- workspace profile defaults
- other shared dashboard configuration reads with low volatility

Expected impact:

- fewer repeated DB reads
- lower request-time recomputation across the dashboard shell

Important constraint:

- keep TTLs short and avoid caching user-specific values with overly broad keys

#### F. Add short-lived caching or memoization for Publer option discovery

The Publer workspace/account/board discovery path is a good candidate for conservative, session-like reuse.

Expected impact:

- fewer repeated Publer API calls from settings and publish screens
- lower repeated I/O and smaller Fluid execution windows on those reads

Important constraint:

- avoid long-lived stale caches after settings or workspace changes

### 8.3 Not in the low-risk roadmap yet

These may still be valid later, but they are intentionally excluded from the current easy/safe roadmap:

- deep refactors of broad Prisma query shapes
- write-time aggregated dashboard metrics
- background continuation / job queue redesign for long-running routes
- aggressive caching of publishing queue or schedule recommendation state
- high-cardinality remote caching
- memory/CPU tuning before usage evidence identifies CPU-bound routes

### 8.4 Implementation order for the future

When this roadmap is activated, the preferred order is:

1. verify hot routes in Vercel Usage and Observability
2. add explicit `vercel.json` config and route-specific duration budgets
3. improve generated asset delivery and cache headers
4. enable direct public asset reads where the storage setup already allows it
5. add short-lived caching to low-churn settings and Publer option reads

### 8.5 Success criteria for Pin Forge Studio

The roadmap should be considered successful if it produces:

- fewer function invocations for generated pin asset reads
- more explicit and predictable timeout behavior
- lower repeated DB/API work on low-churn dashboard helpers
- no visible regressions in publishing correctness, Publer sync behavior, or dashboard freshness



[1]: https://vercel.com/docs/functions/usage-and-pricing "Fluid compute pricing"
[2]: https://vercel.com/docs/fluid-compute "Fluid compute"
[3]: https://vercel.com/docs/pricing/manage-and-optimize-usage "Manage and optimize usage"
[4]: https://vercel.com/docs/caching/cdn-cache "Vercel CDN Cache"
[5]: https://vercel.com/docs/functions/configuring-functions/region "Configuring regions for Vercel Functions"
[6]: https://nextjs.org/docs/app/api-reference/directives/use-cache?utm_source=chatgpt.com "Directives: use cache"
[7]: https://nextjs.org/docs/app/getting-started/caching-and-revalidating?utm_source=chatgpt.com "Getting Started: Caching and Revalidating"
[8]: https://nextjs.org/docs/app/api-reference/directives/use-cache-remote "Directives: use cache: remote | Next.js"
[9]: https://vercel.com/docs/caching/runtime-cache "Runtime Cache"
[10]: https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package "@vercel/functions API Reference (Node.js)"
[11]: https://vercel.com/docs/project-configuration/vercel-json "Static Configuration with vercel.json"
[12]: https://vercel.com/docs/functions/configuring-functions/duration "Configuring Maximum Duration for Vercel Functions"
[13]: https://vercel.com/docs/functions/configuring-functions/memory "Configuring Memory and CPU for Vercel Functions"
[14]: https://nextjs.org/docs/app/guides/caching-without-cache-components "Guides: Caching (Previous Model) | Next.js"
[15]: https://nextjs.org/docs/app/getting-started/caching-and-revalidating "Getting Started: Caching | Next.js"
[16]: https://vercel.com/docs/caching/runtime-cache/data-cache "Data Cache for Next.js"
