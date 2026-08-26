# Phase 3.A independent verification

**Audit date:** 2026-08-26  
**Decision:** Phase 3.A is complete after the corrections below. Phase 3.B is next.

This record audits feature commit `7b92523` before integration into `main`. It keeps
the original implementation and the review correction in separate commits so a later
developer or AI agent can see both the delivered design and what the audit tightened.

## Corrections made by the audit

- Replaced the profile `<details>` disclosure with the existing Radix dropdown menu.
  It now satisfies ADR 0003's keyboard, Escape, outside-dismissal, route-dismissal,
  RTL, and focus-restoration contract.
- Reserved the theme trigger's 44px footprint during hydration. Because Phase 3.A
  exposes it on phones, returning `null` before mount shifted the adjacent profile
  control after hydration.
- Made the phone More control visibly represent a current destination inside its
  sheet while keeping `aria-current="page"` on the exact destination link.
- Contained touch overscroll inside the shared navigation sheet and added browser
  coverage for the corrected overlay and hidden-route states in both locales.

## Acceptance matrix

| Requirement                                        | Result | Evidence                                                                                       |
| -------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| Every destination is reachable in every shell mode | Pass   | One catalog; phone, 768px/1024px tablet, and 1280px/1440px desktop browser checks              |
| No shell-level page overflow                       | Pass   | 320px plus the full English/Arabic shell matrix                                                |
| Accessible overlay behavior                        | Pass   | Focus, Escape, backdrop/outside dismissal, route dismissal, Back, and focus restoration checks |
| Fixed controls do not cover content                | Pass   | Bottom-clearance and simulated safe-area checks                                                |
| Labels and targets remain usable                   | Pass   | 200% text zoom, 12px label floor, and 44px target checks                                       |
| RTL and nested active state agree                  | Pass   | Arabic owner project plus catalog unit and `aria-current` browser checks                       |

## Final verification gates

| Command                    | Result                                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| `npm run check`            | Formatting, ESLint, TypeScript, 103 unit tests, and the Next.js 16.3.3 production build passed |
| `npm run test:phase-1a`    | 167 browser tests passed; 2 intentional Member settings skips                                  |
| `npm run test:read-models` | 15 financial characterization snapshots passed                                                 |
| `npm run test:query-plans` | Expense-range and current-Revision planner assertions passed                                   |
| `npm run supabase:test:db` | 139 pgTAP assertions across 11 files passed                                                    |
| `supabase db lint`         | Public schema returned no errors                                                               |
| `npm audit --omit=dev`     | 0 runtime dependency vulnerabilities                                                           |

Fixture cleanup was checked separately: 0 Phase 1.A browser Households, 0 Phase 2.B
characterization Households, and the append-only Monthly Plan trigger enabled normally.

The audited Dashboard route is 60.8 KiB gzip and Settings is 72.0 KiB gzip, increases
of 3.3 KiB and 3.2 KiB respectively from the Phase 1 baseline. Both remain below the
documented 10 KiB regression budget. The measured CLS matrix remains below the 0.1
release target.

## Phase 3.B handoff

Do not reopen the shell architecture unless a Phase 3.B page audit proves a real
navigation defect. Next, build only responsive primitives with repeated consumers and
adapt all 18 pages across the recorded viewport/locale matrix. `/reports` and
`/settings` retain explicit page-content overflow ceilings; Phase 3.B must remove
those allowances rather than raise them. Preserve the 14-entry route catalog, the
additive `shell: 1200px` breakpoint, and every verification gate above.
