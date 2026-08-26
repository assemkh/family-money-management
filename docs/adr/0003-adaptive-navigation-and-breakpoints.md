# 0003 — Adaptive navigation and breakpoints

**Status:** Accepted
**Date:** 2026-08-26
**Context:** Phase 1.B of [`docs/refactor_responsive_perofrmance_plan.md`](../refactor_responsive_perofrmance_plan.md)
**Terms:** [`CONTEXT.md`](../../CONTEXT.md)

## Context

The application has 14 authenticated destinations. On a phone, five are reachable.

[`components/layout/app-sidebar.tsx`](../../components/layout/app-sidebar.tsx)
renders a 17.5rem fixed sidebar listing all 14, shown from `lg` (1024px) upward.
[`components/layout/mobile-navigation.tsx`](../../components/layout/mobile-navigation.tsx)
renders a five-item bar below `lg`: Dashboard, Expenses, an Add-expense button,
Income, and Accounts. Monthly Plan, Goals, Transfers, Assets, Investments,
Liabilities, Recurring, Net Worth, and Reports have no phone entry point at all.
Settings and Change password are reachable only through the header profile menu.

The Accounts item compounds this. It styles itself active for eleven different
pathnames while declaring `aria-current="page"` on `/accounts` alone — so a sighted
user is told they are somewhere they are not, and a screen-reader user is told
nothing. The visual predicate and the semantic predicate are two separate literals in
one component, which is why they drifted.

The measured and structural debt behind the change:

| Observation             | Current value                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------- |
| Shell breakpoint        | Sidebar appears at `lg` = 1024px; nothing sits between phone and desktop              |
| Sidebar width at 1024px | 17.5rem (280px) of 1024px, leaving ~744px of content                                  |
| Bottom-nav label size   | `text-[0.65rem]` = 10.4px, with `max-w-16 truncate`                                   |
| Safe area               | Bar is `bottom-3`; `env(safe-area-inset-bottom)` is never consulted                   |
| Viewport unit           | Shell uses `min-h-screen`, not dynamic viewport height                                |
| Theme control           | Hidden below `sm` (640px) and absent from the profile menu                            |
| Profile menu            | Native `<details>`, no Escape, outside-click, or focus-return strategy                |
| Breakpoint usage        | `sm:` 229, `xl:` 53, `lg:` 33, `md:` 9, `2xl:` 1                                      |
| Recorded overflow debt  | Dashboard 650px document below 650px; Reports 602px at 375px; Settings 565px at 375px |

Tailwind's default scale is unmodified: `sm` 640, `md` 768, `lg` 1024, `xl` 1280,
`2xl` 1536. Those 229 `sm:` and 33 `lg:` usages are content-layout decisions. Any
redefinition of the existing scale would silently restyle 18 pages, which is not a
navigation change.

## Decision

**1. Three shell modes, with one new named breakpoint.**

| Mode    | Range            | Navigation                                              |
| ------- | ---------------- | ------------------------------------------------------- |
| Phone   | below 768px      | Bottom bar with frequent destinations plus a More sheet |
| Tablet  | 768px – 1199px   | Compact icon rail or drawer; full labels on open        |
| Desktop | 1200px and above | Full 17.5rem sidebar                                    |

The phone/tablet boundary reuses Tailwind's existing `md` (768px). The
tablet/desktop boundary is a **new additive screen** — `shell: 1200px` — because no
default breakpoint sits where the sidebar stops squeezing content. Adding a screen
is additive; redefining `sm`/`lg` is not, and is forbidden by this record.

The sidebar moves from `lg:` to `shell:`, and `lg:ps-[17.5rem]` moves with it. Every
other existing `sm:`/`md:`/`lg:`/`xl:` class keeps its current meaning. Shell
breakpoints and content breakpoints are separate concerns and stay separately named.

**2. One route catalog is the source of truth.**
A single module declares every destination once: path, message key, icon, group,
active-match rule, and required role. Sidebar, tablet rail, phone bar, More sheet,
and any future surface all render from it. A destination that is not in the catalog
does not exist; adding a route means adding a catalog entry, not editing four
components.

**3. Every destination is reachable at every viewport.**
The phone bar keeps a small set of frequent actions. Everything else lives behind an
explicit **More** control that opens a sheet listing all remaining destinations,
grouped as the sidebar groups them. The Accounts catch-all is removed. "It's in the
sidebar" stops being an answer for a phone user.

**4. Active state has exactly one predicate.**
The catalog entry defines its own match rule — exact, or path prefix for nested
destinations. Visual active styling and `aria-current="page"` are both derived from
that single rule, in one place. At most one destination is active at a time. A
component may not carry its own literal list of pathnames.

**5. Touch and text minimums.**
Interactive navigation targets are at least 44×44 CSS pixels. Navigation labels are
at least `0.75rem` (12px). Labels wrap or shrink to two lines rather than truncating
mid-word; a truncated label must still expose its full text to assistive technology.
Long English and Arabic labels are verified at 200% text zoom.

**6. Fixed navigation respects the real viewport.**
The shell uses dynamic viewport height (`100dvh`) rather than `min-h-screen`. The
bottom bar adds `env(safe-area-inset-bottom)` to its own padding, and page content
reserves matching bottom space, so no fixed bar covers content, a focused control, or
a primary submit button on a device with a home indicator or a browser chrome bar.

**7. The More sheet is a dialog, and behaves like one.**
It has dialog semantics, a focus trap while open, Escape and outside-click to close,
focus returned to the control that opened it, and navigation-safe behavior so browser
Back does not leave a stale overlay. The same rules apply to the profile menu, which
stops being a bare `<details>` disclosure.

**8. Theme and Settings are reachable at every width.**
The theme control is never hidden without a replacement in a reachable menu. Settings
appears in the phone More sheet, not only in the profile menu.

**9. Logical properties only.**
Navigation uses `start`/`end` spacing and logical borders so Arabic RTL is a
direction change, not a second layout. Every navigation change is verified in both
directions.

**10. Page-level horizontal overflow at 320px is a release blocker.**
The recorded allowances for Dashboard, Reports, and Settings in
`tests/e2e/responsive-baseline.spec.ts` are existing defects, not budgets. Phase 3
lowers each to viewport width plus the one-pixel rounding tolerance and deletes the
allowance in the same change. A ceiling is never raised to make a regression pass.

## Consequences

- One new Tailwind screen, and the sidebar's breakpoint moves. Content layout is
  untouched, so the visual identity of all 18 pages is preserved by construction.
- Landscape tablets at 1024px gain roughly 200px of content width and keep compact
  navigation, which is the width the audit found most squeezed.
- The catalog makes navigation data, so role filtering (Owner-only Settings surfaces)
  and label translation happen once rather than per surface.
- A real dialog for the More sheet costs focus-management code that `<details>` gave
  for free — and gives back keyboard and screen-reader behavior that `<details>`
  never provided here.
- Larger labels and safe-area padding make the bottom bar taller. Page bottom padding
  must be derived from the bar, not hard-coded, or content will hide behind it.

## Rejected alternatives

**Keep the sidebar at `lg` (1024px).** No new breakpoint, no config change. Rejected:
1024px is the exact width the audit flagged as squeezed, and it leaves the
phone/tablet gap unfixed.

**Redefine Tailwind's `lg` to 1200px.** One-line change, no new name. Rejected: it
silently restyles all 33 existing `lg:` usages across 18 pages — a visual rewrite
disguised as a navigation fix.

**Add a sixth item to the phone bar instead of a More sheet.** Cheapest possible fix.
Rejected: six 10px labels at 320px in Arabic is worse than five, and nine
destinations would still be unreachable.

**Hamburger drawer on phone and tablet, no bottom bar.** Consistent and simple.
Rejected: it puts the household's most frequent actions — add expense, add income —
two taps behind a menu, on the device where they are used most.

**A tablet drawer instead of a rail.** Still permitted as the Phase 3.A
implementation choice; the range and behavior contract above is what this record
fixes. Whichever is built must keep navigation reachable without covering content.

## Implementation notes

_Phase 3.A, 2026-08-26._ The record is implemented. Three deviations, recorded rather
than applied silently.

**The catalog carries no `requiresOwner` field.** Decision 2 lists permissions among
what the catalog drives, but no destination is Owner-only — `/settings` renders for
Members with `canManage` false. A field that is false for all fourteen entries fails
the same deletion test this document applies elsewhere, so it arrives with the first
Owner-only destination.

**The tablet mode is an icon rail, not a labeled drawer.** Decision 1 allowed either.
The rail shows all fourteen destinations directly with accessible names and titles, and
the shared sheet supplies the full labels on open, satisfying "full labels on open". A
labeled vertical rail of fourteen entries does not fit 768px of height.

**Sidebar groups are unchanged.** Today's Overview and Private workspace split is kept,
because regrouping is a visual change this record's identity-preservation intent does
not ask for.

**One sheet serves both modes.** The phone More button and the tablet rail open the
same `<dialog>`; a second component would have been the drift this record exists to
prevent. Native `showModal()` supplies the focus trap, Escape handling, and focus
restoration; the component adds backdrop dismissal and derives its open state from the
route so Back can never reveal a stale overlay.

**The profile menu now uses the existing Radix dropdown primitive.** It closes on
Escape, outside interaction, and navigation, manages menu keyboard interaction, and
restores focus to its trigger. The same browser contract that covers the sheet covers
this second overlay, as decision 7 requires.

**The Dashboard overflow allowance is deleted, not lowered.** It was caused by the
trend chart's `min-w-[36rem]` escaping its `overflow-x-auto` container, because the
grid item above defaulted to `min-width: auto`. `/reports` and `/settings` still
overflow from page content and remain Phase 3.B's work under decision 10.

## Verification

- Every catalog destination is reachable at 320, 375, 430, 768, 1024, 1280, 1440.
- Visual active state and `aria-current` agree on every route, including nested ones.
- No page-level horizontal overflow at any matrix width, in English and Arabic.
- Navigation labels stay readable at 200% text zoom in both languages.
- Keyboard and screen-reader tests cover open, navigate, close, and focus restore for
  the More sheet and the profile menu.
- No fixed bar covers content or a focused control with safe-area insets simulated.
- Existing `sm:`/`md:`/`lg:`/`xl:` class meanings are unchanged; only additive screens
  were introduced.
