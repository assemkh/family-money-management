# Module: authenticated household action

**Proposed file:** `lib/actions/execute-household-action.ts`
**Status:** Interface specified in Phase 1.B; implemented in Phase 2 and completed in Phase 4.A
**Terms:** [`CONTEXT.md`](../../CONTEXT.md)
**Governed by:** [ADR 0001](../adr/0001-financial-source-of-truth.md), [ADR 0002](../adr/0002-authenticated-rendering-and-cache-safety.md)
**Invalidation source:** [mutation dependency map](mutation-dependency-map.md)

One Module that turns a validated household mutation into a Server Action. It owns
authentication, optional Owner authorization, Zod parsing, field-error shaping,
database-error translation, and declarative invalidation. The domain work — what to
write and what to say afterwards — stays explicit in each action.

## The problem it removes

Measured across [`app/actions/finance.ts`](../../app/actions/finance.ts) (808 lines)
and [`app/actions/settings.ts`](../../app/actions/settings.ts) (829 lines):

| Repeated element                                                  | finance.ts | settings.ts |
| ----------------------------------------------------------------- | ---------: | ----------: |
| `schema.safeParse(...)` followed by `return invalidFields(...)`   |         16 |          13 |
| Private context reader (`readActionContext` / `readOwnerContext`) |         16 |          13 |
| Literal "Your session expired" / "Only the … owner" refusal       |         16 |          13 |
| `revalidatePath(...)` calls                                       |         38 |          28 |
| `{ status: "error", … }` returns                                  |         39 |          44 |

Twenty-nine of the 30 mutations open with the same four steps in the same order. The
two files each define their own `invalidFields()` helper with different copy, and
their own context reader differing by one role comparison. `safeDatabaseMessage()`
maps thirteen database messages to user-facing copy in `finance.ts` and does not exist
in `settings.ts`, which instead has `configurationError()` for one Postgres code.

The consequence the audit named is the 66 hand-written `revalidatePath` calls: eleven
mutations declare a narrower set than they affect, because there is nowhere for that
knowledge to live except inside each action.

## Interface

```ts
import type { z } from "zod";
import type { HouseholdContext } from "@/lib/auth/household-context";
import type { ReadModelKey } from "@/lib/finance/read-models/registry";

export type ActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

/** What a domain handler returns. A rejection is a normal outcome, not an exception. */
export type ActionOutcome =
  | { ok: true; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export type HouseholdActionSpec<TSchema extends z.ZodType> = {
  /** Zod schema for the submitted form. */
  schema: TSchema;
  /** Form field names, read with formData.get() so null stays null. */
  fields: readonly string[];
  /** Escape hatch for forms that are not a flat get() map, such as checkboxes. */
  input?: (formData: FormData) => unknown;
  /** Refuse non-Owners before the handler runs. */
  requireOwner?: boolean;
  /** Read models this mutation can change. Resolved to routes by the registry. */
  affects: readonly ReadModelKey[];
  /** The domain work. Everything above is already done when this runs. */
  run: (input: z.infer<TSchema>, context: HouseholdContext) => Promise<ActionOutcome>;
};

/** Returns a Server Action with the (previousState, formData) signature React expects. */
export function defineHouseholdAction<TSchema extends z.ZodType>(
  spec: HouseholdActionSpec<TSchema>,
): (previousState: ActionState, formData: FormData) => Promise<ActionState>;

/** Shared database-message translation, exported for handlers that need it inline. */
export function safeDatabaseMessage(
  error: { code?: string; message?: string } | null,
  fallback: string,
): string;
```

### What a call site looks like

```ts
export const createTransferAction = defineHouseholdAction({
  schema: transferEntrySchema,
  fields: ["fromAccountId", "toAccountId", "transferDate", "amount", "note"],
  affects: ["cashFlow.transfers", "netWorth.accounts"],
  async run(input, { db }) {
    const { error } = await db.rpc("record_transfer", {
      p_from_account_id: input.fromAccountId,
      p_to_account_id: input.toAccountId,
      p_transfer_date: input.transferDate,
      p_amount: input.amount,
      p_note: input.note,
    });

    if (error) {
      return {
        ok: false,
        message: safeDatabaseMessage(
          error,
          "The transfer could not be saved. Account balances were not changed.",
        ),
      };
    }

    return { ok: true, message: "Transfer completed securely." };
  },
});
```

The RPC call, its arguments, its failure copy, and its success copy stay visible. What
disappears is the parse, the context read, the session refusal, and the three
`revalidatePath` lines that a future reader would have had to keep in sync by hand.

## Why `fields` is a list and not inferred

`formData.get()` returns `null` for a missing field; `Object.fromEntries(formData)`
omits the key and yields `undefined`. Several schemas guard on that difference —
`optionalAmountSchema` and `optionalDateSchema` in
[`lib/finance/validation.ts`](../../lib/finance/validation.ts) preprocess with
`value === "" || value === null`, which `undefined` does not satisfy.

Deriving the list from `schema.shape` would also fail: six of the 29 schemas are
`z.object(...)` wrapped in `.refine()` or `.superRefine()` and expose no `shape`.

So the field list is declared. It is the one piece of per-action parsing that cannot
be inferred without changing validation behavior, and the `input` escape hatch exists
for exactly one current action — `updateDashboardPreferencesAction`, which reads five
checkboxes with `formData.has()`.

## Hidden Implementation responsibility

1. Reading the form into the schema's expected shape, preserving `null` semantics.
2. `safeParse`, and turning a failure into `{ status: "error", fieldErrors }` with one
   consistent message instead of the two that exist today.
3. Resolving the Household context through `readHouseholdContext()`, and returning the
   session-expired state rather than redirecting — a Server Action must return a state
   its form can render.
4. Refusing a `must_change_password` Member, matching current behavior.
5. Refusing a non-Owner when `requireOwner` is set, with one message instead of
   thirteen near-copies.
6. Translating known database errors to safe copy, including the `23505` unique
   violation that `settings.ts` handles separately today.
7. Resolving `affects` to routes through the read-model registry and calling
   `revalidatePath` for each — the mechanism that replaces the 66 hand-written calls.
8. Returning `{ status: "success", message }`.

The Module never decides _what_ to write. It has no knowledge of income, expenses,
accounts, or plans.

## Consumers

All 29 form-backed mutations: 16 in `app/actions/finance.ts`, 13 in
`app/actions/settings.ts`.

Five actions stay outside this Interface, and that is deliberate:

- `revokeOtherSessionsAction` takes no form input, writes no table, and invalidates
  nothing. Wrapping it would add a schema and an `affects: []` to say nothing.
- `loginAction` and `changePasswordAction` end in `redirect()`, not a state, and run
  _before_ a Household context exists. `forgotPasswordAction` and `logoutAction` are
  the same shape.

A Module that had to special-case those four would be a worse Module.

## Deletion test

**Would removing this Module leave callers just as readable?** No — and the map proves
the cost is not only readability.

Deleted, each of the 29 actions returns to a 4-step preamble it must get right, and
the invalidation knowledge returns to 66 hand-written path strings with no owner. That
is precisely the arrangement that produced eleven under-declared mutations, seven
routes missing `/net-worth` and six missing `/reports`. The Module is justified because
`affects` makes a wrong declaration _visible in one line_ instead of invisible across
three.

Parts that **fail** the deletion test and are therefore not proposed:

- A per-domain wrapper such as `defineFinanceAction` / `defineSettingsAction`
  differing only by default copy. One Interface with `requireOwner` covers both; two
  would drift the way `invalidFields()` already has.
- A `revalidateReadModels(keys)` helper exported for direct use. If an action needs it
  outside `defineHouseholdAction`, the action is not using this Module, and the
  declaration escapes the mechanism.
- An `ActionResult` class hierarchy. The discriminated union is already exhaustive and
  needs no methods.
- A generic `withAuth()` that returns the context and nothing else. That is
  `readHouseholdContext()`, which already exists.

## Rules this Module must hold

- **Validation is never the only check.** Zod shapes input and produces field errors;
  the invariants stay in PostgreSQL. See ADR 0001, decision 1.
- **Database messages are translated, never forwarded.** A raw Postgres message may
  name a column, a constraint, or a value. The known-message table maps to safe copy;
  anything unmapped falls back to the action's own sentence.
- **`affects` names read models, not routes.** Routes are resolved by the registry.
  An action that hard-codes a path is bypassing the mechanism.
- **Owner refusal happens before the handler runs**, so an Owner-only mutation cannot
  read Household data on the way to being refused.
- **Failure copy states what did not change.** The existing actions already do this
  ("Account balances were not changed"); the Module must not flatten it into a generic
  error.

## Sequencing

The Interface is specified now so Phase 2 can move call sites without redesigning it,
but it lands in two steps:

1. **Phase 2.A/2.B** — introduce `defineHouseholdAction` with `affects` accepted and
   resolved to the _currently declared_ paths. Behavior is identical; the shape moves.
2. **Phase 4.A** — switch the registry to the full dependency map, closing the eleven
   gaps in one reviewable change with the invalidation tests described in the map.

Splitting it keeps the mechanical refactor separate from the behavior fix, so a
regression in either is attributable.
