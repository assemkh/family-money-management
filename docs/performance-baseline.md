# Performance, Responsive, and Regression Baseline

Status: Phase 1.A complete  
Recorded: 2026-08-26  
Runtime: Next.js 16.3.3, React 19.2.8, Node.js 22, Chromium/Playwright 1.62.1  
Data source: disposable local Supabase only

## Purpose and completion result

Phase 1.A establishes the measurement system used by the remaining refactor,
responsive, and performance work. It does not claim that the existing interface
already meets every release target. Existing issues are encoded as explicit
regression ceilings so future work can reduce them without allowing them to grow.

The subphase is complete because the repository now has:

- isolated English owner, English member, and Arabic owner fixtures generated at
  runtime with random passwords;
- 320, 375, 430, 768, 1024, 1280, and 1440 pixel coverage;
- light/dark and left-to-right/right-to-left screenshot baselines;
- axe audits for login, dashboard, expense and income entry surfaces, reports,
  settings, and a real settings confirmation dialog;
- reproducible desktop and throttled mobile lab profiles for login, dashboard,
  expenses, reports, settings, net worth, and monthly planning;
- English and Arabic font-transfer samples;
- privacy-safe Web Vitals dimensions and Supabase request timing;
- per-route gzip bundle inventory using Next.js App Router manifests;
- representative `EXPLAIN (ANALYZE, BUFFERS)` output against synthetic data;
- one local command that builds, measures, tests, summarizes, and cleans up.

## Reproducing the baseline

The local Supabase services must be running. Chromium installation is required
only once per development machine.

```bash
npm run supabase:start
npm run playwright:install
npm run test:phase-1a
```

`test:phase-1a` deliberately resolves the local Supabase URL and keys before
`next build`. `NEXT_PUBLIC_` values are compiled into the client bundle, so
selecting the disposable project only at `next start` would create a dangerous
mixed hosted/local configuration.

Useful narrower commands are:

```bash
npm run test:e2e:public
npm run test:e2e
npm run analyze:assets
npm run analyze:bundle
```

The official Next.js experimental analyzer writes its report under `.next`, and
the repository reporter writes compressed route and font inventory under
`.artifacts/bundle/`.

## Fixture and security model

The full suite is local-first and fails closed when local Supabase is unavailable.
Global setup creates uniquely named synthetic households and users, saves generated
credentials only in ignored `.artifacts/auth/credentials.json`, and removes all
fixture rows and Auth users during teardown. Cleanup targets only household names
reserved by this suite. The verified residue after the recorded run was zero.

Hosted tests never create or delete users. They require explicit E2E credentials,
and authenticated performance traffic additionally requires
`E2E_ALLOW_HOSTED_PERFORMANCE=1`. Hosted financial screenshots require the separate
`E2E_ALLOW_PRIVATE_SCREENSHOTS=1` opt-in. These switches must not be enabled in
ordinary CI.

The server trace endpoint is available only when the server-only
`FMM_PERFORMANCE_TRACE_TOKEN` exists and the request presents the same token. It
returns `404` otherwise. Traces retain method, status, duration, and a sanitized
Supabase resource such as `/rest/v1/accounts`. Query strings, IDs, dates, names,
notes, financial values, cookies, and response bodies are never captured.

## Lab profiles

| Profile |   Viewport | Network                                                        |         CPU |
| ------- | ---------: | -------------------------------------------------------------- | ----------: |
| Desktop | 1280 × 900 | Local unthrottled                                              |          1× |
| Mobile  |  375 × 812 | Fast 4G approximation: 150ms latency, 1.6Mbps down, 750Kbps up | 4× slowdown |

Next.js speculative prefetch requests are blocked during measurement so each
trace describes the selected route. Every report includes TTFB, FCP, LCP, CLS,
observed event duration, interaction-to-next-paint proxy, resource count,
transferred and decoded bytes, initial script bytes, font bytes, Web Vitals events,
and sanitized Supabase calls.

These values are a single local diagnostic run, not field p75 data and not a
service-level objective. Compare future changes on the same machine and profile,
then confirm release targets with real field telemetry.

## Recorded route measurements

Times are milliseconds; transfer, JavaScript, and font columns are KiB. The table
is the accepted 2026-08-26 local baseline and will vary modestly between runs.

| Route        | Profile | TTFB |  FCP |  LCP |    CLS | Event/INP lab | Interaction paint | Transfer |    JS | Fonts |
| ------------ | ------- | ---: | ---: | ---: | -----: | ------------: | ----------------: | -------: | ----: | ----: |
| Login        | Desktop |  6.5 |   96 |   96 |      0 |             0 |                55 |    419.9 | 139.6 | 259.2 |
| Login        | Mobile  |  7.6 |  884 |  884 |      0 |           704 |                68 |    185.4 |  67.7 |  96.7 |
| Dashboard    | Desktop | 40.2 |  156 |  156 | 0.0005 |             0 |               104 |    461.3 | 181.0 | 259.2 |
| Dashboard    | Mobile  | 27.5 |  980 | 1456 | 0.0001 |           808 |               116 |    185.2 |  67.4 |  96.7 |
| Expenses     | Desktop | 24.2 |  140 |  140 | 0.0005 |           104 |                99 |    463.3 | 183.0 | 259.2 |
| Expenses     | Mobile  | 33.2 |  912 | 1396 |      0 |           736 |                92 |    187.1 |  69.4 |  96.7 |
| Reports      | Desktop | 32.7 |  152 |  152 | 0.0005 |           104 |                90 |    461.2 | 180.9 | 259.2 |
| Reports      | Mobile  | 29.4 |  944 | 1428 |      0 |           776 |               102 |    185.1 |  67.3 |  96.7 |
| Net Worth    | Desktop | 27.8 |  124 |  124 | 0.0005 |             0 |                95 |    461.9 | 181.6 | 259.2 |
| Net Worth    | Mobile  | 26.7 |  896 | 1396 | 0.0002 |           728 |                92 |    185.8 |  68.0 |  96.7 |
| Monthly Plan | Desktop | 43.4 |  144 |  144 | 0.0005 |             0 |                81 |    463.8 | 183.4 | 259.2 |
| Monthly Plan | Mobile  | 36.2 |  920 |  920 | 0.0005 |           744 |                90 |    187.6 |  69.8 |  96.7 |
| Settings     | Desktop | 43.3 |  168 |  168 | 0.0005 |             0 |               112 |    473.2 | 192.9 | 259.2 |
| Settings     | Mobile  | 32.3 | 1112 | 1520 |      0 |           944 |               576 |    473.2 | 192.9 | 259.2 |

The Settings mobile sample loads the full desktop script/font footprint and has
the slowest representative interaction. That is a priority investigation for the
later responsive and bundle subphases. The event-duration observer is intentionally
more sensitive than the two-frame paint proxy under CPU throttling; neither is a
replacement for field INP.

## Supabase request baseline

| Route        | Request count | Recorded aggregate duration |
| ------------ | ------------: | --------------------------: |
| Dashboard    |            16 |             about 134–151ms |
| Expenses     |             7 |               about 31–40ms |
| Reports      |            10 |                  about 58ms |
| Net Worth    |             8 |               about 43–46ms |
| Monthly Plan |             7 |               about 33–35ms |
| Settings     |             8 |               about 40–45ms |

The range combines desktop and mobile runs; network throttling affects browser
resources, while Supabase calls execute server-side. Dashboard fan-out is the
clearest request-reduction opportunity. Its trace includes settings twice and
many parallel domain reads. Phase 2 must compare new read models to these counts
without weakening RLS or introducing private cross-request caches.

Representative query plans show index scans for income and expense date ranges,
and a bitmap index scan for household expense categories. Accounts and the empty
monthly-plan fixture use sequential scans because the synthetic tables contain
only a few rows; PostgreSQL reasonably prefers a tiny scan at that cardinality.
Before adding indexes, Phase 2 should repeat the plans with representative scaled
synthetic data. The sequential scan on `families.name` belongs only to fixture ID
lookup in the diagnostic query, not the application request path.

## Build and font inventory

The route report deduplicates chunks referenced by each App Router client-reference
manifest and computes gzip locally. It is an inventory, not browser transfer truth;
the browser table above records actual resource transfer separately.

| Route     | Manifest-referenced client JS gzip |      Raw |
| --------- | ---------------------------------: | -------: |
| Login     |                            16.4KiB |  45.1KiB |
| Dashboard |                            57.5KiB | 172.8KiB |
| Expenses  |                            59.5KiB | 180.0KiB |
| Reports   |                            57.5KiB | 172.7KiB |
| Settings  |                            68.8KiB | 225.0KiB |

Settings is the largest measured route. Three emitted WOFF2 assets total 258.3KiB
raw: 39.3KiB, 56.8KiB, and 162.3KiB. The Arabic dashboard transferred 290.1KiB of
fonts on desktop and 127.6KiB on mobile, versus 259.2KiB and 96.7KiB for English.
The additional 30.9KiB in both profiles is the measured Arabic typography cost.
Samples remain available as `dashboard-ar-desktop.json` and
`dashboard-ar-mobile.json` for later comparison.

## Accessibility baseline and known debt

Login currently has no serious or critical axe violations. Authenticated surfaces
have existing debt encoded by rule and maximum affected-node count:

| Surface         | Rule                          | Maximum current nodes |
| --------------- | ----------------------------- | --------------------: |
| Dashboard       | `color-contrast`              |                     7 |
| Dashboard       | `scrollable-region-focusable` |                     1 |
| Expenses        | `color-contrast`              |                     4 |
| Income          | `color-contrast`              |                     2 |
| Reports         | `scrollable-region-focusable` |                     2 |
| Settings dialog | `color-contrast`              |                     1 |

Any new serious/critical rule or any increase above these node counts fails the
suite. When a later subphase fixes nodes, lower or remove the corresponding ceiling
in `tests/e2e/authenticated-accessibility.spec.ts` in the same change. Never raise a
ceiling to make a regression pass without a written exception.

Member Settings and its owner-only management dialog are intentionally skipped;
owner English and owner Arabic cover those controls. Member access remains covered
on Dashboard, Expenses, Income, and Reports.

## Responsive baseline and known debt

The suite stores 74 structural screenshots across the public login and authenticated
English/Arabic matrix. Generated images are ignored because they can contain the
synthetic financial fixture; Playwright retains failure traces/screenshots under
`.artifacts/playwright/`.

Current page-level overflow allowances are explicit:

- Dashboard below 650px may currently reach a 650px document width.
- Reports at 375px may currently reach 602px.
- Settings at 375px may currently reach 565px.
- Expenses and the representative 768/1280 views have no extra allowance.

These ceilings identify existing defects; they are not responsive acceptance
targets. Phase 3 must reach viewport width plus the one-pixel rounding tolerance,
then remove each allowance from `tests/e2e/responsive-baseline.spec.ts`.

## Web Vitals delivery

`WebVitalsReporter` is a small client boundary mounted once by the root layout. It
records only metric value/delta/id/name/rating/navigation type plus pathname,
effective household locale, light/dark theme, and phone/tablet/desktop class. It
never reads query parameters, user/profile fields, or financial content.

During tests, values are available in `window.__FAMILY_MONEY_WEB_VITALS__` and via
the `family-money:web-vital` browser event. Production delivery is disabled unless
`NEXT_PUBLIC_WEB_VITALS_ENDPOINT` is configured. A trusted first-party collector
must validate payload size and shape, apply rate limits, and define retention before
that variable is added to Vercel. Phase 1.A intentionally does not send household
traffic to an unapproved analytics provider.

## Generated artifacts

All paths below are ignored by Git:

- `.artifacts/auth/` — generated credentials and storage states;
- `.artifacts/bundle/build-assets.json` and `.md` — route/font inventory;
- `.artifacts/performance/*.json` — route/profile measurements;
- `.artifacts/performance/query-plans.txt` — sanitized synthetic plans;
- `.artifacts/screenshots/` — responsive snapshots;
- `.artifacts/playwright/` — HTML report and failure diagnostics.

The summary generator removes stale performance artifacts at setup and sorts by
route, locale, and profile. This prevents renamed tests from contaminating a later
comparison.

## CI behavior

GitHub Actions installs Chromium and runs the public login accessibility,
responsive, and performance surface without secrets. The complete authenticated
suite is intentionally local because it needs disposable Supabase services. A
future CI job may start Supabase and run `npm run test:phase-1a`; it must preserve
the same fixture cleanup and must not point at production.

## Verification record

Final verification passed formatting, lint, type checking, 78 unit tests, all 131
Supabase database tests, the production build, the native Next.js analyzer, and the
expanded browser matrix. Playwright completed 108 tests with two intentional member
Settings skips. Teardown removed every synthetic household and Auth fixture.

## Handoff to Phase 1.B

Phase 1.B is documentation and Interface design only; it must not change production
behavior. The next agent or developer should:

1. Read `docs/refactor_responsive_perofrmance_plan.md` and this baseline in full.
2. Add the canonical financial language to `CONTEXT.md`.
3. Add ADRs for financial source-of-truth rules, authenticated rendering/cache
   safety, and adaptive navigation/breakpoints.
4. Map every mutation to Dashboard, Reports, Monthly Plan, Net Worth, and detail
   read models/routes it can invalidate.
5. Specify the household request-context and authenticated-action Interfaces,
   their hidden responsibilities, consumers, and deletion-test rationale.
6. Keep private cross-request caching forbidden unless household-keyed,
   authorization-safe, bounded, and explicitly invalidated.
7. Run `npm run check`, `npm run supabase:test:db`, and
   `npm run test:phase-1a` before marking Phase 1.B complete.

Do not optimize from one timing number. Use this system to compare before/after
measurements, preserve financial correctness and RLS, lower recorded debt ceilings
when fixes land, and document every exception beside the relevant baseline.
