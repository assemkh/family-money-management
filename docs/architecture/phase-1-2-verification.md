# Phase 1–2 independent verification

**Audit date:** 2026-08-26  
**Decision:** Phase 1.A, 1.B, 2.A, and 2.B are complete. Phase 3.A is next.

This record audits the five-commit feature stack before it is integrated into `main`.
It distinguishes completed acceptance work from later roadmap items, and gives the
next developer or AI agent reproducible commands rather than relying on status prose.

## Audited commit stack

| Commit    | Subphase | Delivered outcome                                   |
| --------- | -------- | --------------------------------------------------- |
| `5a1a484` | 1.A      | Performance, responsive, and regression baseline    |
| `ca19f68` | 1.B      | Domain language, decisions, and mutation mapping    |
| `db97882` | 1.B      | Shared Interface specifications and Phase 1 handoff |
| `f8b4167` | 2.A      | One request-local verified Household context        |
| `cffef9c` | 2.B      | Domain read models and bounded high-fan-out queries |

The stack is linear from the previous `main` commit and preserves each subphase as a
separate commit. The independent audit correction is intentionally a sixth commit so
the original work and the review findings remain easy to inspect.

## Corrections made by the audit

- Strengthened the shell-streaming contract. It now requires the shell and fallback
  in network chunks earlier than dashboard content; HTML byte order alone was not
  proof of streaming. The final run recorded chunk `1` for the shell/fallback and
  chunk `8` for content.
- Removed all 7 Dashboard color-contrast allowances by increasing low-opacity text
  contrast. Axe now settles finite entrance animations before evaluating contrast,
  which removes timing-dependent false positives without ignoring continuous loading
  indicators.
- Added `npm run test:query-plans`. It owns safe local fixture setup/teardown, asserts
  the expense-range and current-Revision planner choices, records raw plans under the
  ignored `.artifacts/` directory, and proves the retired query reads 242 Revisions.
- Extracted shared characterization fixture orchestration so snapshot and query-plan
  runners use one cleanup implementation. The append-only Revision trigger is restored
  in every success and failure path.
- Corrected stale roadmap handoffs and the Valuation ownership statement. Financial
  read models share one effective-rate reader; Settings deliberately owns its separate
  exchange-rate management projection. The authenticated-action executor remains an
  Interface scheduled for Phase 4.A, not a Phase 2 implementation.

## Acceptance matrix

| Subphase | Result   | Evidence                                                                                               |
| -------- | -------- | ------------------------------------------------------------------------------------------------------ |
| 1.A      | Complete | One browser command, viewport/locale/theme matrix, privacy-safe measurements, bundle output, axe gates |
| 1.B      | Complete | `CONTEXT.md`, 3 ADRs, mutation dependency map, and 3 named Interface documents                         |
| 2.A      | Complete | Request-local context, one profile/Household path, route authorization scenarios, real stream ordering |
| 2.B      | Complete | Original monolith deleted, 15 stable read-model snapshots, reduced requests, bounded revision reads    |

## Final verification gates

All gates passed from the feature head with the disposable local Supabase project:

| Command                    | Result                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| `npm run check`            | Format, ESLint, TypeScript, 93 unit tests, and Next.js 16.3.3 production build passed    |
| `npm run test:phase-1a`    | 119 browser tests passed; 2 intentional Member skips; English/Arabic and viewport matrix |
| `npm run test:read-models` | 15 financial characterization snapshots passed                                           |
| `npm run test:query-plans` | Scaled plan assertions passed at 6,000 Expenses and 242 Monthly Plan Revisions           |
| `npm run supabase:test:db` | 139 pgTAP assertions across 11 files passed                                              |
| `supabase db lint`         | Public schema returned no errors                                                         |
| `npm audit --omit=dev`     | 0 runtime dependency vulnerabilities                                                     |

Fixture cleanup was checked separately: 0 Phase 1.A Households, 0 characterization
Households, and the `monthly_plan_versions_immutable` trigger enabled normally.

## Deliberate later work

These items are not missing Phase 1 or 2 work:

- The responsive navigation shell and page adaptations belong to Phase 3.A and 3.B.
- The declarative authenticated-action executor and mutation invalidation registry
  were specified in 1.B and are scheduled for Phase 4.A, where they gain real consumers.
- Dashboard/Reports granular Suspense splits remain in Phase 4.A because their current
  critical and secondary projections share rows; splitting now would duplicate reads.
- Recorded contrast and scroll-region debt on Expenses, Income, Reports, and the
  Settings dialog remains guarded by non-increasing ceilings for later responsive and
  accessibility work. The Dashboard contrast ceiling is now removed.

Do not reopen Phase 1 or 2 for these planned items. Start Phase 3.A from the adaptive
navigation ADR and preserve every gate above.
